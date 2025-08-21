import { NextRequest, NextResponse } from 'next/server';
import { UnifiedAuth } from '@/auth/UnifiedAuthSystem';
import { baaService } from '@altamedica/shared/services/baa.service';
import { auditService } from '@/services/audit.service';
import { UpdateBAASchema, SignBAASchema } from '@altamedica/types';

import { logger } from '@altamedica/shared/services/logger.service';
/**
 * API de gestión individual de BAA
 * GET /api/v1/baa/[baaId] - Obtener BAA por ID
 * PUT /api/v1/baa/[baaId] - Actualizar BAA
 * POST /api/v1/baa/[baaId]/sign - Firmar BAA
 */

interface RouteParams {
  params: {
    baaId: string;
  };
}

/**
 * GET /api/v1/baa/[baaId]
 * Obtiene un BAA específico por ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Autenticación
    const authResult = await UnifiedAuth(request, ['company', 'admin', 'doctor']);
    if (!authResult.success) {
      return authResult.response;
    }

    const { baaId } = params;

    // Obtener BAA
    const baa = await baaService.getBAAById(baaId);

    if (!baa) {
      return NextResponse.json(
        { success: false, error: 'BAA no encontrado' },
        { status: 404 }
      );
    }

    // Verificar permisos
    if (authResult.user.role === 'company') {
      if (baa.businessAssociateId !== authResult.user.companyId) {
        return NextResponse.json(
          { success: false, error: 'No tiene permisos para ver este BAA' },
          { status: 403 }
        );
      }
    }

    // Obtener estado de compliance
    const compliance = await baaService.verifyBAACompliance(baaId);

    // Auditar acceso
    await auditService.logAction({
      action: 'baa_viewed',
      userId: authResult.user.uid,
      resource: `baa/${baaId}`,
      metadata: {
        companyId: baa.businessAssociateId,
        status: baa.status
      },
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    });

    return NextResponse.json({
      success: true,
      data: {
        baa,
        compliance
      }
    });

  } catch (error) {
    logger.error('[BAA Get] Error:', undefined, error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener BAA' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/baa/[baaId]
 * Actualiza un BAA (solo admins o durante onboarding)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Solo admins pueden actualizar BAAs
    const authResult = await UnifiedAuth(request, ['admin']);
    if (!authResult.success) {
      return authResult.response;
    }

    const { baaId } = params;
    const body = await request.json();
    
    // Validar datos
    const validatedData = UpdateBAASchema.parse(body);

    // Verificar que el BAA existe
    const existingBAA = await baaService.getBAAById(baaId);
    if (!existingBAA) {
      return NextResponse.json(
        { success: false, error: 'BAA no encontrado' },
        { status: 404 }
      );
    }

    // No permitir actualizar BAAs activos sin proceso especial
    if (existingBAA.status === 'active' && !body.forceUpdate) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No se puede modificar un BAA activo. Use el proceso de revisión.' 
        },
        { status: 400 }
      );
    }

    // Actualizar BAA
    const updatedBAA = await baaService.updateBAA(
      baaId,
      validatedData,
      authResult.user.uid
    );

    // Auditar actualización
    await auditService.logAction({
      action: 'baa_updated',
      userId: authResult.user.uid,
      resource: `baa/${baaId}`,
      metadata: {
        changes: Object.keys(validatedData),
        previousStatus: existingBAA.status,
        newStatus: updatedBAA.status
      },
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    });

    return NextResponse.json({
      success: true,
      data: updatedBAA,
      message: 'BAA actualizado exitosamente'
    });

  } catch (error: any) {
    logger.error('[BAA Update] Error:', undefined, error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error al actualizar BAA' },
      { status: 500 }
    );
  }
}