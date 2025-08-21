import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAuthenticatedRoute } from '@/lib/middleware/UnifiedAuth';
import { createSuccessResponse, createErrorResponse } from '@/lib/response-helpers';
import MarketplaceService from '@/services/marketplace.service';

import { logger } from '@altamedica/shared/services/logger.service';
// Schemas
const UpdateCompanySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url().optional(),
  contactEmail: z.string().email().optional(),
  phone: z.string().optional(),
  size: z.enum(['startup', 'small', 'medium', 'large', 'enterprise']).optional(),
  industry: z.string().optional(),
  specialties: z.array(z.string()).optional()
});

// GET /api/v1/marketplace/companies/[id] - Get specific company
export const GET = createAuthenticatedRoute(
  async (request: NextRequest, authContext, { params }: { params: { id: string } }) => {
    try {
      const { id } = params;
      
      if (!id) {
        return NextResponse.json(
          createErrorResponse('MISSING_PARAMETER', 'Company ID is required'),
          { status: 400 }
        );
      }
      
      logger.info(`[Marketplace] Getting company ${id}`);
      
      const company = await MarketplaceService.getCompany(id);
      
      if (!company) {
        return NextResponse.json(
          createErrorResponse('COMPANY_NOT_FOUND', 'Company not found'),
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        createSuccessResponse(company, 'Company retrieved successfully')
      );
      
    } catch (error) {
      logger.error('[Marketplace] Error getting company:', undefined, error);
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to retrieve company'),
        { status: 500 }
      );
    }
  },
  {
    allowedRoles: ['company', 'doctor', 'admin'],
    auditAction: 'get_company_profile'
  }
);

// PUT /api/v1/marketplace/companies/[id] - Update company profile
export const PUT = createAuthenticatedRoute(
  async (request: NextRequest, authContext, { params }: { params: { id: string } }) => {
    try {
      const { id } = params;
      
      if (!id) {
        return NextResponse.json(
          createErrorResponse('MISSING_PARAMETER', 'Company ID is required'),
          { status: 400 }
        );
      }
      
      const body = await request.json();
      const validation = UpdateCompanySchema.safeParse(body);
      
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
      
      logger.info(`[Marketplace] Updating company ${id}`);
      
      // Get current company to check ownership
      const currentCompany = await MarketplaceService.getCompany(id);
      
      if (!currentCompany) {
        return NextResponse.json(
          createErrorResponse('COMPANY_NOT_FOUND', 'Company not found'),
          { status: 404 }
        );
      }
      
      // Authorization: only company owners and admins can update
      if (currentUserRole !== 'admin' && currentCompany.ownerId !== currentUserId) {
        return NextResponse.json(
          createErrorResponse('FORBIDDEN', 'You can only update your own company profile'),
          { status: 403 }
        );
      }
      
      const updatedCompany = await MarketplaceService.updateCompany(id, {
        ...updateData,
        updatedBy: currentUserId
      });
      
      logger.info(`[Marketplace] Company ${id} updated successfully`);
      
      return NextResponse.json(
        createSuccessResponse(updatedCompany, 'Company profile updated successfully')
      );
      
    } catch (error) {
      logger.error('[Marketplace] Error updating company:', undefined, error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        return NextResponse.json(
          createErrorResponse('COMPANY_NOT_FOUND', 'Company not found'),
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to update company profile'),
        { status: 500 }
      );
    }
  },
  {
    allowedRoles: ['company', 'admin'],
    auditAction: 'update_company_profile'
  }
);