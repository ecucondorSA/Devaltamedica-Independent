import { NextRequest, NextResponse } from 'next/server';
import { TelemedicineService } from './telemedicine.service';
import { CreateSessionData, UpdateSessionData, EndSessionData } from './telemedicine.types';
import { UnifiedAuth } from '@/shared/middleware/UnifiedAuth';

import { logger } from '@altamedica/shared/services/logger.service';
export class TelemedicineController {
  static async createSession(request: NextRequest): Promise<NextResponse> {
    try {
      // Verificar autenticación - solo doctores y admins pueden crear sesiones
      const authResult = await UnifiedAuth(request, ['DOCTOR', 'ADMIN']);
      if (!authResult.success) return authResult.response;

      const body: CreateSessionData = await request.json();
      
      // Validar datos requeridos
      if (!body.patientId || !body.doctorId || !body.scheduledAt) {
        return NextResponse.json(
          { success: false, error: 'Datos requeridos: patientId, doctorId, scheduledAt' },
          { status: 400 }
        );
      }

      const sessionData = {
        ...body,
        scheduledAt: new Date(body.scheduledAt),
        createdBy: authResult.context?.userId
      };

      const session = await TelemedicineService.createSession(sessionData);

      return NextResponse.json({
        success: true,
        data: session
      }, { status: 201 });
    } catch (error) {
      logger.error('Error en createSession controller:', undefined, error);
      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  }

  static async getSession(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      // Verificar autenticación
      const authResult = await UnifiedAuth(request, ['PATIENT', 'DOCTOR', 'ADMIN']);
      if (!authResult.success) return authResult.response;

      const sessionId = params.id;
      const session = await TelemedicineService.getSession(sessionId);

      if (!session) {
        return NextResponse.json(
          { success: false, error: 'Sesión no encontrada' },
          { status: 404 }
        );
      }

      // Verificar permisos: solo participantes de la sesión pueden verla
      const canAccess = 
        authResult.context?.userRole === 'ADMIN' ||
        session.patientId === authResult.context?.userId ||
        session.doctorId === authResult.context?.userId;

      if (!canAccess) {
        return NextResponse.json(
          { success: false, error: 'Acceso denegado' },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        data: session
      });
    } catch (error) {
      logger.error('Error en getSession controller:', undefined, error);
      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  }

  static async getSessionsByUser(request: NextRequest): Promise<NextResponse> {
    try {
      // Verificar autenticación
      const authResult = await UnifiedAuth(request, ['PATIENT', 'DOCTOR', 'ADMIN']);
      if (!authResult.success) return authResult.response;

      const { searchParams } = new URL(request.url);
      const userId = searchParams.get('userId') || authResult.context?.userId;
      const userType = searchParams.get('userType') as 'patient' | 'doctor';

      if (!userId || !userType) {
        return NextResponse.json(
          { success: false, error: 'userId y userType son requeridos' },
          { status: 400 }
        );
      }

      // Los usuarios solo pueden ver sus propias sesiones (excepto admins)
      if (authResult.context?.userRole !== 'ADMIN' && userId !== authResult.context?.userId) {
        return NextResponse.json(
          { success: false, error: 'Acceso denegado' },
          { status: 403 }
        );
      }

      const sessions = await TelemedicineService.getSessionsByUser(userId, userType);

      return NextResponse.json({
        success: true,
        data: sessions
      });
    } catch (error) {
      logger.error('Error en getSessionsByUser controller:', undefined, error);
      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  }

  static async startSession(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      // Verificar autenticación
      const authResult = await UnifiedAuth(request, ['PATIENT', 'DOCTOR', 'ADMIN']);
      if (!authResult.success) return authResult.response;

      const sessionId = params.id;

      // Verificar que el usuario es participante de la sesión
      const existingSession = await TelemedicineService.getSession(sessionId);
      if (!existingSession) {
        return NextResponse.json(
          { success: false, error: 'Sesión no encontrada' },
          { status: 404 }
        );
      }

      const canStart = 
        authResult.context?.userRole === 'ADMIN' ||
        existingSession.patientId === authResult.context?.userId ||
        existingSession.doctorId === authResult.context?.userId;

      if (!canStart) {
        return NextResponse.json(
          { success: false, error: 'Acceso denegado' },
          { status: 403 }
        );
      }

      const session = await TelemedicineService.startSession(sessionId, authResult.context?.userId);

      return NextResponse.json({
        success: true,
        data: session
      });
    } catch (error) {
      logger.error('Error en startSession controller:', undefined, error);
      const statusCode = error.message.includes('not found') ? 404 : 
                        error.message.includes('invalid state') ? 400 : 500;
      return NextResponse.json(
        { success: false, error: error.message },
        { status: statusCode }
      );
    }
  }

  static async endSession(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      // Verificar autenticación
      const authResult = await UnifiedAuth(request, ['PATIENT', 'DOCTOR', 'ADMIN']);
      if (!authResult.success) return authResult.response;

      const sessionId = params.id;
      const body: EndSessionData = await request.json();

      // Verificar que el usuario es participante de la sesión
      const existingSession = await TelemedicineService.getSession(sessionId);
      if (!existingSession) {
        return NextResponse.json(
          { success: false, error: 'Sesión no encontrada' },
          { status: 404 }
        );
      }

      const canEnd = 
        authResult.context?.userRole === 'ADMIN' ||
        existingSession.patientId === authResult.context?.userId ||
        existingSession.doctorId === authResult.context?.userId;

      if (!canEnd) {
        return NextResponse.json(
          { success: false, error: 'Acceso denegado' },
          { status: 403 }
        );
      }

      const endData = {
        ...body,
        endedBy: authResult.context?.userId
      };

      const session = await TelemedicineService.endSession(sessionId, endData);

      return NextResponse.json({
        success: true,
        data: session
      });
    } catch (error) {
      logger.error('Error en endSession controller:', undefined, error);
      const statusCode = error.message.includes('not found') ? 404 : 
                        error.message.includes('not active') ? 400 : 500;
      return NextResponse.json(
        { success: false, error: error.message },
        { status: statusCode }
      );
    }
  }

  static async cancelSession(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      // Verificar autenticación
      const authResult = await UnifiedAuth(request, ['PATIENT', 'DOCTOR', 'ADMIN']);
      if (!authResult.success) return authResult.response;

      const sessionId = params.id;

      // Verificar que el usuario es participante de la sesión
      const existingSession = await TelemedicineService.getSession(sessionId);
      if (!existingSession) {
        return NextResponse.json(
          { success: false, error: 'Sesión no encontrada' },
          { status: 404 }
        );
      }

      const canCancel = 
        authResult.context?.userRole === 'ADMIN' ||
        existingSession.patientId === authResult.context?.userId ||
        existingSession.doctorId === authResult.context?.userId;

      if (!canCancel) {
        return NextResponse.json(
          { success: false, error: 'Acceso denegado' },
          { status: 403 }
        );
      }

      const session = await TelemedicineService.cancelSession(sessionId, authResult.context?.userId);

      return NextResponse.json({
        success: true,
        data: session
      });
    } catch (error) {
      logger.error('Error en cancelSession controller:', undefined, error);
      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  }

  static async checkRoomAvailability(request: NextRequest, { params }: { params: { roomId: string } }): Promise<NextResponse> {
    try {
      // Verificar autenticación
      const authResult = await UnifiedAuth(request, ['PATIENT', 'DOCTOR', 'ADMIN']);
      if (!authResult.success) return authResult.response;

      const roomId = params.roomId;
      const roomInfo = await TelemedicineService.checkRoomAvailability(roomId);

      if (!roomInfo) {
        return NextResponse.json(
          { success: false, error: 'Sala no encontrada' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: roomInfo
      });
    } catch (error) {
      logger.error('Error en checkRoomAvailability controller:', undefined, error);
      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  }

  static async addChatMessage(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      // Verificar autenticación
      const authResult = await UnifiedAuth(request, ['PATIENT', 'DOCTOR', 'ADMIN']);
      if (!authResult.success) return authResult.response;

      const sessionId = params.id;
      const { message } = await request.json();

      if (!message || typeof message !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Mensaje requerido' },
          { status: 400 }
        );
      }

      // Verificar que el usuario es participante de la sesión
      const existingSession = await TelemedicineService.getSession(sessionId);
      if (!existingSession) {
        return NextResponse.json(
          { success: false, error: 'Sesión no encontrada' },
          { status: 404 }
        );
      }

      const canSendMessage = 
        authResult.context?.userRole === 'ADMIN' ||
        existingSession.patientId === authResult.context?.userId ||
        existingSession.doctorId === authResult.context?.userId;

      if (!canSendMessage) {
        return NextResponse.json(
          { success: false, error: 'Acceso denegado' },
          { status: 403 }
        );
      }

      // Determinar el tipo de emisor
      let senderType: 'patient' | 'doctor' = 'patient';
      if (existingSession.doctorId === authResult.context?.userId) {
        senderType = 'doctor';
      }

      const chatMessage = await TelemedicineService.addChatMessage(sessionId, {
        senderId: authResult.context?.userId!,
        senderType,
        message,
        timestamp: new Date()
      });

      return NextResponse.json({
        success: true,
        data: chatMessage
      }, { status: 201 });
    } catch (error) {
      logger.error('Error en addChatMessage controller:', undefined, error);
      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  }

  static async getChatHistory(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      // Verificar autenticación
      const authResult = await UnifiedAuth(request, ['PATIENT', 'DOCTOR', 'ADMIN']);
      if (!authResult.success) return authResult.response;

      const sessionId = params.id;

      // Verificar que el usuario es participante de la sesión
      const existingSession = await TelemedicineService.getSession(sessionId);
      if (!existingSession) {
        return NextResponse.json(
          { success: false, error: 'Sesión no encontrada' },
          { status: 404 }
        );
      }

      const canViewChat = 
        authResult.context?.userRole === 'ADMIN' ||
        existingSession.patientId === authResult.context?.userId ||
        existingSession.doctorId === authResult.context?.userId;

      if (!canViewChat) {
        return NextResponse.json(
          { success: false, error: 'Acceso denegado' },
          { status: 403 }
        );
      }

      const chatHistory = await TelemedicineService.getChatHistory(sessionId);

      return NextResponse.json({
        success: true,
        data: chatHistory
      });
    } catch (error) {
      logger.error('Error en getChatHistory controller:', undefined, error);
      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  }

  static async getSystemStatus(request: NextRequest): Promise<NextResponse> {
    try {
      // Verificar autenticación - solo admins
      const authResult = await UnifiedAuth(request, ['ADMIN']);
      if (!authResult.success) return authResult.response;

      const { searchParams } = new URL(request.url);
      const includeRoomStats = searchParams.get('includeRoomStats') === 'true';

      const status = await TelemedicineService.getSystemStatus(includeRoomStats);

      return NextResponse.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Error en getSystemStatus controller:', undefined, error);
      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  }

  static async getStats(request: NextRequest): Promise<NextResponse> {
    try {
      // Verificar autenticación
      const authResult = await UnifiedAuth(request, ['PATIENT', 'DOCTOR', 'ADMIN']);
      if (!authResult.success) return authResult.response;

      const { searchParams } = new URL(request.url);
      const userId = searchParams.get('userId');
      const userType = searchParams.get('userType') as 'patient' | 'doctor';
      const period = searchParams.get('period') || '30d';

      if (userId && userType) {
        // Estadísticas de usuario específico
        if (authResult.context?.userRole !== 'ADMIN' && userId !== authResult.context?.userId) {
          return NextResponse.json(
            { success: false, error: 'Acceso denegado' },
            { status: 403 }
          );
        }

        const stats = await TelemedicineService.getUserStats(userId, userType, period);
        return NextResponse.json({
          success: true,
          data: stats
        });
      } else {
        // Estadísticas globales - solo para admins
        if (authResult.context?.userRole !== 'ADMIN') {
          return NextResponse.json(
            { success: false, error: 'Acceso denegado' },
            { status: 403 }
          );
        }

        const stats = await TelemedicineService.getGlobalStats(period);
        return NextResponse.json({
          success: true,
          data: stats
        });
      }
    } catch (error) {
      logger.error('Error en getStats controller:', undefined, error);
      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  }
}