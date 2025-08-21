import { NextRequest, NextResponse } from 'next/server';
import { PatientService } from './patient.service';
import { PatientQueryOptions } from './patient.types';
import { UnifiedAuth } from '@/shared/middleware/UnifiedAuth';

import { logger } from '@altamedica/shared/services/logger.service';
export class PatientController {
  static async getAllPatients(request: NextRequest): Promise<NextResponse> {
    try {
      // Verificar autenticación - solo doctores y admins
      const authResult = await UnifiedAuth(request, ['DOCTOR', 'ADMIN']);
      if (!authResult.success) return authResult.response;

      // Extraer parámetros de consulta
      const { searchParams } = new URL(request.url);
      const options: PatientQueryOptions = {
        doctorId: searchParams.get('doctorId') || undefined,
        search: searchParams.get('search') || undefined,
        page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
        limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
        sortBy: (searchParams.get('sortBy') as any) || 'createdAt',
        sortOrder: (searchParams.get('sortOrder') as any) || 'desc'
      };

      const patients = await PatientService.getAllPatients(options, authResult.context);

      return NextResponse.json({
        success: true,
        data: patients
      });
    } catch (error) {
      logger.error('Error en getAllPatients controller:', undefined, error);
      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  }

  static async getPatientsByDoctor(request: NextRequest): Promise<NextResponse> {
    try {
      // Verificar autenticación
      const authResult = await UnifiedAuth(request, ['DOCTOR', 'ADMIN']);
      if (!authResult.success) return authResult.response;

      const { searchParams } = new URL(request.url);
      const doctorId = searchParams.get('doctorId');

      if (!doctorId) {
        return NextResponse.json(
          { success: false, error: 'ID de doctor requerido' },
          { status: 400 }
        );
      }

      // Los doctores solo pueden ver sus propios pacientes (excepto admins)
      if (authResult.context?.userRole === 'DOCTOR' && authResult.context.userId !== doctorId) {
        return NextResponse.json(
          { success: false, error: 'Acceso denegado' },
          { status: 403 }
        );
      }

      const patients = await PatientService.getPatientsByDoctor(doctorId);

      return NextResponse.json({
        success: true,
        data: patients
      });
    } catch (error) {
      logger.error('Error en getPatientsByDoctor controller:', undefined, error);
      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  }

  static async getPatientById(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      // Verificar autenticación
      const authResult = await UnifiedAuth(request, ['PATIENT', 'DOCTOR', 'ADMIN']);
      if (!authResult.success) return authResult.response;

      const patientId = params.id;

      const patient = await PatientService.getPatientById(patientId, authResult.context);

      if (!patient) {
        return NextResponse.json(
          { success: false, error: 'Paciente no encontrado' },
          { status: 404 }
        );
      }

      // Verificar permisos: solo el propio paciente, su doctor asignado o admin
      const canAccess = 
        authResult.context?.userRole === 'ADMIN' ||
        (authResult.context?.userRole === 'PATIENT' && patient.userId === authResult.context.userId) ||
        (authResult.context?.userRole === 'DOCTOR' && patient.assignedDoctor === authResult.context.userId);

      if (!canAccess) {
        return NextResponse.json(
          { success: false, error: 'Acceso denegado' },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        data: patient
      });
    } catch (error) {
      logger.error('Error en getPatientById controller:', undefined, error);
      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  }

  static async createPatient(request: NextRequest): Promise<NextResponse> {
    try {
      // Verificar autenticación - solo admins y doctores pueden crear pacientes
      const authResult = await UnifiedAuth(request, ['ADMIN', 'DOCTOR']);
      if (!authResult.success) return authResult.response;

      const body = await request.json();

      const patient = await PatientService.createPatient(body, authResult.context);

      return NextResponse.json({
        success: true,
        data: patient
      }, { status: 201 });
    } catch (error) {
      logger.error('Error en createPatient controller:', undefined, error);
      const statusCode = error.message.includes('inválidos') ? 400 : 500;
      return NextResponse.json(
        { success: false, error: error.message },
        { status: statusCode }
      );
    }
  }

  static async updatePatient(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      // Verificar autenticación
      const authResult = await UnifiedAuth(request, ['PATIENT', 'DOCTOR', 'ADMIN']);
      if (!authResult.success) return authResult.response;

      const patientId = params.id;
      const body = await request.json();

      // Obtener el paciente actual para verificar permisos
      const existingPatient = await PatientService.getPatientById(patientId);
      
      if (!existingPatient) {
        return NextResponse.json(
          { success: false, error: 'Paciente no encontrado' },
          { status: 404 }
        );
      }

      // Verificar permisos de actualización
      const canUpdate = 
        authResult.context?.userRole === 'ADMIN' ||
        (authResult.context?.userRole === 'PATIENT' && existingPatient.userId === authResult.context.userId) ||
        (authResult.context?.userRole === 'DOCTOR' && existingPatient.assignedDoctor === authResult.context.userId);

      if (!canUpdate) {
        return NextResponse.json(
          { success: false, error: 'Acceso denegado' },
          { status: 403 }
        );
      }

      const updatedPatient = await PatientService.updatePatient(patientId, body, authResult.context);

      return NextResponse.json({
        success: true,
        data: updatedPatient
      });
    } catch (error) {
      logger.error('Error en updatePatient controller:', undefined, error);
      const statusCode = error.message.includes('inválidos') ? 400 : 500;
      return NextResponse.json(
        { success: false, error: error.message },
        { status: statusCode }
      );
    }
  }

  static async deletePatient(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      // Verificar autenticación - solo admins pueden eliminar pacientes
      const authResult = await UnifiedAuth(request, ['ADMIN']);
      if (!authResult.success) return authResult.response;

      const patientId = params.id;

      await PatientService.deletePatient(patientId, authResult.context);

      return NextResponse.json({
        success: true,
        message: 'Paciente eliminado correctamente'
      });
    } catch (error) {
      logger.error('Error en deletePatient controller:', undefined, error);
      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  }

  static async getPatientStats(request: NextRequest): Promise<NextResponse> {
    try {
      // Verificar autenticación
      const authResult = await UnifiedAuth(request, ['DOCTOR', 'ADMIN']);
      if (!authResult.success) return authResult.response;

      const { searchParams } = new URL(request.url);
      const doctorId = searchParams.get('doctorId');

      // Los doctores solo pueden ver sus propias estadísticas
      const targetDoctorId = 
        authResult.context?.userRole === 'DOCTOR' 
          ? authResult.context.userId 
          : doctorId || undefined;

      const stats = await PatientService.getPatientStats(targetDoctorId);

      return NextResponse.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error en getPatientStats controller:', undefined, error);
      return NextResponse.json(
        { success: false, error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  }
}