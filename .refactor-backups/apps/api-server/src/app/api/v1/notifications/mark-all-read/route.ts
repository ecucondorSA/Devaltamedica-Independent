import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAuthenticatedRoute } from '@/lib/middleware/UnifiedAuth';
import { createSuccessResponse, createErrorResponse } from '@/lib/response-helpers';
import NotificationService from '@/services/notification.service';

import { logger } from '@altamedica/shared/services/logger.service';
// Schemas
const MarkAllReadSchema = z.object({
  userId: z.string().optional(),
  userType: z.enum(['patient', 'doctor', 'admin']).optional()
});

// PUT /api/v1/notifications/mark-all-read - Mark all notifications as read for a user
export const PUT = createAuthenticatedRoute(
  async (request: NextRequest, authContext) => {
    try {
      const body = await request.json();
      const validation = MarkAllReadSchema.safeParse(body);
      
      if (!validation.success) {
        return NextResponse.json(
          createErrorResponse('INVALID_REQUEST_BODY', 'Invalid request body', {
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
      
      // Authorization: users can only mark their own notifications (unless admin)
      if (currentUserRole !== 'admin' && targetUserId !== currentUserId) {
        return NextResponse.json(
          createErrorResponse('FORBIDDEN', 'You can only mark your own notifications as read'),
          { status: 403 }
        );
      }
      
      logger.info(`[Notifications] Marking all notifications as read for ${targetUserType}: ${targetUserId}`);
      
      const count = await NotificationService.markAllAsRead(
        targetUserId,
        targetUserType as 'patient' | 'doctor' | 'admin'
      );
      
      logger.info(`[Notifications] Marked ${count} notifications as read`);
      
      return NextResponse.json(
        createSuccessResponse({
          count,
          message: `${count} notifications marked as read`,
          userId: targetUserId,
          userType: targetUserType
        }, 'All notifications marked as read successfully')
      );
      
    } catch (error) {
      logger.error('[Notifications] Error marking all as read:', undefined, error);
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to mark notifications as read'),
        { status: 500 }
      );
    }
  },
  {
    allowedRoles: ['patient', 'doctor', 'admin'],
    auditAction: 'mark_all_notifications_read'
  }
);