/**
 * 🏥 API Endpoint: Guardar Anamnesis de Alta
 * Endpoint E2E para persistir datos de anamnesis completos
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { UnifiedAuth } from '@/auth/UnifiedAuthSystem';
import { db } from '@/lib/database-compat';
import { auditService } from '@/services/audit.service';
import { notificationService } from '@/notifications/UnifiedNotificationSystem';

import { logger } from '@altamedica/shared/services/logger.service';
// Schema de validación para anamnesis
const AnamnesisSchema = z.object({
  patientId: z.string().uuid(),
  summary: z.object({
    chiefComplaint: z.string().optional(),
    symptoms: z.array(z.object({
      name: z.string(),
      severity: z.number().min(1).max(10),
      duration: z.string(),
      triggers: z.array(z.string()).optional()
    })).optional(),
    medicalHistory: z.object({
      conditions: z.array(z.string()).optional(),
      surgeries: z.array(z.string()).optional(),
      allergies: z.array(z.string()).optional(),
      medications: z.array(z.object({
        name: z.string(),
        dose: z.string(),
        frequency: z.string()
      })).optional()
    }).optional(),
    familyHistory: z.object({
      conditions: z.array(z.string()).optional(),
      notes: z.string().optional()
    }).optional(),
    socialHistory: z.object({
      smoking: z.boolean().optional(),
      alcohol: z.boolean().optional(),
      exercise: z.string().optional(),
      diet: z.string().optional(),
      occupation: z.string().optional()
    }).optional(),
    vitalSigns: z.object({
      bloodPressure: z.string().optional(),
      heartRate: z.number().optional(),
      temperature: z.number().optional(),
      respiratoryRate: z.number().optional(),
      oxygenSaturation: z.number().optional(),
      weight: z.number().optional(),
      height: z.number().optional()
    }).optional(),
    physicalExam: z.object({
      general: z.string().optional(),
      heent: z.string().optional(),
      cardiovascular: z.string().optional(),
      respiratory: z.string().optional(),
      gastrointestinal: z.string().optional(),
      musculoskeletal: z.string().optional(),
      neurological: z.string().optional(),
      skin: z.string().optional()
    }).optional(),
    assessment: z.object({
      diagnosis: z.array(z.string()).optional(),
      differentialDiagnosis: z.array(z.string()).optional(),
      plan: z.string().optional(),
      followUp: z.string().optional(),
      urgencyLevel: z.enum(['routine', 'urgent', 'emergency']).optional()
    }).optional(),
    // Metadata de Alta
    altaMetadata: z.object({
      sessionDuration: z.number().optional(),
      completionRate: z.number().optional(),
      aiInsights: z.array(z.string()).optional(),
      confidenceScore: z.number().optional(),
      mode: z.enum(['preventive', 'illness', 'emergency', 'followup']).optional()
    }).optional()
  }),
  completedAt: z.string().datetime()
});

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticación
    const authResult = await UnifiedAuth(request, ['patient']);
    if (!authResult.success) {
      return authResult.response;
    }

    // 2. Validación de datos
    const body = await request.json();
    const validatedData = AnamnesisSchema.parse(body);

    // Verificar que el paciente solo puede guardar su propia anamnesis
    if (validatedData.patientId !== authResult.user.id) {
      return NextResponse.json(
        { error: 'No autorizado para guardar anamnesis de otro paciente' },
        { status: 403 }
      );
    }

    // 3. Guardar en base de datos
    const anamnesisId = `anamnesis_${Date.now()}_${validatedData.patientId}`;
    
    // Guardar en Firestore (colección principal)
    const anamnesisDoc = {
      id: anamnesisId,
      ...validatedData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: authResult.user.id,
      status: 'completed',
      // Encriptar datos sensibles antes de guardar
      encryptedSummary: encryptPHI(JSON.stringify(validatedData.summary))
    };

    await db.collection('anamnesis').doc(anamnesisId).set(anamnesisDoc);

    // 4. Actualizar historial médico del paciente
    await db.collection('patients').doc(validatedData.patientId).update({
      lastAnamnesisDate: validatedData.completedAt,
      anamnesisHistory: db.FieldValue.arrayUnion(anamnesisId),
      medicalProfile: {
        ...validatedData.summary.medicalHistory,
        lastUpdated: new Date().toISOString()
      }
    });

    // 5. Crear registro de auditoría HIPAA
    await auditService.logAccess({
      userId: authResult.user.id,
      action: 'CREATE_ANAMNESIS',
      resource: `anamnesis/${anamnesisId}`,
      patientId: validatedData.patientId,
      metadata: {
        mode: validatedData.summary.altaMetadata?.mode || 'complete',
        urgencyLevel: validatedData.summary.assessment?.urgencyLevel || 'routine',
        completionRate: validatedData.summary.altaMetadata?.completionRate || 100
      },
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    // 6. Procesar urgencias si es necesario
    if (validatedData.summary.assessment?.urgencyLevel === 'emergency') {
      // Notificar al equipo médico
      await notificationService.createNotification({
        userId: 'medical-team',
        type: 'emergency_anamnesis',
        title: '⚠️ Anamnesis de Emergencia',
        message: `Paciente ${validatedData.patientId} requiere atención urgente`,
        priority: 'high',
        channels: ['push', 'email', 'sms'],
        metadata: {
          anamnesisId,
          patientId: validatedData.patientId,
          symptoms: validatedData.summary.symptoms
        }
      });

      // Crear cita de emergencia automática
      await createEmergencyAppointment(validatedData.patientId, anamnesisId);
    }

    // 7. Integración con agentes IA (si están configurados)
    if (process.env.MANUS_API_KEY || process.env.GENSPARK_API_KEY) {
      // Enviar a procesamiento asíncrono con agentes
      await processWithAIAgents(anamnesisId, validatedData.summary);
    }

    // 8. Respuesta exitosa
    return NextResponse.json({
      success: true,
      anamnesisId,
      message: 'Anamnesis guardada exitosamente',
      urgencyDetected: validatedData.summary.assessment?.urgencyLevel === 'emergency',
      nextSteps: getNextSteps(validatedData.summary.assessment?.urgencyLevel)
    }, { status: 201 });

  } catch (error) {
    logger.error('Error guardando anamnesis:', undefined, error);
    
    // Log error para debugging
    await auditService.logError({
      error: error instanceof Error ? error.message : 'Unknown error',
      endpoint: '/api/v1/anamnesis/save',
      userId: request.headers.get('x-user-id') || 'unknown'
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos de anamnesis inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno guardando anamnesis' },
      { status: 500 }
    );
  }
}

// Funciones auxiliares
function encryptPHI(data: string): string {
  // Implementación de encriptación AES-256-GCM
  // Por ahora retornamos el dato tal cual (implementar encriptación real)
  return Buffer.from(data).toString('base64');
}

async function createEmergencyAppointment(patientId: string, anamnesisId: string) {
  // Lógica para crear cita de emergencia
  const emergencySlot = new Date();
  emergencySlot.setHours(emergencySlot.getHours() + 1); // Cita en 1 hora
  
  await db.collection('appointments').add({
    patientId,
    type: 'emergency',
    scheduledFor: emergencySlot.toISOString(),
    reason: 'Emergencia detectada por Alta',
    anamnesisRef: anamnesisId,
    status: 'confirmed',
    priority: 'urgent',
    createdAt: new Date().toISOString()
  });
}

async function processWithAIAgents(anamnesisId: string, summary: any) {
  // Procesamiento asíncrono con Manus/GenSpark
  // Esto se ejecuta en background
  try {
    // Análisis con Manus
    if (process.env.MANUS_API_KEY) {
      // await manusSDK.analyzeMedicalData(summary);
    }
    
    // Generación de documentos con GenSpark
    if (process.env.GENSPARK_API_KEY) {
      // await genSparkSDK.generateMedicalReport(summary);
    }
  } catch (error) {
    logger.error('Error procesando con agentes IA:', undefined, error);
  }
}

function getNextSteps(urgencyLevel?: string): string[] {
  switch (urgencyLevel) {
    case 'emergency':
      return [
        'Un médico será notificado inmediatamente',
        'Se ha creado una cita de emergencia',
        'Por favor, diríjase al centro médico más cercano si los síntomas empeoran'
      ];
    case 'urgent':
      return [
        'Se recomienda agendar una cita en las próximas 24-48 horas',
        'Un médico revisará su anamnesis pronto',
        'Monitoree sus síntomas y contacte si empeoran'
      ];
    default:
      return [
        'Su anamnesis ha sido guardada en su historial médico',
        'Puede agendar una cita de seguimiento cuando lo desee',
        'Sus datos están seguros y disponibles para su próxima consulta'
      ];
  }
}