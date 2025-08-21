import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAuthenticatedRoute } from '@/lib/middleware/UnifiedAuth';
import { createSuccessResponse, createErrorResponse } from '@/lib/response-helpers';
import NotificationService from '@/services/notification.service';

import { logger } from '@altamedica/shared/services/logger.service';
// Schema
const MedicalAlertSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  userType: z.enum(['patient', 'doctor'], {
    errorMap: () => ({ message: 'userType must be patient or doctor' })
  }),
  alertMessage: z.string().min(1, 'Alert message is required'),
  alertType: z.enum(['critical', 'warning', 'info']).optional().default('warning'),
  relatedRecordId: z.string().optional(),
  actionRequired: z.boolean().optional().default(false)
});

// POST /api/v1/notifications/medical-alert - Create medical alert
export const POST = createAuthenticatedRoute(
  async (request: NextRequest, authContext) => {
    try {
      logger.info('[Notifications] Creating medical alert');
      
      const body = await request.json();
      const validation = MedicalAlertSchema.safeParse(body);
      
      if (!validation.success) {
        return NextResponse.json(
          createErrorResponse('INVALID_REQUEST_BODY', 'Invalid request body', {
            errors: validation.error.flatten().fieldErrors
          }),
          { status: 400 }
        );
      }
      
      const { userId, userType, alertMessage, alertType, relatedRecordId, actionRequired } = validation.data;
      const currentUserRole = authContext.user?.role;
      
      // Only doctors and admins can create medical alerts
      if (currentUserRole !== 'doctor' && currentUserRole !== 'admin') {
        return NextResponse.json(
          createErrorResponse('FORBIDDEN', 'Only doctors and admins can create medical alerts'),
          { status: 403 }
        );
      }
      
      // Determine priority based on alert type
      const priorityMapping = {
        'critical': 'urgent' as const,
        'warning': 'high' as const,
        'info': 'medium' as const
      };
      
      const notification = await NotificationService.createMedicalAlert(
        userId,
        userType,
        alertMessage,
        {
          alertType,
          relatedRecordId,
          actionRequired,
          priority: priorityMapping[alertType]
        }
      );
      
      logger.info(`[Notifications] Medical alert created: ${notification.id} (${alertType})`);
      
      return NextResponse.json(
        createSuccessResponse(notification, 'Medical alert created successfully'),
        { status: 201 }
      );
      
    } catch (error) {
      logger.error('[Notifications] Error creating medical alert:', undefined, error);
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to create medical alert'),
        { status: 500 }
      );
    }
  },
  {
    allowedRoles: ['doctor', 'admin'],
    auditAction: 'create_medical_alert'
  }
);