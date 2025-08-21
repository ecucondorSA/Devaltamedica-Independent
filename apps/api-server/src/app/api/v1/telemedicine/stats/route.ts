import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAuthenticatedRoute } from '@/lib/middleware/UnifiedAuth';
import { createSuccessResponse, createErrorResponse } from '@/lib/response-helpers';
import TelemedicineService from '@/services/telemedicine.service';

import { logger } from '@altamedica/shared/services/logger.service';
// Schemas
const StatsQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']).optional().default('month'),
  userId: z.string().optional(),
  userType: z.enum(['patient', 'doctor']).optional()
});

// GET /api/v1/telemedicine/stats - Get telemedicine statistics
export const GET = createAuthenticatedRoute(
  async (request: NextRequest, authContext) => {
    try {
      const url = new URL(request.url);
      const queryParams = {
        period: url.searchParams.get('period') || 'month',
        userId: url.searchParams.get('userId') || undefined,
        userType: url.searchParams.get('userType') || undefined
      };
      
      const validation = StatsQuerySchema.safeParse(queryParams);
      if (!validation.success) {
        return NextResponse.json(
          createErrorResponse('INVALID_QUERY', 'Invalid query parameters', {
            errors: validation.error.flatten().fieldErrors
          }),
          { status: 400 }
        );
      }
      
      const { period, userId, userType } = validation.data;
      const currentUserId = authContext.user?.uid;
      const currentUserRole = authContext.user?.role;
      
      // Default to current user if not specified
      const targetUserId = userId || currentUserId;
      const targetUserType = userType || (currentUserRole as 'patient' | 'doctor');
      
      // Authorization: users can only see their own stats (unless admin)
      if (currentUserRole !== 'admin' && targetUserId !== currentUserId) {
        return NextResponse.json(
          createErrorResponse('FORBIDDEN', 'You can only access your own statistics'),
          { status: 403 }
        );
      }
      
      logger.info(`[Telemedicine] Getting stats for ${targetUserType}: ${targetUserId}, period: ${period}`);
      
      let stats;
      
      if (currentUserRole === 'admin' && !userId) {
        // Admin requesting global stats
        stats = await TelemedicineService.getGlobalStats(period);
      } else {
        // User-specific stats
        stats = await TelemedicineService.getUserStats(targetUserId!, targetUserType, period);
      }
      
      return NextResponse.json(
        createSuccessResponse({
          ...stats,
          period,
          userId: targetUserId,
          userType: targetUserType
        }, 'Statistics retrieved successfully')
      );
      
    } catch (error) {
      logger.error('[Telemedicine] Error getting stats:', undefined, error);
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to retrieve statistics'),
        { status: 500 }
      );
    }
  },
  {
    allowedRoles: ['doctor', 'patient', 'admin'],
    auditAction: 'get_telemedicine_stats'
  }
);