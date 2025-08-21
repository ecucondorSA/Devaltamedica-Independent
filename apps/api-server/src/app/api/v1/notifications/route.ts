import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAuthenticatedRoute } from '@/lib/middleware/UnifiedAuth';
import { createSuccessResponse, createErrorResponse } from '@/lib/response-helpers';
import NotificationService from '@/services/notification.service';

import { logger } from '@altamedica/shared/services/logger.service';
// Schemas
const QueryNotificationsSchema = z.object({
  userId: z.string().optional(),
  userType: z.enum(['patient', 'doctor', 'admin']).optional(),
  status: z.enum(['unread', 'read', 'archived']).optional(),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0)
});

const CreateNotificationSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  userType: z.enum(['patient', 'doctor', 'admin'], {
    errorMap: () => ({ message: 'userType must be patient, doctor, or admin' })
  }),
  type: z.string().min(1, 'Notification type is required'),
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent'], {
    errorMap: () => ({ message: 'priority must be low, medium, high, or urgent' })
  }),
  metadata: z.record(z.any()).optional().default({}),
  scheduledFor: z.string().datetime().optional()
});

// GET /api/v1/notifications - Get notifications
export const GET = createAuthenticatedRoute(
  async (request: NextRequest, authContext) => {
    try {
      const url = new URL(request.url);
      const queryParams = {
        userId: url.searchParams.get('userId') || undefined,
        userType: url.searchParams.get('userType') || undefined,
        status: url.searchParams.get('status') || undefined,
        limit: parseInt(url.searchParams.get('limit') || '20'),
        offset: parseInt(url.searchParams.get('offset') || '0')
      };
      
      const validation = QueryNotificationsSchema.safeParse(queryParams);
      if (!validation.success) {
        return NextResponse.json(
          createErrorResponse('INVALID_QUERY', 'Invalid query parameters', {
            errors: validation.error.flatten().fieldErrors
          }),
          { status: 400 }
        );
      }
      
      const { userId, userType, status, limit, offset } = validation.data;
      const currentUserId = authContext.user?.uid!;
      const currentUserRole = authContext.user?.role!;
      
      // Default to current user if not specified
      const targetUserId = userId || currentUserId;
      const targetUserType = userType || currentUserRole;
      
      // Authorization: users can only see their own notifications (unless admin)
      if (currentUserRole !== 'admin' && targetUserId !== currentUserId) {
        return NextResponse.json(
          createErrorResponse('FORBIDDEN', 'You can only access your own notifications'),
          { status: 403 }
        );
      }
      
      logger.info(`[Notifications] Getting notifications for ${targetUserType}: ${targetUserId}`);
      
      const notifications = await NotificationService.getUserNotifications(
        targetUserId,
        targetUserType as 'patient' | 'doctor' | 'admin',
        { status, limit, offset }
      );
      
      return NextResponse.json(
        createSuccessResponse({
          notifications,
          count: notifications.length,
          userId: targetUserId,
          userType: targetUserType
        }, 'Notifications retrieved successfully')
      );
      
    } catch (error) {
      logger.error('[Notifications] Error getting notifications:', undefined, error);
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to retrieve notifications'),
        { status: 500 }
      );
    }
  },
  {
    allowedRoles: ['patient', 'doctor', 'admin'],
    auditAction: 'get_notifications'
  }
);

// POST /api/v1/notifications - Create a custom notification
export const POST = createAuthenticatedRoute(
  async (request: NextRequest, authContext) => {
    try {
      logger.info('[Notifications] Creating custom notification');
      
      const body = await request.json();
      const validation = CreateNotificationSchema.safeParse(body);
      
      if (!validation.success) {
        return NextResponse.json(
          createErrorResponse('INVALID_REQUEST_BODY', 'Invalid request body', {
            errors: validation.error.flatten().fieldErrors
          }),
          { status: 400 }
        );
      }
      
      const notificationData = validation.data;
      const currentUserRole = authContext.user?.role;
      
      // Only admins and doctors can create notifications for others
      if (currentUserRole !== 'admin' && currentUserRole !== 'doctor') {
        return NextResponse.json(
          createErrorResponse('FORBIDDEN', 'Only admins and doctors can create notifications'),
          { status: 403 }
        );
      }
      
      const notification = await NotificationService.createNotification({
        ...notificationData,
        status: 'unread',
        scheduledFor: notificationData.scheduledFor ? new Date(notificationData.scheduledFor) : undefined
      });
      
      logger.info(`[Notifications] Notification created: ${notification.id}`);
      
      return NextResponse.json(
        createSuccessResponse(notification, 'Notification created successfully'),
        { status: 201 }
      );
      
    } catch (error) {
      logger.error('[Notifications] Error creating notification:', undefined, error);
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to create notification'),
        { status: 500 }
      );
    }
  },
  {
    allowedRoles: ['doctor', 'admin'],
    auditAction: 'create_notification'
  }
);