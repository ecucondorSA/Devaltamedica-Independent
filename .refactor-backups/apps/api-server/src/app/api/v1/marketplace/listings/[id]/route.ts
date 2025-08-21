import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAuthenticatedRoute } from '@/lib/middleware/UnifiedAuth';
import { createSuccessResponse, createErrorResponse } from '@/lib/response-helpers';
import MarketplaceService from '@/services/marketplace.service';

import { logger } from '@altamedica/shared/services/logger.service';
// Schemas
const UpdateListingSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(10).optional(),
  category: z.enum(['job', 'service', 'equipment', 'consultation']).optional(),
  type: z.enum(['full-time', 'part-time', 'contract', 'consultation', 'one-time']).optional(),
  location: z.string().optional(),
  remote: z.boolean().optional(),
  requirements: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  salaryRange: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    currency: z.string().optional()
  }).optional(),
  applicationDeadline: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['active', 'paused', 'closed']).optional()
});

// GET /api/v1/marketplace/listings/[id] - Get specific listing
export const GET = createAuthenticatedRoute(
  async (request: NextRequest, authContext, { params }: { params: { id: string } }) => {
    try {
      const { id } = params;
      
      if (!id) {
        return NextResponse.json(
          createErrorResponse('MISSING_PARAMETER', 'Listing ID is required'),
          { status: 400 }
        );
      }
      
      logger.info(`[Marketplace] Getting listing ${id}`);
      
      const listing = await MarketplaceService.getListing(id);
      
      if (!listing) {
        return NextResponse.json(
          createErrorResponse('LISTING_NOT_FOUND', 'Marketplace listing not found'),
          { status: 404 }
        );
      }
      
      // Increment view count for analytics
      await MarketplaceService.incrementListingViews(id);
      
      return NextResponse.json(
        createSuccessResponse(listing, 'Listing retrieved successfully')
      );
      
    } catch (error) {
      logger.error('[Marketplace] Error getting listing:', undefined, error);
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to retrieve listing'),
        { status: 500 }
      );
    }
  },
  {
    allowedRoles: ['company', 'doctor', 'admin'],
    auditAction: 'get_marketplace_listing'
  }
);

// PUT /api/v1/marketplace/listings/[id] - Update listing
export const PUT = createAuthenticatedRoute(
  async (request: NextRequest, authContext, { params }: { params: { id: string } }) => {
    try {
      const { id } = params;
      
      if (!id) {
        return NextResponse.json(
          createErrorResponse('MISSING_PARAMETER', 'Listing ID is required'),
          { status: 400 }
        );
      }
      
      const body = await request.json();
      const validation = UpdateListingSchema.safeParse(body);
      
      if (!validation.success) {
        return NextResponse.json(
          createErrorResponse('INVALID_REQUEST_BODY', 'Invalid request body', {
            errors: validation.error.flatten().fieldErrors
          }),
          { status: 400 }
        );
      }
      
      const updateData = validation.data;
      const currentUserId = authContext.user?.uid!;
      const currentUserRole = authContext.user?.role;
      
      logger.info(`[Marketplace] Updating listing ${id}`);
      
      // Get current listing to check ownership
      const currentListing = await MarketplaceService.getListing(id);
      
      if (!currentListing) {
        return NextResponse.json(
          createErrorResponse('LISTING_NOT_FOUND', 'Listing not found'),
          { status: 404 }
        );
      }
      
      // Authorization: only listing owners and admins can update
      if (currentUserRole !== 'admin' && currentListing.createdBy !== currentUserId) {
        return NextResponse.json(
          createErrorResponse('FORBIDDEN', 'You can only update your own listings'),
          { status: 403 }
        );
      }
      
      const updatedListing = await MarketplaceService.updateListing(id, {
        ...updateData,
        updatedBy: currentUserId
      });
      
      logger.info(`[Marketplace] Listing ${id} updated successfully`);
      
      return NextResponse.json(
        createSuccessResponse(updatedListing, 'Listing updated successfully')
      );
      
    } catch (error) {
      logger.error('[Marketplace] Error updating listing:', undefined, error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        return NextResponse.json(
          createErrorResponse('LISTING_NOT_FOUND', 'Listing not found'),
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to update listing'),
        { status: 500 }
      );
    }
  },
  {
    allowedRoles: ['company', 'admin'],
    auditAction: 'update_marketplace_listing'
  }
);

// DELETE /api/v1/marketplace/listings/[id] - Delete listing
export const DELETE = createAuthenticatedRoute(
  async (request: NextRequest, authContext, { params }: { params: { id: string } }) => {
    try {
      const { id } = params;
      
      if (!id) {
        return NextResponse.json(
          createErrorResponse('MISSING_PARAMETER', 'Listing ID is required'),
          { status: 400 }
        );
      }
      
      const currentUserId = authContext.user?.uid!;
      const currentUserRole = authContext.user?.role;
      
      logger.info(`[Marketplace] Deleting listing ${id}`);
      
      // Get current listing to check ownership
      const currentListing = await MarketplaceService.getListing(id);
      
      if (!currentListing) {
        return NextResponse.json(
          createErrorResponse('LISTING_NOT_FOUND', 'Listing not found'),
          { status: 404 }
        );
      }
      
      // Authorization: only listing owners and admins can delete
      if (currentUserRole !== 'admin' && currentListing.createdBy !== currentUserId) {
        return NextResponse.json(
          createErrorResponse('FORBIDDEN', 'You can only delete your own listings'),
          { status: 403 }
        );
      }
      
      await MarketplaceService.deleteListing(id);
      
      logger.info(`[Marketplace] Listing ${id} deleted successfully`);
      
      return NextResponse.json(
        createSuccessResponse(null, 'Listing deleted successfully')
      );
      
    } catch (error) {
      logger.error('[Marketplace] Error deleting listing:', undefined, error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        return NextResponse.json(
          createErrorResponse('LISTING_NOT_FOUND', 'Listing not found'),
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to delete listing'),
        { status: 500 }
      );
    }
  },
  {
    allowedRoles: ['company', 'admin'],
    auditAction: 'delete_marketplace_listing'
  }
);