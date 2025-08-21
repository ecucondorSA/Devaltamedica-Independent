/**
 * 🏥 API Endpoint: Listar Anamnesis
 * Obtener historial de anamnesis del paciente
 */

import { NextRequest, NextResponse } from 'next/server';
import { UnifiedAuth } from '@/auth/UnifiedAuthSystem';
import { db } from '@/lib/database-compat';
import { auditService } from '@/services/audit.service';

import { logger } from '@altamedica/shared/services/logger.service';
// GET: Listar anamnesis del paciente
export async function GET(request: NextRequest) {
  try {
    // Autenticación
    const authResult = await UnifiedAuth(request, ['patient', 'doctor', 'admin']);
    if (!authResult.success) {
      return authResult.response;
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId') || authResult.user.id;
    const limit = parseInt(searchParams.get('limit') || '10');
    const mode = searchParams.get('mode'); // preventive, illness, emergency, followup
    
    // Verificar permisos
    const canAccessOthers = authResult.user.role === 'doctor' || authResult.user.role === 'admin';
    if (patientId !== authResult.user.id && !canAccessOthers) {
      return NextResponse.json(
        { error: 'No autorizado para ver anamnesis de otro paciente' },
        { status: 403 }
      );
    }

    // Construir query
    let query = db.collection('anamnesis')
      .where('patientId', '==', patientId)
      .where('status', '!=', 'deleted')
      .orderBy('createdAt', 'desc')
      .limit(limit);
    
    // Filtrar por modo si se especifica
    if (mode) {
      query = query.where('summary.altaMetadata.mode', '==', mode);
    }

    // Ejecutar query
    const snapshot = await query.get();
    const anamnesisHistory = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      // Desencriptar resumen para mostrar
      if (data.encryptedSummary) {
        data.summary = JSON.parse(
          Buffer.from(data.encryptedSummary, 'base64').toString('utf-8')
        );
        delete data.encryptedSummary;
      }
      
      // Agregar solo información resumida
      anamnesisHistory.push({
        id: doc.id,
        createdAt: data.createdAt,
        completedAt: data.completedAt,
        mode: data.summary?.altaMetadata?.mode || 'complete',
        chiefComplaint: data.summary?.chiefComplaint || 'Sin motivo especificado',
        urgencyLevel: data.summary?.assessment?.urgencyLevel || 'routine',
        completionRate: data.summary?.altaMetadata?.completionRate || 100,
        sessionDuration: data.summary?.altaMetadata?.sessionDuration || 0
      });
    });

    // Obtener estadísticas del paciente
    const stats = await getPatientAnamnesisStats(patientId);

    // Registrar acceso
    await auditService.logAccess({
      userId: authResult.user.id,
      action: 'LIST_ANAMNESIS',
      resource: `anamnesis/patient/${patientId}`,
      metadata: { count: anamnesisHistory.length },
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json({
      success: true,
      anamnesis: anamnesisHistory,
      stats,
      total: anamnesisHistory.length
    });

  } catch (error) {
    logger.error('Error listando anamnesis:', undefined, error);
    return NextResponse.json(
      { error: 'Error interno listando anamnesis' },
      { status: 500 }
    );
  }
}

// Función auxiliar para obtener estadísticas
async function getPatientAnamnesisStats(patientId: string) {
  try {
    const snapshot = await db.collection('anamnesis')
      .where('patientId', '==', patientId)
      .where('status', '!=', 'deleted')
      .get();
    
    let preventiveCount = 0;
    let illnessCount = 0;
    let emergencyCount = 0;
    let totalSessions = snapshot.size;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const mode = data.summary?.altaMetadata?.mode;
      
      if (mode === 'preventive') preventiveCount++;
      else if (mode === 'illness') illnessCount++;
      else if (mode === 'emergency') emergencyCount++;
    });
    
    return {
      totalSessions,
      preventiveCount,
      illnessCount,
      emergencyCount,
      lastSessionDate: snapshot.docs[0]?.data()?.createdAt || null
    };
  } catch (error) {
    logger.error('Error obteniendo estadísticas:', undefined, error);
    return null;
  }
}