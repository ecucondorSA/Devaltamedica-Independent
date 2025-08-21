import { NextRequest, NextResponse } from 'next/server';
import { UnifiedAuth } from '@/auth/UnifiedAuthSystem';
import { baaService } from '@altamedica/shared/services/baa.service';
import { auditService } from '@/services/audit.service';

import { logger } from '@altamedica/shared/services/logger.service';
/**
 * API de verificación de compliance de BAA
 * GET /api/v1/baa/[baaId]/compliance - Verifica el cumplimiento del BAA
 * POST /api/v1/baa/[baaId]/compliance/review - Solicita revisión de compliance
 */

interface RouteParams {
  params: {
    baaId: string;
  };
}

/**
 * GET /api/v1/baa/[baaId]/compliance
 * Verifica el estado de compliance de un BAA
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
          { success: false, error: 'No tiene permisos para este BAA' },
          { status: 403 }
        );
      }
    }

    // Verificar compliance
    const compliance = await baaService.verifyBAACompliance(baaId);

    // Calcular métricas adicionales
    const metrics = {
      daysUntilExpiration: baa.version.expirationDate ? 
        Math.floor((new Date(baa.version.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 
        null,
      daysSinceLastReview: baa.lastReviewDate ?
        Math.floor((Date.now() - new Date(baa.lastReviewDate).getTime()) / (1000 * 60 * 60 * 24)) :
        null,
      requiresUrgentAction: compliance.score < 70 || 
        (baa.version.expirationDate && 
         new Date(baa.version.expirationDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
    };

    // Auditar verificación de compliance
    await auditService.logAction({
      action: 'baa_compliance_checked',
      userId: authResult.user.uid,
      resource: `baa/${baaId}/compliance`,
      metadata: {
        complianceScore: compliance.score,
        isCompliant: compliance.isCompliant,
        issuesCount: compliance.issues.length
      },
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    });

    return NextResponse.json({
      success: true,
      data: {
        baaId,
        status: baa.status,
        compliance: {
          ...compliance,
          lastChecked: new Date().toISOString()
        },
        metrics,
        obligations: baa.obligations,
        signatures: {
          coveredEntity: !!baa.coveredEntitySignature,
          businessAssociate: !!baa.businessAssociateSignature,
          bothSigned: !!baa.coveredEntitySignature && !!baa.businessAssociateSignature
        }
      }
    });

  } catch (error) {
    logger.error('[BAA Compliance Check] Error:', undefined, error);
    return NextResponse.json(
      { success: false, error: 'Error al verificar compliance' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/baa/[baaId]/compliance/review
 * Solicita una revisión de compliance del BAA
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Solo admins pueden solicitar revisiones
    const authResult = await UnifiedAuth(request, ['admin']);
    if (!authResult.success) {
      return authResult.response;
    }

    const { baaId } = params;
    const body = await request.json();

    // Obtener BAA
    const baa = await baaService.getBAAById(baaId);
    if (!baa) {
      return NextResponse.json(
        { success: false, error: 'BAA no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el BAA esté activo
    if (baa.status !== 'active') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Solo se pueden revisar BAAs activos' 
        },
        { status: 400 }
      );
    }

    // Realizar verificación completa de compliance
    const compliance = await baaService.verifyBAACompliance(baaId);

    // Actualizar fecha de revisión
    const nextReviewDate = new Date();
    nextReviewDate.setMonths(nextReviewDate.getMonth() + 12); // Próxima revisión en 1 año

    await baaService.updateBAA(
      baaId,
      {
        lastReviewDate: new Date(),
        nextReviewDate,
        complianceScore: compliance.score,
        complianceIssues: compliance.issues,
        notes: body.notes
      },
      authResult.user.uid
    );

    // Auditar revisión con detalles completos
    await auditService.logAction({
      action: 'baa_compliance_reviewed',
      userId: authResult.user.uid,
      resource: `baa/${baaId}/compliance`,
      metadata: {
        complianceScore: compliance.score,
        previousScore: baa.complianceScore,
        isCompliant: compliance.isCompliant,
        issues: compliance.issues,
        recommendations: compliance.recommendations,
        reviewNotes: body.notes,
        nextReviewDate: nextReviewDate.toISOString()
      },
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      severity: 'high',
      compliance: {
        hipaa: true,
        requirement: 'Annual BAA Review'
      }
    });

    // Si hay problemas críticos, crear alerta
    if (compliance.score < 70 || !compliance.isCompliant) {
      await auditService.logAction({
        action: 'baa_compliance_alert',
        userId: 'system',
        resource: `baa/${baaId}`,
        metadata: {
          alertType: 'critical_compliance_issues',
          score: compliance.score,
          issues: compliance.issues,
          companyId: baa.businessAssociateId
        },
        severity: 'critical',
        compliance: {
          hipaa: true,
          requirement: 'Compliance Alert'
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        reviewId: `review_${Date.now()}`,
        baaId,
        compliance,
        lastReviewDate: new Date().toISOString(),
        nextReviewDate: nextReviewDate.toISOString(),
        reviewedBy: authResult.user.uid,
        message: compliance.isCompliant 
          ? 'Revisión completada. BAA cumple con los requisitos.'
          : 'Revisión completada. Se encontraron problemas de compliance.',
        requiresAction: !compliance.isCompliant || compliance.score < 80
      }
    });

  } catch (error: any) {
    logger.error('[BAA Compliance Review] Error:', undefined, error);

    return NextResponse.json(
      { success: false, error: 'Error al revisar compliance' },
      { status: 500 }
    );
  }
}