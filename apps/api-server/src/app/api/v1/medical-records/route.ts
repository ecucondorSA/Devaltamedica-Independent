/**
 * 🏥 MEDICAL RECORDS API ROUTES - ALTAMEDICA
 * API endpoints para la gestión de historiales médicos
 * 
 * Endpoints:
 * - GET /api/v1/medical-records - Listar historiales médicos con filtros
 * - POST /api/v1/medical-records - Crear nuevo historial médico
 */

import { NextRequest, NextResponse } from 'next/server';
import { UnifiedAuth } from '@/middleware/auth';
import { medicalRecordService } from '@/services/medical-record.service';
import { createSuccessResponse, createErrorResponse } from '@/lib/response-helpers';
import { z } from 'zod';

import { logger } from '@altamedica/shared/services/logger.service';
// Esquema para filtros de búsqueda
const MedicalRecordsQuerySchema = z.object({
  patientId: z.string().optional(),
  doctorId: z.string().optional(),
  type: z.enum(['consultation', 'diagnosis', 'treatment', 'test_result', 'prescription', 'other']).optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional().default('active'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.string().transform(val => parseInt(val) || 20).optional(),
  offset: z.string().transform(val => parseInt(val) || 0).optional(),
});

/**
 * GET /api/v1/medical-records
 * Obtener historiales médicos con filtros y paginación
 */
export async function GET(request: NextRequest) {
  try {
    // Autenticación - médicos, pacientes y admins pueden acceder
    const authResult = await UnifiedAuth(request, ['DOCTOR', 'PATIENT', 'ADMIN']);
    if (!authResult.success) {
      return authResult.response;
    }

    const { user } = authResult;
    const { searchParams } = new URL(request.url);
    
    // Validar parámetros de query
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedQuery = MedicalRecordsQuerySchema.parse(queryParams);

    // Si es paciente, solo puede ver sus propios registros
    if (user.role === 'PATIENT') {
      validatedQuery.patientId = user.uid;
    }

    // Si es doctor, puede ver registros de sus pacientes
    if (user.role === 'DOCTOR') {
      validatedQuery.doctorId = user.uid;
    }

    // Construir opciones para el servicio
    const options = {
      filters: {
        patientId: validatedQuery.patientId,
        doctorId: validatedQuery.doctorId,
        type: validatedQuery.type,
        status: validatedQuery.status,
        priority: validatedQuery.priority,
        createdAt: {
          start: validatedQuery.startDate ? new Date(validatedQuery.startDate) : undefined,
          end: validatedQuery.endDate ? new Date(validatedQuery.endDate) : undefined,
        }
      },
      pagination: {
        limit: validatedQuery.limit,
        offset: validatedQuery.offset,
      }
    };

    // Llamar al servicio
    const result = await medicalRecordService.findMany(options, {
      userId: user.uid,
      userRole: user.role.toLowerCase(),
      requestId: crypto.randomUUID(),
    });

    return createSuccessResponse(result.data, {
      total: result.total,
      limit: validatedQuery.limit,
      offset: validatedQuery.offset,
      hasMore: result.hasMore
    });

  } catch (error) {
    logger.error('Error fetching medical records:', undefined, error);
    
    if (error instanceof z.ZodError) {
      return createErrorResponse('VALIDATION_ERROR', 'Parámetros de consulta inválidos', 400, {
        details: error.errors
      });
    }

    return createErrorResponse(
      'INTERNAL_ERROR',
      'Error interno del servidor al obtener historiales médicos',
      500
    );
  }
}

/**
 * POST /api/v1/medical-records
 * Crear nuevo historial médico
 */
export async function POST(request: NextRequest) {
  try {
    // Solo doctores pueden crear historiales médicos
    const authResult = await UnifiedAuth(request, ['DOCTOR']);
    if (!authResult.success) {
      return authResult.response;
    }

    const { user } = authResult;
    const body = await request.json();

    // El doctorId siempre es el usuario autenticado
    const recordData = {
      ...body,
      doctorId: user.uid,
    };

    // Crear el historial usando el servicio
    const newRecord = await medicalRecordService.create(recordData, {
      userId: user.uid,
      userRole: 'doctor',
      requestId: crypto.randomUUID(),
    });

    return createSuccessResponse(newRecord, null, 201);

  } catch (error) {
    logger.error('Error creating medical record:', undefined, error);

    if (error instanceof z.ZodError) {
      return createErrorResponse('VALIDATION_ERROR', 'Datos del historial médico inválidos', 400, {
        details: error.errors
      });
    }

    if (error.message === 'FORBIDDEN') {
      return createErrorResponse('FORBIDDEN', 'No tienes permisos para crear historiales médicos', 403);
    }

    return createErrorResponse(
      'INTERNAL_ERROR',
      'Error interno del servidor al crear historial médico',
      500
    );
  }
}