import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAuthenticatedRoute } from '@/lib/middleware/UnifiedAuth';
import { createSuccessResponse, createErrorResponse } from '@/lib/response-helpers';
import MarketplaceService from '@/services/marketplace.service';

import { logger } from '@altamedica/shared/services/logger.service';
// Schemas
const QueryApplicationsSchema = z.object({
  status: z.enum(['pending', 'reviewing', 'accepted', 'rejected']).optional(),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0)
});

// GET /api/v1/marketplace/listings/[id]/applications - Get applications for a listing
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
      
      const url = new URL(request.url);
      const queryParams = {
        status: url.searchParams.get('status') || undefined,
        limit: parseInt(url.searchParams.get('limit') || '20'),
        offset: parseInt(url.searchParams.get('offset') || '0')
      };
      
      const validation = QueryApplicationsSchema.safeParse(queryParams);
      if (!validation.success) {
        return NextResponse.json(
          createErrorResponse('INVALID_QUERY', 'Invalid query parameters', {
            errors: validation.error.flatten().fieldErrors
          }),
          { status: 400 }
        );
      }
      
      const currentUserId = authContext.user?.uid!;
      const currentUserRole = authContext.user?.role;
      
      logger.info(`[Marketplace] Getting applications for listing ${id}`);
      
      // Check if listing exists and user has access
      const listing = await MarketplaceService.getListing(id);
      
      if (!listing) {
        return NextResponse.json(
          createErrorResponse('LISTING_NOT_FOUND', 'Listing not found'),
          { status: 404 }
        );
      }
      
      // Authorization: only listing owners and admins can view applications
      if (currentUserRole !== 'admin' && listing.createdBy !== currentUserId) {
        return NextResponse.json(
          createErrorResponse('FORBIDDEN', 'You can only view applications for your own listings'),
          { status: 403 }
        );
      }
      
      const applications = await MarketplaceService.getApplicationsForListing(id, validation.data);
      
      return NextResponse.json(
        createSuccessResponse({
          listingId: id,
          applications: applications.applications,
          count: applications.count,
          total: applications.total
        }, 'Applications retrieved successfully')
      );
      
    } catch (error) {
      logger.error('[Marketplace] Error getting applications:', undefined, error);
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to retrieve applications'),
        { status: 500 }
      );
    }
  },
  {
    allowedRoles: ['company', 'admin'],
    auditAction: 'get_listing_applications'
  }
);