/**
 * 🏥 API Endpoint: Obtener/Actualizar Anamnesis
 * CRUD operations para anamnesis individuales
 */

import { NextRequest, NextResponse } from 'next/server';
import { UnifiedAuth } from '@/auth/UnifiedAuthSystem';
import { db } from '@/lib/database-compat';
import { auditService } from '@/services/audit.service';

import { logger } from '@altamedica/shared/services/logger.service';
interface Params {
  params: {
    id: string;
  };
}

// GET: Obtener anamnesis por ID
export async function GET(request: NextRequest, { params }: Params) {
  try {
    // Autenticación
    const authResult = await UnifiedAuth(request, ['patient', 'doctor', 'admin']);
    if (!authResult.success) {
      return authResult.response;
    }

    const anamnesisId = params.id;
    
    // Obtener anamnesis
    const anamnesisDoc = await db.collection('anamnesis').doc(anamnesisId).get();
    
    if (!anamnesisDoc.exists) {
      return NextResponse.json(
        { error: 'Anamnesis no encontrada' },
        { status: 404 }
      );
    }

    const anamnesisData = anamnesisDoc.data();
    
    // Verificar permisos
    const canAccess = 
      authResult.user.role === 'admin' ||
      authResult.user.role === 'doctor' ||
      (authResult.user.role === 'patient' && anamnesisData.patientId === authResult.user.id);
    
    if (!canAccess) {
      return NextResponse.json(
        { error: 'No autorizado para ver esta anamnesis' },
        { status: 403 }
      );
    }

    // Desencriptar datos sensibles
    if (anamnesisData.encryptedSummary) {
      anamnesisData.summary = JSON.parse(
        Buffer.from(anamnesisData.encryptedSummary, 'base64').toString('utf-8')
      );
      delete anamnesisData.encryptedSummary;
    }

    // Registrar acceso (HIPAA)
    await auditService.logAccess({
      userId: authResult.user.id,
      action: 'VIEW_ANAMNESIS',
      resource: `anamnesis/${anamnesisId}`,
      patientId: anamnesisData.patientId,
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json({
      success: true,
      anamnesis: anamnesisData
    });

  } catch (error) {
    logger.error('Error obteniendo anamnesis:', undefined, error);
    return NextResponse.json(
      { error: 'Error interno obteniendo anamnesis' },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar anamnesis (solo admin)
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    // Solo administradores pueden eliminar
    const authResult = await UnifiedAuth(request, ['admin']);
    if (!authResult.success) {
      return authResult.response;
    }

    const anamnesisId = params.id;
    
    // Soft delete (marcar como eliminado)
    await db.collection('anamnesis').doc(anamnesisId).update({
      deletedAt: new Date().toISOString(),
      deletedBy: authResult.user.id,
      status: 'deleted'
    });

    // Registrar acción
    await auditService.logAccess({
      userId: authResult.user.id,
      action: 'DELETE_ANAMNESIS',
      resource: `anamnesis/${anamnesisId}`,
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json({
      success: true,
      message: 'Anamnesis eliminada exitosamente'
    });

  } catch (error) {
    logger.error('Error eliminando anamnesis:', undefined, error);
    return NextResponse.json(
      { error: 'Error interno eliminando anamnesis' },
      { status: 500 }
    );
  }
}