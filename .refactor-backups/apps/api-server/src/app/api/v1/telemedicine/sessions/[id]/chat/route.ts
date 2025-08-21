import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAuthenticatedRoute } from '@/lib/middleware/UnifiedAuth';
import { createSuccessResponse, createErrorResponse } from '@/lib/response-helpers';
import TelemedicineService from '@/services/telemedicine.service';

import { logger } from '@altamedica/shared/services/logger.service';
// Schemas
const AddChatMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(1000, 'Message too long'),
  senderType: z.enum(['patient', 'doctor']).optional() // Will be inferred from auth context
});

// POST /api/v1/telemedicine/sessions/[id]/chat - Add chat message
export const POST = createAuthenticatedRoute(
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
      const validation = AddChatMessageSchema.safeParse(body);
      
      if (!validation.success) {
        return NextResponse.json(
          createErrorResponse('INVALID_REQUEST_BODY', 'Invalid request body', {
            errors: validation.error.flatten().fieldErrors
          }),
          { status: 400 }
        );
      }
      
      const { message } = validation.data;
      const currentUserId = authContext.user?.uid!;
      const currentUserRole = authContext.user?.role!;
      
      logger.info(`[Telemedicine] Adding chat message to session ${id}`);
      
      // Verify session exists and user has access
      const session = await TelemedicineService.getSession(id);
      
      if (!session) {
        return NextResponse.json(
          createErrorResponse('SESSION_NOT_FOUND', 'Telemedicine session not found'),
          { status: 404 }
        );
      }
      
      // Authorization: only session participants can add messages
      if (currentUserRole !== 'admin') {
        if (session.patientId !== currentUserId && session.doctorId !== currentUserId) {
          return NextResponse.json(
            createErrorResponse('FORBIDDEN', 'You can only send messages in your own sessions'),
            { status: 403 }
          );
        }
      }
      
      // Determine sender type based on role and session participants
      let senderType: 'patient' | 'doctor';
      if (currentUserId === session.patientId) {
        senderType = 'patient';
      } else if (currentUserId === session.doctorId) {
        senderType = 'doctor';
      } else {
        // For admin users, default to doctor
        senderType = 'doctor';
      }
      
      const chatMessage = await TelemedicineService.addChatMessage(id, {
        senderId: currentUserId,
        senderType,
        message,
        timestamp: new Date()
      });
      
      logger.info(`[Telemedicine] Chat message added to session ${id}`);
      
      return NextResponse.json(
        createSuccessResponse(chatMessage, 'Chat message added successfully'),
        { status: 201 }
      );
      
    } catch (error) {
      logger.error('[Telemedicine] Error adding chat message:', undefined, error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        return NextResponse.json(
          createErrorResponse('SESSION_NOT_FOUND', 'Session not found'),
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to add chat message'),
        { status: 500 }
      );
    }
  },
  {
    allowedRoles: ['doctor', 'patient', 'admin'],
    auditAction: 'add_telemedicine_chat_message'
  }
);

// GET /api/v1/telemedicine/sessions/[id]/chat - Get chat history
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
      
      logger.info(`[Telemedicine] Getting chat history for session ${id}`);
      
      // Verify session exists and user has access
      const session = await TelemedicineService.getSession(id);
      
      if (!session) {
        return NextResponse.json(
          createErrorResponse('SESSION_NOT_FOUND', 'Telemedicine session not found'),
          { status: 404 }
        );
      }
      
      const currentUserId = authContext.user?.uid!;
      const currentUserRole = authContext.user?.role!;
      
      // Authorization: only session participants can view chat history
      if (currentUserRole !== 'admin') {
        if (session.patientId !== currentUserId && session.doctorId !== currentUserId) {
          return NextResponse.json(
            createErrorResponse('FORBIDDEN', 'You can only view chat history for your own sessions'),
            { status: 403 }
          );
        }
      }
      
      const chatHistory = await TelemedicineService.getChatHistory(id);
      
      return NextResponse.json(
        createSuccessResponse({
          sessionId: id,
          messages: chatHistory,
          count: chatHistory.length
        }, 'Chat history retrieved successfully')
      );
      
    } catch (error) {
      logger.error('[Telemedicine] Error getting chat history:', undefined, error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        return NextResponse.json(
          createErrorResponse('SESSION_NOT_FOUND', 'Session not found'),
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to retrieve chat history'),
        { status: 500 }
      );
    }
  },
  {
    allowedRoles: ['doctor', 'patient', 'admin'],
    auditAction: 'get_telemedicine_chat_history'
  }
);