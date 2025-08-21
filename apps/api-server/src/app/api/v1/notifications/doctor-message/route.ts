import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAuthenticatedRoute } from '@/lib/middleware/UnifiedAuth';
import { createSuccessResponse, createErrorResponse } from '@/lib/response-helpers';
import NotificationService from '@/services/notification.service';

import { logger } from '@altamedica/shared/services/logger.service';
// Schema
const DoctorMessageSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorName: z.string().min(1, 'Doctor name is required'),
  message: z.string().min(1, 'Message is required'),
  subject: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  requiresResponse: z.boolean().optional().default(false),
  relatedAppointmentId: z.string().optional()
});

// POST /api/v1/notifications/doctor-message - Create doctor message notification
export const POST = createAuthenticatedRoute(
  async (request: NextRequest, authContext) => {
    try {
      logger.info('[Notifications] Creating doctor message notification');
      
      const body = await request.json();
      const validation = DoctorMessageSchema.safeParse(body);
      
      if (!validation.success) {
        return NextResponse.json(
          createErrorResponse('INVALID_REQUEST_BODY', 'Invalid request body', {
            errors: validation.error.flatten().fieldErrors
          }),
          { status: 400 }
        );
      }
      
      const { 
        patientId, 
        doctorName, 
        message, 
        subject, 
        priority, 
        requiresResponse, 
        relatedAppointmentId 
      } = validation.data;
      const currentUserRole = authContext.user?.role;
      const currentUserId = authContext.user?.uid;
      
      // Only doctors can send messages to patients
      if (currentUserRole !== 'doctor' && currentUserRole !== 'admin') {
        return NextResponse.json(
          createErrorResponse('FORBIDDEN', 'Only doctors can send messages to patients'),
          { status: 403 }
        );
      }
      
      const notification = await NotificationService.createDoctorMessage(
        patientId,
        doctorName,
        message,
        {
          subject,
          priority,
          requiresResponse,
          relatedAppointmentId,
          senderId: currentUserId
        }
      );
      
      logger.info(`[Notifications] Doctor message notification created: ${notification.id}`);
      
      return NextResponse.json(
        createSuccessResponse(notification, 'Doctor message notification created successfully'),
        { status: 201 }
      );
      
    } catch (error) {
      logger.error('[Notifications] Error creating doctor message:', undefined, error);
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to create doctor message notification'),
        { status: 500 }
      );
    }
  },
  {
    allowedRoles: ['doctor', 'admin'],
    auditAction: 'create_doctor_message_notification'
  }
);