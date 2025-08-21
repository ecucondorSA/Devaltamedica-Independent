import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAuthenticatedRoute } from '@/lib/middleware/UnifiedAuth';
import { createSuccessResponse, createErrorResponse } from '@/lib/response-helpers';
import TelemedicineService from '@/services/telemedicine.service';

import { logger } from '@altamedica/shared/services/logger.service';
// Schemas
const CreateSessionSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorId: z.string().min(1, 'Doctor ID is required'),
  scheduledAt: z.string().datetime('Invalid datetime format')
});

const QuerySessionsSchema = z.object({
  userId: z.string().optional(),
  userType: z.enum(['patient', 'doctor']).optional()
});

// POST /api/v1/telemedicine/sessions - Create a new telemedicine session
export const POST = createAuthenticatedRoute(
  async (request: NextRequest, authContext) => {
    try {
      logger.info('[Telemedicine] Creating new session');
      
      const body = await request.json();
      const validation = CreateSessionSchema.safeParse(body);
      
      if (!validation.success) {
        return NextResponse.json(
          createErrorResponse('INVALID_REQUEST_BODY', 'Invalid request body', {
            errors: validation.error.flatten().fieldErrors
          }),
          { status: 400 }
        );
      }
      
      const { patientId, doctorId, scheduledAt } = validation.data;
      
      // Authorize: users can only create sessions for themselves (unless admin)
      const userRole = authContext.user?.role;
      const userId = authContext.user?.uid;
      
      if (userRole !== 'admin') {
        if (userRole === 'patient' && patientId !== userId) {
          return NextResponse.json(
            createErrorResponse('FORBIDDEN', 'Patients can only create sessions for themselves'),
            { status: 403 }
          );
        }
        if (userRole === 'doctor' && doctorId !== userId) {
          return NextResponse.json(
            createErrorResponse('FORBIDDEN', 'Doctors can only create sessions for themselves'),
            { status: 403 }
          );
        }
      }
      
      const session = await TelemedicineService.createSession({
        patientId,
        doctorId,
        scheduledAt: new Date(scheduledAt),
        createdBy: userId
      });
      
      logger.info(`[Telemedicine] Session created: ${session.id}`);
      
      return NextResponse.json(
        createSuccessResponse(session, 'Telemedicine session created successfully'),
        { status: 201 }
      );
      
    } catch (error) {
      logger.error('[Telemedicine] Error creating session:', undefined, error);
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to create telemedicine session'),
        { status: 500 }
      );
    }
  },
  {
    allowedRoles: ['doctor', 'patient', 'admin'],
    auditAction: 'create_telemedicine_session'
  }
);

// GET /api/v1/telemedicine/sessions - Get sessions by user
export const GET = createAuthenticatedRoute(
  async (request: NextRequest, authContext) => {
    try {
      const url = new URL(request.url);
      const queryParams = {
        userId: url.searchParams.get('userId') || undefined,
        userType: url.searchParams.get('userType') || undefined
      };
      
      const validation = QuerySessionsSchema.safeParse(queryParams);
      if (!validation.success) {
        return NextResponse.json(
          createErrorResponse('INVALID_QUERY', 'Invalid query parameters', {
            errors: validation.error.flatten().fieldErrors
          }),
          { status: 400 }
        );
      }
      
      const { userId, userType } = validation.data;
      const currentUserId = authContext.user?.uid;
      const currentUserRole = authContext.user?.role;
      
      // Default to current user if not specified
      const targetUserId = userId || currentUserId;
      const targetUserType = userType || currentUserRole;
      
      // Authorization: users can only see their own sessions (unless admin)
      if (currentUserRole !== 'admin' && targetUserId !== currentUserId) {
        return NextResponse.json(
          createErrorResponse('FORBIDDEN', 'You can only access your own sessions'),
          { status: 403 }
        );
      }
      
      if (!targetUserId || !targetUserType) {
        return NextResponse.json(
          createErrorResponse('MISSING_PARAMETERS', 'User ID and type are required'),
          { status: 400 }
        );
      }
      
      logger.info(`[Telemedicine] Getting sessions for ${targetUserType}: ${targetUserId}`);
      
      const sessions = await TelemedicineService.getSessionsByUser(targetUserId, targetUserType as 'patient' | 'doctor');
      
      return NextResponse.json(
        createSuccessResponse({
          sessions,
          count: sessions.length,
          userId: targetUserId,
          userType: targetUserType
        }, 'Sessions retrieved successfully')
      );
      
    } catch (error) {
      logger.error('[Telemedicine] Error getting sessions:', undefined, error);
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to retrieve sessions'),
        { status: 500 }
      );
    }
  },
  {
    allowedRoles: ['doctor', 'patient', 'admin'],
    auditAction: 'get_telemedicine_sessions'
  }
);