/**
 * API Routes para Patient Crystal Ball
 * Endpoints para predicción de evolución y readmisiones
 */

import { NextRequest, NextResponse } from 'next/server';
import { UnifiedAuth } from '@/auth/UnifiedAuthSystem';
import { patientPredictorService } from '@/services/patient-predictor.service';
import { 
  PredictionRequestSchema,
  BatchPredictionRequestSchema 
} from '@altamedica/types';
import { z } from 'zod';

import { logger } from '@altamedica/shared/services/logger.service';
/**
 * POST /api/v1/predictions/generate
 * Genera una nueva predicción para un paciente
 */
export async function POST(request: NextRequest) {
  try {
    // Autenticación
    const authResult = await UnifiedAuth(request, ['doctor', 'admin']);
    if (!authResult.success) {
      return authResult.response;
    }

    // Validar request body
    const body = await request.json();
    const validatedData = PredictionRequestSchema.parse(body);

    // Verificar permisos sobre el paciente
    const hasAccess = await checkPatientAccess(
      authResult.user.uid,
      validatedData.patientId,
      authResult.user.role
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'No tiene permisos para acceder a este paciente' },
        { status: 403 }
      );
    }

    // Generar predicción
    const prediction = await patientPredictorService.generatePrediction(validatedData);

    // Registrar en auditoría
    await logAuditEvent({
      userId: authResult.user.uid,
      action: 'GENERATE_PREDICTION',
      resource: `patient:${validatedData.patientId}`,
      details: {
        riskLevel: prediction.prediction.predictions.readmission.riskLevel,
        probability: prediction.prediction.predictions.readmission.probability
      }
    });

    return NextResponse.json(prediction);
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Error generating prediction:', undefined, error);
    return NextResponse.json(
      { error: 'Error al generar predicción' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/predictions/:patientId
 * Obtiene la predicción más reciente de un paciente
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    // Autenticación
    const authResult = await UnifiedAuth(request, ['doctor', 'admin', 'nurse']);
    if (!authResult.success) {
      return authResult.response;
    }

    const patientId = params.patientId;

    // Verificar permisos
    const hasAccess = await checkPatientAccess(
      authResult.user.uid,
      patientId,
      authResult.user.role
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'No tiene permisos para acceder a este paciente' },
        { status: 403 }
      );
    }

    // Obtener predicción más reciente de la base de datos
    const prediction = await getLatestPrediction(patientId);

    if (!prediction) {
      // Si no existe, generar una nueva
      const newPrediction = await patientPredictorService.generatePrediction({
        patientId,
        includeInterventions: true,
        includeFollowUpPlan: true,
        timeframes: ['24h', '48h', '72h']
      });

      return NextResponse.json(newPrediction);
    }

    return NextResponse.json({
      success: true,
      prediction
    });

  } catch (error) {
    logger.error('Error fetching prediction:', undefined, error);
    return NextResponse.json(
      { error: 'Error al obtener predicción' },
      { status: 500 }
    );
  }
}

// Funciones auxiliares
async function checkPatientAccess(
  userId: string,
  patientId: string,
  role: string
): Promise<boolean> {
  // Admin siempre tiene acceso
  if (role === 'admin') return true;

  // Verificar si el doctor/enfermera está asignado al paciente
  // Aquí implementarías la lógica real de verificación
  // Por ahora retornamos true para desarrollo
  return true;
}

async function logAuditEvent(event: any) {
  // Implementar logging de auditoría
  logger.info('Audit event:', event);
}

async function getLatestPrediction(patientId: string) {
  // Implementar obtención de predicción desde base de datos
  // Por ahora retornamos null para forzar generación
  return null;
}