import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAuthenticatedRoute } from '@/lib/middleware/UnifiedAuth';
import { createSuccessResponse, createErrorResponse } from '@/lib/response-helpers';
import NotificationService from '@/services/notification.service';

import { logger } from '@altamedica/shared/services/logger.service';
// Schema
const AppointmentReminderSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  userType: z.enum(['patient', 'doctor'], {
    errorMap: () => ({ message: 'userType must be patient or doctor' })
  }),
  appointmentData: z.object({
    appointmentId: z.string().min(1, 'Appointment ID is required'),
    doctorName: z.string().min(1, 'Doctor name is required'),
    patientName: z.string().min(1, 'Patient name is required'),
    appointmentDate: z.string().datetime('Invalid appointment date format'),
    location: z.string().optional(),
    type: z.enum(['consultation', 'follow-up', 'emergency', 'telemedicine']).optional().default('consultation')
  }),
  reminderHours: z.number().min(1).max(168).optional().default(24) // 1 hour to 7 days
});

// POST /api/v1/notifications/appointment-reminder - Create appointment reminder
export const POST = createAuthenticatedRoute(
  async (request: NextRequest, authContext) => {
    try {
      logger.info('[Notifications] Creating appointment reminder');
      
      const body = await request.json();
      const validation = AppointmentReminderSchema.safeParse(body);
      
      if (!validation.success) {
        return NextResponse.json(
          createErrorResponse('INVALID_REQUEST_BODY', 'Invalid request body', {
            errors: validation.error.flatten().fieldErrors
          }),
          { status: 400 }
        );
      }
      
      const { userId, userType, appointmentData, reminderHours } = validation.data;
      const currentUserRole = authContext.user?.role;
      
      // Only doctors and admins can create appointment reminders
      if (currentUserRole !== 'doctor' && currentUserRole !== 'admin') {
        return NextResponse.json(
          createErrorResponse('FORBIDDEN', 'Only doctors and admins can create appointment reminders'),
          { status: 403 }
        );
      }
      
      const notification = await NotificationService.createAppointmentReminder(
        userId,
        userType,
        appointmentData,
        reminderHours
      );
      
      logger.info(`[Notifications] Appointment reminder created: ${notification.id}`);
      
      return NextResponse.json(
        createSuccessResponse(notification, 'Appointment reminder created successfully'),
        { status: 201 }
      );
      
    } catch (error) {
      logger.error('[Notifications] Error creating appointment reminder:', undefined, error);
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to create appointment reminder'),
        { status: 500 }
      );
    }
  },
  {
    allowedRoles: ['doctor', 'admin'],
    auditAction: 'create_appointment_reminder'
  }
);