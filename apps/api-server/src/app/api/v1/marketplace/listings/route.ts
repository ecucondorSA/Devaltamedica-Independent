import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAuthenticatedRoute } from '@/lib/middleware/UnifiedAuth';
import { createSuccessResponse, createErrorResponse } from '@/lib/response-helpers';
import MarketplaceService from '@/services/marketplace.service';

import { logger } from '@altamedica/shared/services/logger.service';
// Schemas
const CreateListingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.enum(['job', 'service', 'equipment', 'consultation']),
  type: z.enum(['full-time', 'part-time', 'contract', 'consultation', 'one-time']),
  location: z.string().optional(),
  remote: z.boolean().optional().default(false),
  requirements: z.array(z.string()).optional().default([]),
  benefits: z.array(z.string()).optional().default([]),
  salaryRange: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    currency: z.string().optional().default('USD')
  }).optional(),
  applicationDeadline: z.string().datetime().optional(),
  tags: z.array(z.string()).optional().default([]),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium')
});

const QueryListingsSchema = z.object({
  category: z.string().optional(),
  type: z.string().optional(),
  location: z.string().optional(),
  remote: z.boolean().optional(),
  companyId: z.string().optional(),
  limit: z.number().min(1).max(50).optional().default(20),
  offset: z.number().min(0).optional().default(0)
});

// POST /api/v1/marketplace/listings - Create a new marketplace listing
export const POST = createAuthenticatedRoute(
  async (request: NextRequest, authContext) => {
    try {
      logger.info('[Marketplace] Creating new listing');
      
      const body = await request.json();
      const validation = CreateListingSchema.safeParse(body);
      
      if (!validation.success) {
        return NextResponse.json(
          createErrorResponse('INVALID_REQUEST_BODY', 'Invalid request body', {
            errors: validation.error.flatten().fieldErrors
          }),
          { status: 400 }
        );
      }
      
      const listingData = validation.data;
      const currentUserId = authContext.user?.uid!;
      const currentUserRole = authContext.user?.role;
      const companyId = authContext.user?.companyId;
      
      // Only companies can create listings
      if (currentUserRole !== 'company' && currentUserRole !== 'admin') {
        return NextResponse.json(
          createErrorResponse('FORBIDDEN', 'Only companies can create marketplace listings'),
          { status: 403 }
        );
      }
      
      // For company users, ensure they have a companyId
      if (currentUserRole === 'company' && !companyId) {
        return NextResponse.json(
          createErrorResponse('COMPANY_REQUIRED', 'Company association required to create listings'),
          { status: 400 }
        );
      }
      
      const listing = await MarketplaceService.createListing({
        ...listingData,
        companyId: companyId!,
        createdBy: currentUserId,
        status: 'active'
      });
      
      logger.info(`[Marketplace] Listing created: ${listing.id}`);
      
      return NextResponse.json(
        createSuccessResponse(listing, 'Marketplace listing created successfully'),
        { status: 201 }
      );
      
    } catch (error) {
      logger.error('[Marketplace] Error creating listing:', undefined, error);
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to create marketplace listing'),
        { status: 500 }
      );
    }
  },
  {
    allowedRoles: ['company', 'admin'],
    auditAction: 'create_marketplace_listing'
  }
);

// GET /api/v1/marketplace/listings - Get marketplace listings
export const GET = createAuthenticatedRoute(
  async (request: NextRequest, authContext) => {
    try {
      const url = new URL(request.url);
      const queryParams = {
        category: url.searchParams.get('category') || undefined,
        type: url.searchParams.get('type') || undefined,
        location: url.searchParams.get('location') || undefined,
        remote: url.searchParams.get('remote') === 'true',
        companyId: url.searchParams.get('companyId') || undefined,
        limit: parseInt(url.searchParams.get('limit') || '20'),
        offset: parseInt(url.searchParams.get('offset') || '0')
      };
      
      const validation = QueryListingsSchema.safeParse(queryParams);
      if (!validation.success) {
        return NextResponse.json(
          createErrorResponse('INVALID_QUERY', 'Invalid query parameters', {
            errors: validation.error.flatten().fieldErrors
          }),
          { status: 400 }
        );
      }
      
      logger.info('[Marketplace] Getting listings with filters:', queryParams);
      
      const listings = await MarketplaceService.getListings(validation.data);
      
      return NextResponse.json(
        createSuccessResponse(listings, 'Marketplace listings retrieved successfully')
      );
      
    } catch (error) {
      logger.error('[Marketplace] Error getting listings:', undefined, error);
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to retrieve marketplace listings'),
        { status: 500 }
      );
    }
  },
  {
    allowedRoles: ['company', 'doctor', 'admin'],
    auditAction: 'get_marketplace_listings'
  }
);