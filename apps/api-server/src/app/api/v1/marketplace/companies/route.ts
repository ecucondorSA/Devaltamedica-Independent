import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAuthenticatedRoute } from '@/lib/middleware/UnifiedAuth';
import { createSuccessResponse, createErrorResponse } from '@/lib/response-helpers';
import MarketplaceService from '@/services/marketplace.service';

import { logger } from '@altamedica/shared/services/logger.service';
// Schemas
const CreateCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  description: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url().optional(),
  contactEmail: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  size: z.enum(['startup', 'small', 'medium', 'large', 'enterprise']).optional(),
  industry: z.string().optional(),
  specialties: z.array(z.string()).optional().default([])
});

const UpdateCompanySchema = CreateCompanySchema.partial();

// POST /api/v1/marketplace/companies - Create a new company profile
export const POST = createAuthenticatedRoute(
  async (request: NextRequest, authContext) => {
    try {
      logger.info('[Marketplace] Creating new company profile');
      
      const body = await request.json();
      const validation = CreateCompanySchema.safeParse(body);
      
      if (!validation.success) {
        return NextResponse.json(
          createErrorResponse('INVALID_REQUEST_BODY', 'Invalid request body', {
            errors: validation.error.flatten().fieldErrors
          }),
          { status: 400 }
        );
      }
      
      const companyData = validation.data;
      const currentUserId = authContext.user?.uid!;
      const currentUserRole = authContext.user?.role;
      
      // Only companies and admins can create company profiles
      if (currentUserRole !== 'company' && currentUserRole !== 'admin') {
        return NextResponse.json(
          createErrorResponse('FORBIDDEN', 'Only companies can create company profiles'),
          { status: 403 }
        );
      }
      
      const company = await MarketplaceService.createCompany({
        ...companyData,
        ownerId: currentUserId,
        createdBy: currentUserId
      });
      
      logger.info(`[Marketplace] Company created: ${company.id}`);
      
      return NextResponse.json(
        createSuccessResponse(company, 'Company profile created successfully'),
        { status: 201 }
      );
      
    } catch (error) {
      logger.error('[Marketplace] Error creating company:', undefined, error);
      
      if (error instanceof Error && error.message.includes('already exists')) {
        return NextResponse.json(
          createErrorResponse('COMPANY_EXISTS', 'Company with this name already exists'),
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to create company profile'),
        { status: 500 }
      );
    }
  },
  {
    allowedRoles: ['company', 'admin'],
    auditAction: 'create_company_profile'
  }
);

// GET /api/v1/marketplace/companies - Get company listings
export const GET = createAuthenticatedRoute(
  async (request: NextRequest, authContext) => {
    try {
      const url = new URL(request.url);
      const queryParams = {
        location: url.searchParams.get('location') || undefined,
        industry: url.searchParams.get('industry') || undefined,
        size: url.searchParams.get('size') || undefined,
        limit: parseInt(url.searchParams.get('limit') || '20'),
        offset: parseInt(url.searchParams.get('offset') || '0')
      };
      
      logger.info('[Marketplace] Getting company listings');
      
      const companies = await MarketplaceService.getCompanies(queryParams);
      
      return NextResponse.json(
        createSuccessResponse(companies, 'Companies retrieved successfully')
      );
      
    } catch (error) {
      logger.error('[Marketplace] Error getting companies:', undefined, error);
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to retrieve companies'),
        { status: 500 }
      );
    }
  },
  {
    allowedRoles: ['company', 'doctor', 'admin'],
    auditAction: 'get_companies_listing'
  }
);