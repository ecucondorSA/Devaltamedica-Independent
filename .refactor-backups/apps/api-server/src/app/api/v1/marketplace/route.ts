import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAuthenticatedRoute } from '@/lib/middleware/UnifiedAuth';
import { createSuccessResponse, createErrorResponse } from '@/lib/response-helpers';
import MarketplaceService from '@/services/marketplace.service';

import { logger } from '@altamedica/shared/services/logger.service';
// Schemas
const MarketplaceQuerySchema = z.object({
  category: z.string().optional(),
  location: z.string().optional(),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0)
});

// GET /api/v1/marketplace - Get marketplace overview/listings
export const GET = createAuthenticatedRoute(
  async (request: NextRequest, authContext) => {
    try {
      const url = new URL(request.url);
      const queryParams = {
        category: url.searchParams.get('category') || undefined,
        location: url.searchParams.get('location') || undefined,
        limit: parseInt(url.searchParams.get('limit') || '20'),
        offset: parseInt(url.searchParams.get('offset') || '0')
      };
      
      const validation = MarketplaceQuerySchema.safeParse(queryParams);
      if (!validation.success) {
        return NextResponse.json(
          createErrorResponse('INVALID_QUERY', 'Invalid query parameters', {
            errors: validation.error.flatten().fieldErrors
          }),
          { status: 400 }
        );
      }
      
      const { category, location, limit, offset } = validation.data;
      
      logger.info('[Marketplace] Getting marketplace overview');
      
      const marketplaceData = await MarketplaceService.getMarketplaceOverview({
        category,
        location,
        limit,
        offset
      });
      
      return NextResponse.json(
        createSuccessResponse(marketplaceData, 'Marketplace data retrieved successfully')
      );
      
    } catch (error) {
      logger.error('[Marketplace] Error getting marketplace overview:', undefined, error);
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to retrieve marketplace data'),
        { status: 500 }
      );
    }
  },
  {
    allowedRoles: ['company', 'doctor', 'admin'],
    auditAction: 'get_marketplace_overview'
  }
);