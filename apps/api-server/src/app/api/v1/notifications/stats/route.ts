import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAuthenticatedRoute } from '@/lib/middleware/UnifiedAuth';
import { createSuccessResponse, createErrorResponse } from '@/lib/response-helpers';
import NotificationService from '@/services/notification.service';

import { logger } from '@altamedica/shared/services/logger.service';
// Schemas
const StatsQuerySchema = z.object({
  userId: z.string().optional(),
  userType: z.enum(['patient', 'doctor', 'admin']).optional()
});

// GET /api/v1/notifications/stats - Get notification statistics
export const GET = createAuthenticatedRoute(
  async (request: NextRequest, authContext) => {
    try {
      const url = new URL(request.url);
      const queryParams = {
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
      
      const { userId, userType } = validation.data;
      const currentUserId = authContext.user?.uid!;
      const currentUserRole = authContext.user?.role!;
      
      // Default to current user if not specified
      const targetUserId = userId || currentUserId;
      const targetUserType = userType || currentUserRole;
      
      // Authorization: users can only see their own stats (unless admin)
      if (currentUserRole !== 'admin' && targetUserId !== currentUserId) {
        return NextResponse.json(
          createErrorResponse('FORBIDDEN', 'You can only access your own notification statistics'),
          { status: 403 }
        );
      }
      
      logger.info(`[Notifications] Getting stats for ${targetUserType}: ${targetUserId}`);
      
      const stats = await NotificationService.getNotificationStats(
        targetUserId,
        targetUserType as 'patient' | 'doctor' | 'admin'
      );
      
      return NextResponse.json(
        createSuccessResponse({
          ...stats,
          userId: targetUserId,
          userType: targetUserType
        }, 'Notification statistics retrieved successfully')
      );
      
    } catch (error) {
      logger.error('[Notifications] Error getting stats:', undefined, error);
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to retrieve notification statistics'),
        { status: 500 }
      );
    }
  },
  {
    allowedRoles: ['patient', 'doctor', 'admin'],
    auditAction: 'get_notification_stats'
  }
);