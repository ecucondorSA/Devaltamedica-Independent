import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAuthenticatedRoute } from '@/lib/middleware/UnifiedAuth';
import { createSuccessResponse, createErrorResponse } from '@/lib/response-helpers';
import NotificationService from '@/services/notification.service';

import { logger } from '@altamedica/shared/services/logger.service';
// Schema
const TelemedicineConfirmationSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  userType: z.enum(['patient', 'doctor'], {
    errorMap: () => ({ message: 'userType must be patient or doctor' })
  }),
  telemedicineData: z.object({
    sessionId: z.string().min(1, 'Session ID is required'),
    roomId: z.string().min(1, 'Room ID is required'),
    doctorName: z.string().min(1, 'Doctor name is required'),
    patientName: z.string().min(1, 'Patient name is required'),
    scheduledAt: z.string().datetime('Invalid scheduled date format'),
    joinUrl: z.string().url('Invalid join URL format'),
    instructions: z.string().optional()
  })
});

// POST /api/v1/notifications/telemedicine-confirmation - Create telemedicine confirmation
export const POST = createAuthenticatedRoute(
  async (request: NextRequest, authContext) => {
    try {
      logger.info('[Notifications] Creating telemedicine confirmation');
      
      const body = await request.json();
      const validation = TelemedicineConfirmationSchema.safeParse(body);
      
      if (!validation.success) {
        return NextResponse.json(
          createErrorResponse('INVALID_REQUEST_BODY', 'Invalid request body', {
            errors: validation.error.flatten().fieldErrors
          }),
          { status: 400 }
        );
      }
      
      const { userId, userType, telemedicineData } = validation.data;
      const currentUserRole = authContext.user?.role;
      
      // Only doctors and admins can create telemedicine confirmations
      if (currentUserRole !== 'doctor' && currentUserRole !== 'admin') {
        return NextResponse.json(
          createErrorResponse('FORBIDDEN', 'Only doctors and admins can create telemedicine confirmations'),
          { status: 403 }
        );
      }
      
      const notification = await NotificationService.createTelemedicineConfirmation(
        userId,
        userType,
        telemedicineData
      );
      
      logger.info(`[Notifications] Telemedicine confirmation created: ${notification.id}`);
      
      return NextResponse.json(
        createSuccessResponse(notification, 'Telemedicine confirmation created successfully'),
        { status: 201 }
      );
      
    } catch (error) {
      logger.error('[Notifications] Error creating telemedicine confirmation:', undefined, error);
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to create telemedicine confirmation'),
        { status: 500 }
      );
    }
  },
  {
    allowedRoles: ['doctor', 'admin'],
    auditAction: 'create_telemedicine_confirmation'
  }
);