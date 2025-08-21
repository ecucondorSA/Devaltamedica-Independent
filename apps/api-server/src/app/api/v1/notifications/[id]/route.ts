import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedRoute } from '@/lib/middleware/UnifiedAuth';
import { createSuccessResponse, createErrorResponse } from '@/lib/response-helpers';
import NotificationService from '@/services/notification.service';

import { logger } from '@altamedica/shared/services/logger.service';
// GET /api/v1/notifications/[id] - Get specific notification
export const GET = createAuthenticatedRoute(
  async (request: NextRequest, authContext, { params }: { params: { id: string } }) => {
    try {
      const { id } = params;
      
      if (!id) {
        return NextResponse.json(
          createErrorResponse('MISSING_PARAMETER', 'Notification ID is required'),
          { status: 400 }
        );
      }
      
      logger.info(`[Notifications] Getting notification ${id}`);
      
      const notification = await NotificationService.getNotification(id);
      
      if (!notification) {
        return NextResponse.json(
          createErrorResponse('NOTIFICATION_NOT_FOUND', 'Notification not found'),
          { status: 404 }
        );
      }
      
      const currentUserId = authContext.user?.uid!;
      const currentUserRole = authContext.user?.role!;
      
      // Authorization: users can only view their own notifications (unless admin)
      if (currentUserRole !== 'admin' && notification.userId !== currentUserId) {
        return NextResponse.json(
          createErrorResponse('FORBIDDEN', 'You can only view your own notifications'),
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        createSuccessResponse(notification, 'Notification retrieved successfully')
      );
      
    } catch (error) {
      logger.error('[Notifications] Error getting notification:', undefined, error);
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to retrieve notification'),
        { status: 500 }
      );
    }
  },
  {
    allowedRoles: ['patient', 'doctor', 'admin'],
    auditAction: 'get_notification'
  }
);

// PUT /api/v1/notifications/[id] - Update notification (mark as read/archived)
export const PUT = createAuthenticatedRoute(
  async (request: NextRequest, authContext, { params }: { params: { id: string } }) => {
    try {
      const { id } = params;
      
      if (!id) {
        return NextResponse.json(
          createErrorResponse('MISSING_PARAMETER', 'Notification ID is required'),
          { status: 400 }
        );
      }
      
      const body = await request.json();
      const { action } = body; // 'read' or 'archive'
      
      if (!action || !['read', 'archive'].includes(action)) {
        return NextResponse.json(
          createErrorResponse('INVALID_ACTION', 'Action must be "read" or "archive"'),
          { status: 400 }
        );
      }
      
      logger.info(`[Notifications] Updating notification ${id} with action: ${action}`);
      
      const currentUserId = authContext.user?.uid!;
      const currentUserRole = authContext.user?.role!;
      
      // Get notification to check ownership
      const notification = await NotificationService.getNotification(id);
      
      if (!notification) {
        return NextResponse.json(
          createErrorResponse('NOTIFICATION_NOT_FOUND', 'Notification not found'),
          { status: 404 }
        );
      }
      
      // Authorization: users can only update their own notifications (unless admin)
      if (currentUserRole !== 'admin' && notification.userId !== currentUserId) {
        return NextResponse.json(
          createErrorResponse('FORBIDDEN', 'You can only update your own notifications'),
          { status: 403 }
        );
      }
      
      let updatedNotification;
      
      if (action === 'read') {
        updatedNotification = await NotificationService.markAsRead(id);
      } else if (action === 'archive') {
        updatedNotification = await NotificationService.markAsArchived(id);
      }
      
      if (!updatedNotification) {
        return NextResponse.json(
          createErrorResponse('UPDATE_FAILED', 'Failed to update notification'),
          { status: 500 }
        );
      }
      
      logger.info(`[Notifications] Notification ${id} marked as ${action}`);
      
      return NextResponse.json(
        createSuccessResponse(updatedNotification, `Notification marked as ${action} successfully`)
      );
      
    } catch (error) {
      logger.error('[Notifications] Error updating notification:', undefined, error);
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to update notification'),
        { status: 500 }
      );
    }
  },
  {
    allowedRoles: ['patient', 'doctor', 'admin'],
    auditAction: 'update_notification'
  }
);

// DELETE /api/v1/notifications/[id] - Delete notification
export const DELETE = createAuthenticatedRoute(
  async (request: NextRequest, authContext, { params }: { params: { id: string } }) => {
    try {
      const { id } = params;
      
      if (!id) {
        return NextResponse.json(
          createErrorResponse('MISSING_PARAMETER', 'Notification ID is required'),
          { status: 400 }
        );
      }
      
      logger.info(`[Notifications] Deleting notification ${id}`);
      
      const currentUserId = authContext.user?.uid!;
      const currentUserRole = authContext.user?.role!;
      
      // Get notification to check ownership
      const notification = await NotificationService.getNotification(id);
      
      if (!notification) {
        return NextResponse.json(
          createErrorResponse('NOTIFICATION_NOT_FOUND', 'Notification not found'),
          { status: 404 }
        );
      }
      
      // Authorization: users can only delete their own notifications (unless admin)
      if (currentUserRole !== 'admin' && notification.userId !== currentUserId) {
        return NextResponse.json(
          createErrorResponse('FORBIDDEN', 'You can only delete your own notifications'),
          { status: 403 }
        );
      }
      
      const deleted = await NotificationService.deleteNotification(id);
      
      if (!deleted) {
        return NextResponse.json(
          createErrorResponse('DELETE_FAILED', 'Failed to delete notification'),
          { status: 500 }
        );
      }
      
      logger.info(`[Notifications] Notification ${id} deleted successfully`);
      
      return NextResponse.json(
        createSuccessResponse(null, 'Notification deleted successfully')
      );
      
    } catch (error) {
      logger.error('[Notifications] Error deleting notification:', undefined, error);
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to delete notification'),
        { status: 500 }
      );
    }
  },
  {
    allowedRoles: ['patient', 'doctor', 'admin'],
    auditAction: 'delete_notification'
  }
);