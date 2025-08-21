import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedRoute } from '@/lib/middleware/UnifiedAuth';
import { createSuccessResponse, createErrorResponse } from '@/lib/response-helpers';
import TelemedicineService from '@/services/telemedicine.service';

import { logger } from '@altamedica/shared/services/logger.service';
// GET /api/v1/telemedicine/rooms/[roomId] - Check room availability
export const GET = createAuthenticatedRoute(
  async (request: NextRequest, authContext, { params }: { params: { roomId: string } }) => {
    try {
      const { roomId } = params;
      
      if (!roomId) {
        return NextResponse.json(
          createErrorResponse('MISSING_PARAMETER', 'Room ID is required'),
          { status: 400 }
        );
      }
      
      logger.info(`[Telemedicine] Checking room availability: ${roomId}`);
      
      const roomStatus = await TelemedicineService.checkRoomAvailability(roomId);
      
      if (!roomStatus) {
        return NextResponse.json(
          createErrorResponse('ROOM_NOT_FOUND', 'Room not found'),
          { status: 404 }
        );
      }
      
      // Additional authorization: check if user has access to this room
      const currentUserId = authContext.user?.uid;
      const currentUserRole = authContext.user?.role;
      
      if (currentUserRole !== 'admin') {
        // Get session associated with this room to check permissions
        const session = await TelemedicineService.getSessionByRoomId(roomId);
        
        if (session && session.patientId !== currentUserId && session.doctorId !== currentUserId) {
          return NextResponse.json(
            createErrorResponse('FORBIDDEN', 'You do not have access to this room'),
            { status: 403 }
          );
        }
      }
      
      return NextResponse.json(
        createSuccessResponse({
          roomId,
          ...roomStatus
        }, 'Room status retrieved successfully')
      );
      
    } catch (error) {
      logger.error('[Telemedicine] Error checking room availability:', undefined, error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        return NextResponse.json(
          createErrorResponse('ROOM_NOT_FOUND', 'Room not found'),
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to check room availability'),
        { status: 500 }
      );
    }
  },
  {
    allowedRoles: ['doctor', 'patient', 'admin'],
    auditAction: 'check_telemedicine_room_availability'
  }
);