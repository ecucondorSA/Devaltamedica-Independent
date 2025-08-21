/**
 * 🏥 PATIENT MEDICAL RECORDS API - ALTAMEDICA
 * API endpoints para historiales médicos específicos de un paciente
 * 
 * Endpoints:
 * - GET /api/v1/patients/[id]/medical-records - Obtener historiales de un paciente específico
 */

import { NextRequest, NextResponse } from 'next/server';
import { UnifiedAuth } from '@/middleware/auth';
import { medicalRecordService } from '@/services/medical-record.service';
import { createSuccessResponse, createErrorResponse } from '@/lib/response-helpers';
import { z } from 'zod';

import { logger } from '@altamedica/shared/services/logger.service';
// Esquema para filtros específicos de paciente
const PatientMedicalRecordsQuerySchema = z.object({
  type: z.enum(['consultation', 'diagnosis', 'treatment', 'test_result', 'prescription', 'other']).optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional().default('active'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.string().transform(val => parseInt(val) || 50).optional(),
  offset: z.string().transform(val => parseInt(val) || 0).optional(),
  orderBy: z.enum(['date', 'priority', 'type']).optional().default('date'),
  orderDirection: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * GET /api/v1/patients/[id]/medical-records
 * Obtener todos los historiales médicos de un paciente específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Autenticación - el paciente puede ver sus propios registros, los doctores pueden ver registros de sus pacientes
    const authResult = await UnifiedAuth(request, ['DOCTOR', 'PATIENT', 'ADMIN']);
    if (!authResult.success) {
      return authResult.response;
    }

    const { user } = authResult;
    const patientId = params.id;
    const { searchParams } = new URL(request.url);

    // Validar que el paciente solo puede acceder a sus propios registros
    if (user.role === 'PATIENT' && user.uid !== patientId) {
      return createErrorResponse(
        'FORBIDDEN',
        'No tienes permisos para acceder a los historiales médicos de otro paciente',
        403
      );
    }

    // Validar parámetros de query
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedQuery = PatientMedicalRecordsQuerySchema.parse(queryParams);

    // Construir opciones para el servicio
    const options = {
      filters: {
        patientId: patientId,
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
      },
      orderBy: validatedQuery.orderBy,
      orderDirection: validatedQuery.orderDirection,
    };

    // Llamar al servicio
    const result = await medicalRecordService.findMany(options, {
      userId: user.uid,
      userRole: user.role.toLowerCase(),
      requestId: crypto.randomUUID(),
    });

    // Estadísticas adicionales para el paciente
    const stats = {
      totalRecords: result.total,
      recordsByType: await getRecordsByType(patientId, user),
      lastConsultation: await getLastConsultation(patientId, user),
      activePrescriptions: await getActivePrescriptions(patientId, user),
    };

    return createSuccessResponse(result.data, {
      pagination: {
        total: result.total,
        limit: validatedQuery.limit,
        offset: validatedQuery.offset,
        hasMore: result.hasMore
      },
      stats: stats
    });

  } catch (error) {
    logger.error('Error fetching patient medical records:', undefined, error);
    
    if (error instanceof z.ZodError) {
      return createErrorResponse('VALIDATION_ERROR', 'Parámetros de consulta inválidos', 400, {
        details: error.errors
      });
    }

    return createErrorResponse(
      'INTERNAL_ERROR',
      'Error interno del servidor al obtener historiales médicos del paciente',
      500
    );
  }
}

/**
 * Función auxiliar para obtener estadísticas por tipo de registro
 */
async function getRecordsByType(patientId: string, user: any) {
  try {
    const result = await medicalRecordService.findMany(
      {
        filters: { patientId, status: 'active' },
        groupBy: 'type'
      },
      {
        userId: user.uid,
        userRole: user.role.toLowerCase(),
        requestId: crypto.randomUUID(),
      }
    );
    
    return result.groupedData || {};
  } catch (error) {
    logger.error('Error getting records by type:', undefined, error);
    return {};
  }
}

/**
 * Función auxiliar para obtener la última consulta
 */
async function getLastConsultation(patientId: string, user: any) {
  try {
    const result = await medicalRecordService.findMany(
      {
        filters: { 
          patientId, 
          type: 'consultation',
          status: 'active'
        },
        pagination: { limit: 1, offset: 0 },
        orderBy: 'date',
        orderDirection: 'desc'
      },
      {
        userId: user.uid,
        userRole: user.role.toLowerCase(),
        requestId: crypto.randomUUID(),
      }
    );
    
    return result.data?.[0] || null;
  } catch (error) {
    logger.error('Error getting last consultation:', undefined, error);
    return null;
  }
}

/**
 * Función auxiliar para obtener prescripciones activas
 */
async function getActivePrescriptions(patientId: string, user: any) {
  try {
    const result = await medicalRecordService.findMany(
      {
        filters: { 
          patientId, 
          type: 'prescription',
          status: 'active'
        },
        pagination: { limit: 10, offset: 0 },
        orderBy: 'date',
        orderDirection: 'desc'
      },
      {
        userId: user.uid,
        userRole: user.role.toLowerCase(),
        requestId: crypto.randomUUID(),
      }
    );
    
    return result.data || [];
  } catch (error) {
    logger.error('Error getting active prescriptions:', undefined, error);
    return [];
  }
}