import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAuthenticatedRoute } from '@/lib/middleware/UnifiedAuth';
import { createSuccessResponse, createErrorResponse } from '@/lib/response-helpers';
import TelemedicineService from '@/services/telemedicine.service';

import { logger } from '@altamedica/shared/services/logger.service';
// Schema for system status
const SystemStatusSchema = z.object({
  includeRoomStats: z.boolean().optional().default(false)
});

// GET /api/v1/telemedicine - Get system status
export const GET = createAuthenticatedRoute(
  async (request: NextRequest, authContext) => {
    try {
      const url = new URL(request.url);
      const queryParams = {
        includeRoomStats: url.searchParams.get('includeRoomStats') === 'true'
      };
      
      const validation = SystemStatusSchema.safeParse(queryParams);
      if (!validation.success) {
        return NextResponse.json(
          createErrorResponse('INVALID_QUERY', 'Invalid query parameters', {
            errors: validation.error.flatten().fieldErrors
          }),
          { status: 400 }
        );
      }
      
      logger.info('[Telemedicine] Getting system status');
      
      const systemStatus = await TelemedicineService.getSystemStatus(validation.data.includeRoomStats);
      
      return NextResponse.json(
        createSuccessResponse(systemStatus, 'System status retrieved successfully')
      );
      
    } catch (error) {
      logger.error('[Telemedicine] Error getting system status:', undefined, error);
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to retrieve system status'),
        { status: 500 }
      );
    }
  },
  {
    allowedRoles: ['doctor', 'admin', 'patient'],
    auditAction: 'get_telemedicine_status'
  }
);