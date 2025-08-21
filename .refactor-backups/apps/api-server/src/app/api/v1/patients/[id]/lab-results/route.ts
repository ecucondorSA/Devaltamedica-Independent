/**
 * 🧪 PATIENT LAB RESULTS API - ALTAMEDICA
 * API endpoints para resultados de laboratorio específicos de un paciente
 * 
 * Endpoints:
 * - GET /api/v1/patients/[id]/lab-results - Obtener resultados de laboratorio de un paciente específico
 */

import { NextRequest, NextResponse } from 'next/server';
import { UnifiedAuth } from '@/middleware/auth';
import { createSuccessResponse, createErrorResponse } from '@/lib/response-helpers';
import { adminDb } from '@/lib/firebase-admin';
import { z } from 'zod';

import { logger } from '@altamedica/shared/services/logger.service';
// Esquema para filtros específicos de paciente
const PatientLabResultsQuerySchema = z.object({
  category: z.enum(['hematology', 'chemistry', 'immunology', 'microbiology', 'pathology', 'other']).optional(),
  status: z.enum(['pending', 'completed', 'verified', 'amended', 'cancelled']).optional(),
  priority: z.enum(['routine', 'urgent', 'stat']).optional(),
  criticalFlag: z.boolean().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.string().transform(val => parseInt(val) || 50).optional(),
  offset: z.string().transform(val => parseInt(val) || 0).optional(),
  orderBy: z.enum(['reportDate', 'collectionDate', 'testName', 'priority']).optional().default('reportDate'),
  orderDirection: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * GET /api/v1/patients/[id]/lab-results
 * Obtener todos los resultados de laboratorio de un paciente específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Autenticación - el paciente puede ver sus propios resultados, los doctores pueden ver resultados de sus pacientes
    const authResult = await UnifiedAuth(request, ['DOCTOR', 'PATIENT', 'ADMIN']);
    if (!authResult.success) {
      return authResult.response;
    }

    const { user } = authResult;
    const patientId = params.id;
    const { searchParams } = new URL(request.url);

    // Validar que el paciente solo puede acceder a sus propios resultados
    if (user.role === 'PATIENT' && user.uid !== patientId) {
      return createErrorResponse(
        'FORBIDDEN',
        'No tienes permisos para acceder a los resultados de laboratorio de otro paciente',
        403
      );
    }

    // Validar parámetros de query
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedQuery = PatientLabResultsQuerySchema.parse(queryParams);

    // Construir query de Firestore
    let query = adminDb.collection('lab_results')
      .where('patientId', '==', patientId);

    // Aplicar filtros adicionales
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

    // Obtener estadísticas adicionales
    const stats = await getLabResultsStats(patientId, user);

    return createSuccessResponse(results, {
      pagination: {
        total: snapshot.size,
        limit: validatedQuery.limit,
        offset: validatedQuery.offset,
        hasMore: hasMore
      },
      stats: stats
    });

  } catch (error) {
    logger.error('Error fetching patient lab results:', undefined, error);
    
    if (error instanceof z.ZodError) {
      return createErrorResponse('VALIDATION_ERROR', 'Parámetros de consulta inválidos', 400, {
        details: error.errors
      });
    }

    return createErrorResponse(
      'INTERNAL_ERROR',
      'Error interno del servidor al obtener resultados de laboratorio del paciente',
      500
    );
  }
}

/**
 * Función auxiliar para obtener estadísticas de resultados de laboratorio
 */
async function getLabResultsStats(patientId: string, user: any) {
  try {
    const [
      totalResults,
      pendingResults,
      criticalResults,
      recentResults,
      resultsByCategory
    ] = await Promise.all([
      // Total de resultados
      adminDb.collection('lab_results')
        .where('patientId', '==', patientId)
        .count()
        .get(),
      
      // Resultados pendientes
      adminDb.collection('lab_results')
        .where('patientId', '==', patientId)
        .where('status', '==', 'pending')
        .count()
        .get(),
      
      // Resultados críticos
      adminDb.collection('lab_results')
        .where('patientId', '==', patientId)
        .where('criticalFlag', '==', true)
        .count()
        .get(),
      
      // Resultados recientes (últimos 30 días)
      adminDb.collection('lab_results')
        .where('patientId', '==', patientId)
        .where('reportDate', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        .count()
        .get(),
      
      // Resultados por categoría
      getResultsByCategory(patientId)
    ]);

    return {
      totalResults: totalResults.data().count,
      pendingResults: pendingResults.data().count,
      criticalResults: criticalResults.data().count,
      recentResults: recentResults.data().count,
      resultsByCategory: resultsByCategory,
    };
  } catch (error) {
    logger.error('Error getting lab results stats:', undefined, error);
    return {
      totalResults: 0,
      pendingResults: 0,
      criticalResults: 0,
      recentResults: 0,
      resultsByCategory: {},
    };
  }
}

/**
 * Función auxiliar para obtener resultados agrupados por categoría
 */
async function getResultsByCategory(patientId: string) {
  try {
    const categories = ['hematology', 'chemistry', 'immunology', 'microbiology', 'pathology', 'other'];
    const categoryCounts: Record<string, number> = {};

    for (const category of categories) {
      const snapshot = await adminDb.collection('lab_results')
        .where('patientId', '==', patientId)
        .where('category', '==', category)
        .count()
        .get();
      
      categoryCounts[category] = snapshot.data().count;
    }

    return categoryCounts;
  } catch (error) {
    logger.error('Error getting results by category:', undefined, error);
    return {};
  }
}

/**
 * Función auxiliar para obtener el último documento para paginación
 */
async function getLastDocument(query: any, offset: number) {
  const snapshot = await query.limit(offset).get();
  return snapshot.docs[snapshot.docs.length - 1];
}