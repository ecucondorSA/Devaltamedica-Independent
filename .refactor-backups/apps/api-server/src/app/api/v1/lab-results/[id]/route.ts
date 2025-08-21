/**
 * 🧪 INDIVIDUAL LAB RESULT API - ALTAMEDICA
 * API endpoints para un resultado de laboratorio específico
 * 
 * Endpoints:
 * - GET /api/v1/lab-results/[id] - Obtener un resultado de laboratorio específico
 * - PUT /api/v1/lab-results/[id] - Actualizar un resultado de laboratorio
 * - DELETE /api/v1/lab-results/[id] - Eliminar un resultado de laboratorio
 */

import { NextRequest, NextResponse } from 'next/server';
import { UnifiedAuth } from '@/middleware/auth';
import { createSuccessResponse, createErrorResponse } from '@/lib/response-helpers';
import { adminDb } from '@/lib/firebase-admin';
import { z } from 'zod';

import { logger } from '@altamedica/shared/services/logger.service';
/**
 * GET /api/v1/lab-results/[id]
 * Obtener un resultado de laboratorio específico por ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Autenticación - médicos, pacientes y admins pueden acceder
    const authResult = await UnifiedAuth(request, ['DOCTOR', 'PATIENT', 'ADMIN']);
    if (!authResult.success) {
      return authResult.response;
    }

    const { user } = authResult;
    const labResultId = params.id;

    // Obtener el resultado de laboratorio
    const docRef = adminDb.collection('lab_results').doc(labResultId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return createErrorResponse(
        'NOT_FOUND',
        'Resultado de laboratorio no encontrado',
        404
      );
    }

    const labResult = { id: doc.id, ...doc.data() };

    // Verificar permisos de acceso
    if (user.role === 'PATIENT' && labResult.patientId !== user.uid) {
      return createErrorResponse(
        'FORBIDDEN',
        'No tienes permisos para acceder a este resultado de laboratorio',
        403
      );
    }

    if (user.role === 'DOCTOR' && labResult.doctorId !== user.uid) {
      // Los doctores solo pueden ver resultados de sus propios pacientes
      // Aquí podrías agregar lógica adicional para verificar si el doctor trata al paciente
      return createErrorResponse(
        'FORBIDDEN',
        'No tienes permisos para acceder a este resultado de laboratorio',
        403
      );
    }

    // Log de auditoría HIPAA
    await adminDb.collection('audit_logs').add({
      action: 'VIEW_LAB_RESULT',
      userId: user.uid,
      userRole: user.role,
      resourceType: 'lab_result',
      resourceId: labResultId,
      patientId: labResult.patientId,
      timestamp: new Date(),
      details: {
        testName: labResult.testName,
        category: labResult.category,
        accessMethod: 'direct_id',
      },
    });

    // Convertir timestamps de Firestore a ISO strings
    const formattedResult = {
      ...labResult,
      collectionDate: labResult.collectionDate?.toDate?.()?.toISOString() || labResult.collectionDate,
      reportDate: labResult.reportDate?.toDate?.()?.toISOString() || labResult.reportDate,
      createdAt: labResult.createdAt?.toDate?.()?.toISOString() || labResult.createdAt,
      updatedAt: labResult.updatedAt?.toDate?.()?.toISOString() || labResult.updatedAt,
    };

    return createSuccessResponse(formattedResult);

  } catch (error) {
    logger.error('Error fetching lab result:', undefined, error);
    return createErrorResponse(
      'INTERNAL_ERROR',
      'Error interno del servidor al obtener resultado de laboratorio',
      500
    );
  }
}

/**
 * PUT /api/v1/lab-results/[id]
 * Actualizar un resultado de laboratorio específico
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Solo doctores y admins pueden actualizar resultados
    const authResult = await UnifiedAuth(request, ['DOCTOR', 'ADMIN']);
    if (!authResult.success) {
      return authResult.response;
    }

    const { user } = authResult;
    const labResultId = params.id;
    const body = await request.json();

    // Verificar que el resultado existe
    const docRef = adminDb.collection('lab_results').doc(labResultId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return createErrorResponse(
        'NOT_FOUND',
        'Resultado de laboratorio no encontrado',
        404
      );
    }

    const existingResult = doc.data();

    // Verificar permisos
    if (user.role === 'DOCTOR' && existingResult.doctorId !== user.uid) {
      return createErrorResponse(
        'FORBIDDEN',
        'No tienes permisos para actualizar este resultado de laboratorio',
        403
      );
    }

    // Esquema de validación para actualización
    const UpdateLabResultSchema = z.object({
      result: z.string().optional(),
      normalRange: z.string().optional(),
      units: z.string().optional(),
      status: z.enum(['pending', 'completed', 'verified', 'amended', 'cancelled']).optional(),
      notes: z.string().optional(),
      criticalFlag: z.boolean().optional(),
      reference: z.object({
        low: z.number().optional(),
        high: z.number().optional(),
        text: z.string().optional(),
      }).optional(),
    });

    const validatedData = UpdateLabResultSchema.parse(body);

    // Preparar datos de actualización
    const updateData = {
      ...validatedData,
      updatedAt: new Date(),
      updatedBy: user.uid,
    };

    // Si se está cambiando el estado a 'amended', requerir notas
    if (validatedData.status === 'amended' && !validatedData.notes) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Las notas son requeridas cuando se enmienda un resultado',
        400
      );
    }

    // Actualizar en Firestore
    await docRef.update(updateData);

    // Log de auditoría HIPAA
    await adminDb.collection('audit_logs').add({
      action: 'UPDATE_LAB_RESULT',
      userId: user.uid,
      userRole: user.role,
      resourceType: 'lab_result',
      resourceId: labResultId,
      patientId: existingResult.patientId,
      timestamp: new Date(),
      details: {
        updatedFields: Object.keys(validatedData),
        previousStatus: existingResult.status,
        newStatus: validatedData.status,
      },
    });

    // Obtener resultado actualizado
    const updatedDoc = await docRef.get();
    const updatedResult = { id: updatedDoc.id, ...updatedDoc.data() };

    // Formatear timestamps
    const formattedResult = {
      ...updatedResult,
      collectionDate: updatedResult.collectionDate?.toDate?.()?.toISOString() || updatedResult.collectionDate,
      reportDate: updatedResult.reportDate?.toDate?.()?.toISOString() || updatedResult.reportDate,
      createdAt: updatedResult.createdAt?.toDate?.()?.toISOString() || updatedResult.createdAt,
      updatedAt: updatedResult.updatedAt?.toDate?.()?.toISOString() || updatedResult.updatedAt,
    };

    return createSuccessResponse(formattedResult);

  } catch (error) {
    logger.error('Error updating lab result:', undefined, error);

    if (error instanceof z.ZodError) {
      return createErrorResponse('VALIDATION_ERROR', 'Datos de actualización inválidos', 400, {
        details: error.errors
      });
    }

    return createErrorResponse(
      'INTERNAL_ERROR',
      'Error interno del servidor al actualizar resultado de laboratorio',
      500
    );
  }
}

/**
 * DELETE /api/v1/lab-results/[id]
 * Eliminar (archivar) un resultado de laboratorio específico
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Solo admins pueden eliminar resultados (por compliance)
    const authResult = await UnifiedAuth(request, ['ADMIN']);
    if (!authResult.success) {
      return authResult.response;
    }

    const { user } = authResult;
    const labResultId = params.id;

    // Verificar que el resultado existe
    const docRef = adminDb.collection('lab_results').doc(labResultId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return createErrorResponse(
        'NOT_FOUND',
        'Resultado de laboratorio no encontrado',
        404
      );
    }

    const existingResult = doc.data();

    // Realizar "soft delete" (archivado) en lugar de eliminación física
    await docRef.update({
      status: 'cancelled',
      deletedAt: new Date(),
      deletedBy: user.uid,
      updatedAt: new Date(),
    });

    // Log de auditoría HIPAA crítico
    await adminDb.collection('audit_logs').add({
      action: 'DELETE_LAB_RESULT',
      userId: user.uid,
      userRole: user.role,
      resourceType: 'lab_result',
      resourceId: labResultId,
      patientId: existingResult.patientId,
      timestamp: new Date(),
      details: {
        testName: existingResult.testName,
        originalStatus: existingResult.status,
        deletionReason: 'Administrative deletion',
      },
      severity: 'HIGH', // Marcado como alta gravedad para compliance
    });

    return createSuccessResponse({ 
      message: 'Resultado de laboratorio archivado exitosamente',
      id: labResultId 
    });

  } catch (error) {
    logger.error('Error deleting lab result:', undefined, error);
    return createErrorResponse(
      'INTERNAL_ERROR',
      'Error interno del servidor al eliminar resultado de laboratorio',
      500
    );
  }
}