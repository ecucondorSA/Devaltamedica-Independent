import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAuthenticatedRoute } from '@/lib/middleware/UnifiedAuth';
import { createSuccessResponse, createErrorResponse } from '@/lib/response-helpers';
import MarketplaceService from '@/services/marketplace.service';

import { logger } from '@altamedica/shared/services/logger.service';
// Schemas
const UpdateApplicationSchema = z.object({
  status: z.enum(['pending', 'reviewing', 'accepted', 'rejected']),
  reviewNotes: z.string().optional(),
  interviewDate: z.string().datetime().optional(),
  rejectionReason: z.string().optional()
});

// PUT /api/v1/marketplace/applications/[id] - Update application status
export const PUT = createAuthenticatedRoute(
  async (request: NextRequest, authContext, { params }: { params: { id: string } }) => {
    try {
      const { id } = params;
      
      if (!id) {
        return NextResponse.json(
          createErrorResponse('MISSING_PARAMETER', 'Application ID is required'),
          { status: 400 }
        );
      }
      
      const body = await request.json();
      const validation = UpdateApplicationSchema.safeParse(body);
      
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
      
      logger.info(`[Marketplace] Updating application ${id}`);
      
      // Get current application to check permissions
      const currentApplication = await MarketplaceService.getApplication(id);
      
      if (!currentApplication) {
        return NextResponse.json(
          createErrorResponse('APPLICATION_NOT_FOUND', 'Application not found'),
          { status: 404 }
        );
      }
      
      // Get the listing to check ownership
      const listing = await MarketplaceService.getListing(currentApplication.listingId);
      
      if (!listing) {
        return NextResponse.json(
          createErrorResponse('LISTING_NOT_FOUND', 'Associated listing not found'),
          { status: 404 }
        );
      }
      
      // Authorization: only listing owners and admins can update applications
      if (currentUserRole !== 'admin' && listing.createdBy !== currentUserId) {
        return NextResponse.json(
          createErrorResponse('FORBIDDEN', 'You can only update applications for your own listings'),
          { status: 403 }
        );
      }
      
      // Validation for status changes
      if (updateData.status === 'rejected' && !updateData.rejectionReason) {
        return NextResponse.json(
          createErrorResponse('REJECTION_REASON_REQUIRED', 'Rejection reason is required when rejecting an application'),
          { status: 400 }
        );
      }
      
      const updatedApplication = await MarketplaceService.updateApplication(id, {
        ...updateData,
        reviewedBy: currentUserId,
        reviewedAt: new Date()
      });
      
      logger.info(`[Marketplace] Application ${id} updated to status: ${updateData.status}`);
      
      // Send notification to applicant about status change
      await MarketplaceService.notifyApplicantStatusChange(updatedApplication);
      
      return NextResponse.json(
        createSuccessResponse(updatedApplication, 'Application updated successfully')
      );
      
    } catch (error) {
      logger.error('[Marketplace] Error updating application:', undefined, error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        return NextResponse.json(
          createErrorResponse('APPLICATION_NOT_FOUND', 'Application not found'),
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to update application'),
        { status: 500 }
      );
    }
  },
  {
    allowedRoles: ['company', 'admin'],
    auditAction: 'update_marketplace_application'
  }
);

// GET /api/v1/marketplace/applications/[id] - Get specific application
export const GET = createAuthenticatedRoute(
  async (request: NextRequest, authContext, { params }: { params: { id: string } }) => {
    try {
      const { id } = params;
      
      if (!id) {
        return NextResponse.json(
          createErrorResponse('MISSING_PARAMETER', 'Application ID is required'),
          { status: 400 }
        );
      }
      
      const currentUserId = authContext.user?.uid!;
      const currentUserRole = authContext.user?.role;
      
      logger.info(`[Marketplace] Getting application ${id}`);
      
      const application = await MarketplaceService.getApplication(id);
      
      if (!application) {
        return NextResponse.json(
          createErrorResponse('APPLICATION_NOT_FOUND', 'Application not found'),
          { status: 404 }
        );
      }
      
      // Authorization: applicants can view their own applications, companies can view applications for their listings
      if (currentUserRole !== 'admin') {
        if (currentUserRole === 'doctor' && application.applicantId !== currentUserId) {
          return NextResponse.json(
            createErrorResponse('FORBIDDEN', 'You can only view your own applications'),
            { status: 403 }
          );
        }
        
        if (currentUserRole === 'company') {
          const listing = await MarketplaceService.getListing(application.listingId);
          if (!listing || listing.createdBy !== currentUserId) {
            return NextResponse.json(
              createErrorResponse('FORBIDDEN', 'You can only view applications for your own listings'),
              { status: 403 }
            );
          }
        }
      }
      
      return NextResponse.json(
        createSuccessResponse(application, 'Application retrieved successfully')
      );
      
    } catch (error) {
      logger.error('[Marketplace] Error getting application:', undefined, error);
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to retrieve application'),
        { status: 500 }
      );
    }
  },
  {
    allowedRoles: ['company', 'doctor', 'admin'],
    auditAction: 'get_marketplace_application'
  }
);