import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAuthenticatedRoute } from '@/lib/middleware/UnifiedAuth';
import { createSuccessResponse, createErrorResponse } from '@/lib/response-helpers';
import TelemedicineService from '@/services/telemedicine.service';

import { logger } from '@altamedica/shared/services/logger.service';
// Schemas
const UpdateSessionSchema = z.object({
  status: z.enum(['active', 'completed', 'cancelled']).optional(),
  notes: z.string().optional(),
  recordingUrl: z.string().url().optional()
});

// GET /api/v1/telemedicine/sessions/[id] - Get specific session
export const GET = createAuthenticatedRoute(
  async (request: NextRequest, authContext, { params }: { params: { id: string } }) => {
    try {
      const { id } = params;
      
      if (!id) {
        return NextResponse.json(
          createErrorResponse('MISSING_PARAMETER', 'Session ID is required'),
          { status: 400 }
        );
      }
      
      logger.info(`[Telemedicine] Getting session ${id}`);
      
      const session = await TelemedicineService.getSession(id);
      
      if (!session) {
        return NextResponse.json(
          createErrorResponse('SESSION_NOT_FOUND', 'Telemedicine session not found'),
          { status: 404 }
        );
      }
      
      // Authorization: users can only access their own sessions (unless admin)
      const currentUserId = authContext.user?.uid;
      const currentUserRole = authContext.user?.role;
      
      if (currentUserRole !== 'admin') {
        if (session.patientId !== currentUserId && session.doctorId !== currentUserId) {
          return NextResponse.json(
            createErrorResponse('FORBIDDEN', 'You can only access your own sessions'),
            { status: 403 }
          );
        }
      }
      
      return NextResponse.json(
        createSuccessResponse(session, 'Session retrieved successfully')
      );
      
    } catch (error) {
      logger.error('[Telemedicine] Error getting session:', undefined, error);
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to retrieve session'),
        { status: 500 }
      );
    }
  },
  {
    allowedRoles: ['doctor', 'patient', 'admin'],
    auditAction: 'get_telemedicine_session'
  }
);

// PUT /api/v1/telemedicine/sessions/[id] - Update session (start, end, cancel)
export const PUT = createAuthenticatedRoute(
  async (request: NextRequest, authContext, { params }: { params: { id: string } }) => {
    try {
      const { id } = params;
      
      if (!id) {
        return NextResponse.json(
          createErrorResponse('MISSING_PARAMETER', 'Session ID is required'),
          { status: 400 }
        );
      }
      
      const body = await request.json();
      const validation = UpdateSessionSchema.safeParse(body);
      
      if (!validation.success) {
        return NextResponse.json(
          createErrorResponse('INVALID_REQUEST_BODY', 'Invalid request body', {
            errors: validation.error.flatten().fieldErrors
          }),
          { status: 400 }
        );
      }
      
      const { status, notes, recordingUrl } = validation.data;
      
      logger.info(`[Telemedicine] Updating session ${id} with status: ${status}`);
      
      // Get current session to check permissions
      const currentSession = await TelemedicineService.getSession(id);
      
      if (!currentSession) {
        return NextResponse.json(
          createErrorResponse('SESSION_NOT_FOUND', 'Telemedicine session not found'),
          { status: 404 }
        );
      }
      
      // Authorization: users can only update their own sessions (unless admin)
      const currentUserId = authContext.user?.uid;
      const currentUserRole = authContext.user?.role;
      
      if (currentUserRole !== 'admin') {
        if (currentSession.patientId !== currentUserId && currentSession.doctorId !== currentUserId) {
          return NextResponse.json(
            createErrorResponse('FORBIDDEN', 'You can only update your own sessions'),
            { status: 403 }
          );
        }
      }
      
      let updatedSession;
      
      switch (status) {
        case 'active':
          updatedSession = await TelemedicineService.startSession(id, currentUserId);
          break;
        case 'completed':
          updatedSession = await TelemedicineService.endSession(id, {
            notes,
            recordingUrl,
            endedBy: currentUserId
          });
          break;
        case 'cancelled':
          updatedSession = await TelemedicineService.cancelSession(id, currentUserId);
          break;
        default:
          // Generic update for other fields
          updatedSession = await TelemedicineService.updateSession(id, {
            notes,
            recordingUrl,
            updatedBy: currentUserId
          });
      }
      
      logger.info(`[Telemedicine] Session ${id} updated successfully`);
      
      return NextResponse.json(
        createSuccessResponse(updatedSession, `Session ${status ? status : 'updated'} successfully`)
      );
      
    } catch (error) {
      logger.error('[Telemedicine] Error updating session:', undefined, error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        return NextResponse.json(
          createErrorResponse('SESSION_NOT_FOUND', 'Session not found'),
          { status: 404 }
        );
      }
      
      if (error instanceof Error && error.message.includes('invalid state')) {
        return NextResponse.json(
          createErrorResponse('INVALID_SESSION_STATE', error.message),
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to update session'),
        { status: 500 }
      );
    }
  },
  {
    allowedRoles: ['doctor', 'patient', 'admin'],
    auditAction: 'update_telemedicine_session'
  }
);