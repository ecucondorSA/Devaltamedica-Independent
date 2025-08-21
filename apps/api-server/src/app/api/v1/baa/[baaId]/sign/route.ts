import { NextRequest, NextResponse } from 'next/server';
import { UnifiedAuth } from '@/auth/UnifiedAuthSystem';
import { baaService } from '@altamedica/shared/services/baa.service';
import { auditService } from '@/services/audit.service';
import { SignBAASchema } from '@altamedica/types';
import { enforceMFA } from '@/middleware/mfa-enforcement.middleware';

import { logger } from '@altamedica/shared/services/logger.service';
/**
 * API de firma digital de BAA
 * POST /api/v1/baa/[baaId]/sign - Firma digital del BAA
 * Requiere MFA para operación crítica
 */

interface RouteParams {
  params: {
    baaId: string;
  };
}

/**
 * POST /api/v1/baa/[baaId]/sign
 * Firma digitalmente un BAA
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Autenticación con roles específicos
    const authResult = await UnifiedAuth(request, ['company', 'admin']);
    if (!authResult.success) {
      return authResult.response;
    }

    // Enforcement de MFA para operación crítica
    const mfaResult = await enforceMFA(
      request,
      authResult.user.uid,
      authResult.user.role
    );

    if (!mfaResult.success) {
      return mfaResult.response || NextResponse.json(
        { success: false, error: 'MFA requerido para firmar BAA' },
        { status: 403 }
      );
    }

    const { baaId } = params;
    const body = await request.json();

    // Validar datos de firma
    const validatedData = SignBAASchema.parse({
      baaId,
      ...body
    });

    // Obtener BAA
    const baa = await baaService.getBAAById(baaId);
    if (!baa) {
      return NextResponse.json(
        { success: false, error: 'BAA no encontrado' },
        { status: 404 }
      );
    }

    // Verificar permisos
    let userType: 'covered_entity' | 'business_associate';
    
    if (authResult.user.role === 'admin') {
      // Admin firma como entidad cubierta
      userType = 'covered_entity';
      
      // Verificar que no esté ya firmado por la entidad cubierta
      if (baa.coveredEntitySignature) {
        return NextResponse.json(
          { success: false, error: 'BAA ya firmado por la entidad cubierta' },
          { status: 400 }
        );
      }
    } else if (authResult.user.role === 'company') {
      // Empresa firma como asociado de negocio
      userType = 'business_associate';
      
      // Verificar que sea la empresa correcta
      if (baa.businessAssociateId !== authResult.user.companyId) {
        return NextResponse.json(
          { success: false, error: 'No tiene permisos para firmar este BAA' },
          { status: 403 }
        );
      }
      
      // Verificar que no esté ya firmado por el asociado
      if (baa.businessAssociateSignature) {
        return NextResponse.json(
          { success: false, error: 'BAA ya firmado por el asociado de negocio' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Rol no autorizado para firmar BAA' },
        { status: 403 }
      );
    }

    // Verificar estado del BAA
    if (baa.status !== 'pending_signature') {
      return NextResponse.json(
        { 
          success: false, 
          error: `BAA en estado ${baa.status} no puede ser firmado` 
        },
        { status: 400 }
      );
    }

    // Firmar BAA
    const signedBAA = await baaService.signBAA(
      validatedData,
      {
        userId: authResult.user.uid,
        userType,
        ipAddress: request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  'unknown',
        userAgent: request.headers.get('user-agent')
      }
    );

    // Auditar firma con detalles HIPAA
    await auditService.logAction({
      action: 'baa_signed',
      userId: authResult.user.uid,
      resource: `baa/${baaId}`,
      metadata: {
        signatureType: userType,
        signatureMethod: validatedData.signatureMethod || 'electronic',
        baaStatus: signedBAA.status,
        companyId: baa.businessAssociateId,
        mfaVerified: true,
        bothPartiesSigned: signedBAA.status === 'active'
      },
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      severity: 'high',
      compliance: {
        hipaa: true,
        requirement: 'Business Associate Agreement Execution'
      }
    });

    // Si ambas partes firmaron, auditar activación
    if (signedBAA.status === 'active') {
      await auditService.logAction({
        action: 'baa_activated',
        userId: 'system',
        resource: `baa/${baaId}`,
        metadata: {
          companyId: baa.businessAssociateId,
          effectiveDate: signedBAA.version.effectiveDate,
          expirationDate: signedBAA.version.expirationDate
        },
        severity: 'high',
        compliance: {
          hipaa: true,
          requirement: 'BAA Activation'
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        baa: signedBAA,
        message: signedBAA.status === 'active' 
          ? 'BAA firmado y activado exitosamente' 
          : 'BAA firmado exitosamente. Esperando firma de la otra parte.',
        isFullySigned: signedBAA.status === 'active',
        nextSteps: signedBAA.status === 'active'
          ? null
          : userType === 'covered_entity'
            ? 'El asociado de negocio debe firmar el acuerdo'
            : 'La entidad cubierta debe firmar el acuerdo'
      }
    });

  } catch (error: any) {
    logger.error('[BAA Sign] Error:', undefined, error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Datos de firma inválidos', details: error.errors },
        { status: 400 }
      );
    }

    // Auditar intento fallido de firma
    await auditService.logAction({
      action: 'baa_sign_failed',
      userId: request.headers.get('x-user-id') || 'unknown',
      resource: `baa/${params.baaId}`,
      metadata: {
        error: error.message
      },
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      severity: 'medium'
    });

    return NextResponse.json(
      { success: false, error: 'Error al firmar BAA' },
      { status: 500 }
    );
  }
}