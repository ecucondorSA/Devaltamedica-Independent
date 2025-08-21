import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAuthenticatedRoute } from '@/lib/middleware/UnifiedAuth';
import { createSuccessResponse, createErrorResponse } from '@/lib/response-helpers';
import MarketplaceService from '@/services/marketplace.service';

import { logger } from '@altamedica/shared/services/logger.service';
// Schemas
const ApplyToListingSchema = z.object({
  coverLetter: z.string().min(10, 'Cover letter must be at least 10 characters'),
  resume: z.string().optional(), // Could be a URL or base64 encoded
  additionalInfo: z.string().optional(),
  availabilityDate: z.string().datetime().optional(),
  expectedSalary: z.number().optional()
});

// POST /api/v1/marketplace/listings/[id]/apply - Apply to a listing
export const POST = createAuthenticatedRoute(
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
      const validation = ApplyToListingSchema.safeParse(body);
      
      if (!validation.success) {
        return NextResponse.json(
          createErrorResponse('INVALID_REQUEST_BODY', 'Invalid request body', {
            errors: validation.error.flatten().fieldErrors
          }),
          { status: 400 }
        );
      }
      
      const applicationData = validation.data;
      const currentUserId = authContext.user?.uid!;
      const currentUserRole = authContext.user?.role;
      
      logger.info(`[Marketplace] Applying to listing ${id}`);
      
      // Only doctors can apply to listings
      if (currentUserRole !== 'doctor' && currentUserRole !== 'admin') {
        return NextResponse.json(
          createErrorResponse('FORBIDDEN', 'Only doctors can apply to marketplace listings'),
          { status: 403 }
        );
      }
      
      // Check if listing exists and is active
      const listing = await MarketplaceService.getListing(id);
      
      if (!listing) {
        return NextResponse.json(
          createErrorResponse('LISTING_NOT_FOUND', 'Listing not found'),
          { status: 404 }
        );
      }
      
      if (listing.status !== 'active') {
        return NextResponse.json(
          createErrorResponse('LISTING_NOT_ACTIVE', 'This listing is no longer accepting applications'),
          { status: 400 }
        );
      }
      
      // Check if user has already applied
      const existingApplication = await MarketplaceService.getApplicationByUserAndListing(currentUserId, id);
      
      if (existingApplication) {
        return NextResponse.json(
          createErrorResponse('ALREADY_APPLIED', 'You have already applied to this listing'),
          { status: 409 }
        );
      }
      
      const application = await MarketplaceService.createApplication({
        listingId: id,
        applicantId: currentUserId,
        ...applicationData,
        status: 'pending'
      });
      
      logger.info(`[Marketplace] Application created: ${application.id}`);
      
      return NextResponse.json(
        createSuccessResponse(application, 'Application submitted successfully'),
        { status: 201 }
      );
      
    } catch (error) {
      logger.error('[Marketplace] Error applying to listing:', undefined, error);
      
      if (error instanceof Error && error.message.includes('already applied')) {
        return NextResponse.json(
          createErrorResponse('ALREADY_APPLIED', 'You have already applied to this listing'),
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to submit application'),
        { status: 500 }
      );
    }
  },
  {
    allowedRoles: ['doctor', 'admin'],
    auditAction: 'apply_to_marketplace_listing'
  }
);