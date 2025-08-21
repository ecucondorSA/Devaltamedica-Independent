/**
 * 🧪 LAB RESULTS API ROUTES - ALTAMEDICA
 * API endpoints para la gestión de resultados de laboratorio
 * 
 * Endpoints:
 * - GET /api/v1/lab-results - Listar resultados de laboratorio con filtros
 * - POST /api/v1/lab-results - Crear nuevo resultado de laboratorio
 */

import { NextRequest, NextResponse } from 'next/server';
import { UnifiedAuth } from '@/middleware/auth';
import { createSuccessResponse, createErrorResponse } from '@/lib/response-helpers';
import { adminDb } from '@/lib/firebase-admin';
import { z } from 'zod';

import { logger } from '@altamedica/shared/services/logger.service';
// Esquema para validación de resultados de laboratorio
const LabResultSchema = z.object({
  patientId: z.string().min(1, "El ID del paciente es requerido."),
  doctorId: z.string().min(1, "El ID del doctor es requerido."),
  testName: z.string().min(1, "El nombre del test es requerido."),
  category: z.enum(['hematology', 'chemistry', 'immunology', 'microbiology', 'pathology', 'other']).default('other'),
  testCode: z.string().optional(),
  result: z.string().min(1, "El resultado es requerido."),
  normalRange: z.string().optional(),
  units: z.string().optional(),
  status: z.enum(['pending', 'completed', 'verified', 'amended', 'cancelled']).default('completed'),
  priority: z.enum(['routine', 'urgent', 'stat']).default('routine'),
  collectionDate: z.string().transform(str => new Date(str)),
  reportDate: z.string().transform(str => new Date(str)),
  laboratoryName: z.string().optional(),
  notes: z.string().optional(),
  criticalFlag: z.boolean().default(false),
  reference: z.object({
    low: z.number().optional(),
    high: z.number().optional(),
    text: z.string().optional(),
  }).optional(),
});

// Esquema para filtros de búsqueda
const LabResultsQuerySchema = z.object({
  patientId: z.string().optional(),
  doctorId: z.string().optional(),
  category: z.enum(['hematology', 'chemistry', 'immunology', 'microbiology', 'pathology', 'other']).optional(),
  status: z.enum(['pending', 'completed', 'verified', 'amended', 'cancelled']).optional(),
  priority: z.enum(['routine', 'urgent', 'stat']).optional(),
  criticalFlag: z.boolean().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.string().transform(val => parseInt(val) || 20).optional(),
  offset: z.string().transform(val => parseInt(val) || 0).optional(),
  orderBy: z.enum(['reportDate', 'collectionDate', 'testName', 'priority']).optional().default('reportDate'),
  orderDirection: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * GET /api/v1/lab-results
 * Obtener resultados de laboratorio con filtros y paginación
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
    const validatedQuery = LabResultsQuerySchema.parse(queryParams);

    // Si es paciente, solo puede ver sus propios resultados
    if (user.role === 'PATIENT') {
      validatedQuery.patientId = user.uid;
    }

    // Si es doctor, puede ver resultados de sus pacientes
    if (user.role === 'DOCTOR') {
      validatedQuery.doctorId = user.uid;
    }

    // Construir query de Firestore
    let query = adminDb.collection('lab_results');

    // Aplicar filtros
    if (validatedQuery.patientId) {
      query = query.where('patientId', '==', validatedQuery.patientId);
    }
    if (validatedQuery.doctorId) {
      query = query.where('doctorId', '==', validatedQuery.doctorId);
    }
    if (validatedQuery.category) {
      query = query.where('category', '==', validatedQuery.category);
    }
    if (validatedQuery.status) {
      query = query.where('status', '==', validatedQuery.status);
    }
    if (validatedQuery.priority) {
      query = query.where('priority', '==', validatedQuery.priority);
    }
    if (validatedQuery.criticalFlag !== undefined) {
      query = query.where('criticalFlag', '==', validatedQuery.criticalFlag);
    }

    // Filtros de fecha
    if (validatedQuery.startDate) {
      query = query.where('reportDate', '>=', new Date(validatedQuery.startDate));
    }
    if (validatedQuery.endDate) {
      query = query.where('reportDate', '<=', new Date(validatedQuery.endDate));
    }

    // Ordenamiento
    query = query.orderBy(validatedQuery.orderBy!, validatedQuery.orderDirection!);

    // Paginación
    if (validatedQuery.offset && validatedQuery.offset > 0) {
      const lastDoc = await getLastDocument(query, validatedQuery.offset);
      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }
    }

    // Límite
    query = query.limit(validatedQuery.limit! + 1); // +1 para saber si hay más

    // Ejecutar query
    const snapshot = await query.get();
    const results = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convertir timestamps de Firestore a ISO strings
      collectionDate: doc.data().collectionDate?.toDate?.()?.toISOString() || doc.data().collectionDate,
      reportDate: doc.data().reportDate?.toDate?.()?.toISOString() || doc.data().reportDate,
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
    }));

    // Verificar si hay más resultados
    const hasMore = results.length > validatedQuery.limit!;
    if (hasMore) {
      results.pop(); // Remover el elemento extra
    }

    return createSuccessResponse(results, {
      pagination: {
        total: snapshot.size,
        limit: validatedQuery.limit,
        offset: validatedQuery.offset,
        hasMore: hasMore
      }
    });

  } catch (error) {
    logger.error('Error fetching lab results:', undefined, error);
    
    if (error instanceof z.ZodError) {
      return createErrorResponse('VALIDATION_ERROR', 'Parámetros de consulta inválidos', 400, {
        details: error.errors
      });
    }

    return createErrorResponse(
      'INTERNAL_ERROR',
      'Error interno del servidor al obtener resultados de laboratorio',
      500
    );
  }
}

/**
 * POST /api/v1/lab-results
 * Crear nuevo resultado de laboratorio
 */
export async function POST(request: NextRequest) {
  try {
    // Solo doctores y admins pueden crear resultados de laboratorio
    const authResult = await UnifiedAuth(request, ['DOCTOR', 'ADMIN']);
    if (!authResult.success) {
      return authResult.response;
    }

    const { user } = authResult;
    const body = await request.json();

    // Validar datos del cuerpo
    const validatedData = LabResultSchema.parse(body);

    // Si es doctor, asignar su ID automáticamente
    if (user.role === 'DOCTOR') {
      validatedData.doctorId = user.uid;
    }

    // Agregar metadatos de auditoría
    const labResult = {
      ...validatedData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: user.uid,
      // Generar número de referencia único
      referenceNumber: `LAB-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
    };

    // Guardar en Firestore
    const docRef = adminDb.collection('lab_results').doc(labResult.id);
    await docRef.set(labResult);

    // Log de auditoría HIPAA
    await adminDb.collection('audit_logs').add({
      action: 'CREATE_LAB_RESULT',
      userId: user.uid,
      userRole: user.role,
      resourceType: 'lab_result',
      resourceId: labResult.id,
      patientId: labResult.patientId,
      timestamp: new Date(),
      details: {
        testName: labResult.testName,
        category: labResult.category,
        criticalFlag: labResult.criticalFlag,
      },
    });

    return createSuccessResponse({
      ...labResult,
      collectionDate: labResult.collectionDate.toISOString(),
      reportDate: labResult.reportDate.toISOString(),
      createdAt: labResult.createdAt.toISOString(),
      updatedAt: labResult.updatedAt.toISOString(),
    }, null, 201);

  } catch (error) {
    logger.error('Error creating lab result:', undefined, error);

    if (error instanceof z.ZodError) {
      return createErrorResponse('VALIDATION_ERROR', 'Datos del resultado de laboratorio inválidos', 400, {
        details: error.errors
      });
    }

    return createErrorResponse(
      'INTERNAL_ERROR',
      'Error interno del servidor al crear resultado de laboratorio',
      500
    );
  }
}

/**
 * Función auxiliar para obtener el último documento para paginación
 */
async function getLastDocument(query: any, offset: number) {
  const snapshot = await query.limit(offset).get();
  return snapshot.docs[snapshot.docs.length - 1];
}