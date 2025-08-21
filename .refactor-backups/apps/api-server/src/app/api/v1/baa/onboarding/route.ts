import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { UnifiedAuth } from '@/auth/UnifiedAuthSystem';
import { baaService } from '@altamedica/shared/services/baa.service';
import { CompanyInfoSchema } from '@altamedica/types';
import { auditService } from '@/services/audit.service';

import { logger } from '@altamedica/shared/services/logger.service';
/**
 * API de Onboarding de Business Associate Agreement
 * Gestiona el proceso de incorporación de empresas al cumplimiento HIPAA
 */

// Schema para iniciar onboarding
const StartOnboardingSchema = z.object({
  companyId: z.string().min(1),
  companyInfo: CompanyInfoSchema
});

// Schema para progreso de onboarding
const ProgressOnboardingSchema = z.object({
  onboardingId: z.string().min(1),
  currentStep: z.string(),
  stepData: z.record(z.any()),
  signature: z.string().optional()
});

/**
 * POST /api/v1/baa/onboarding
 * Inicia el proceso de onboarding de BAA para una empresa
 */
export async function POST(request: NextRequest) {
  try {
    // Autenticación y autorización
    const authResult = await UnifiedAuth(request, ['company', 'admin']);
    if (!authResult.success) {
      return authResult.response;
    }

    const body = await request.json();
    const validatedData = StartOnboardingSchema.parse(body);

    // Verificar que el usuario tenga permisos sobre la empresa
    if (authResult.user.role === 'company' && authResult.user.companyId !== validatedData.companyId) {
      return NextResponse.json(
        { success: false, error: 'No tiene permisos para esta empresa' },
        { status: 403 }
      );
    }

    // Iniciar proceso de onboarding
    const result = await baaService.startBAAOnboarding(
      validatedData.companyId,
      validatedData.companyInfo
    );

    // Auditar acción
    await auditService.logAction({
      action: 'baa_onboarding_started',
      userId: authResult.user.uid,
      resource: 'baa/onboarding',
      metadata: {
        companyId: validatedData.companyId,
        onboardingId: result.onboardingId,
        baaId: result.baaId
      },
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    });

    return NextResponse.json({
      success: true,
      data: {
        onboardingId: result.onboardingId,
        baaId: result.baaId,
        nextStep: result.nextStep,
        message: 'Proceso de onboarding iniciado exitosamente'
      }
    });

  } catch (error: any) {
    logger.error('[BAA Onboarding] Error:', undefined, error);

    if (error.message === 'La empresa ya tiene un BAA activo') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 409 }
      );
    }

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error al iniciar onboarding' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/baa/onboarding
 * Avanza al siguiente paso del onboarding
 */
export async function PUT(request: NextRequest) {
  try {
    // Autenticación y autorización
    const authResult = await UnifiedAuth(request, ['company', 'admin']);
    if (!authResult.success) {
      return authResult.response;
    }

    const body = await request.json();
    const validatedData = ProgressOnboardingSchema.parse(body);

    // Obtener información adicional para la firma
    const stepData = {
      ...validatedData.stepData,
      ipAddress: request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    };

    // Avanzar en el proceso
    const result = await baaService.progressOnboarding(
      validatedData.onboardingId,
      validatedData.currentStep,
      stepData,
      authResult.user.uid
    );

    // Auditar progreso
    await auditService.logAction({
      action: 'baa_onboarding_progress',
      userId: authResult.user.uid,
      resource: 'baa/onboarding',
      metadata: {
        onboardingId: validatedData.onboardingId,
        step: validatedData.currentStep,
        completed: result.completed
      },
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    });

    // Si se completó el onboarding
    if (result.completed) {
      await auditService.logAction({
        action: 'baa_onboarding_completed',
        userId: authResult.user.uid,
        resource: 'baa/onboarding',
        metadata: {
          onboardingId: validatedData.onboardingId,
          baaId: result.baaId
        },
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        nextStep: result.nextStep,
        completed: result.completed,
        baaId: result.baaId,
        message: result.completed 
          ? 'Onboarding completado exitosamente' 
          : `Paso ${validatedData.currentStep} completado`
      }
    });

  } catch (error: any) {
    logger.error('[BAA Onboarding Progress] Error:', undefined, error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error al procesar onboarding' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/baa/onboarding?companyId=xxx
 * Obtiene el estado actual del onboarding de una empresa
 */
export async function GET(request: NextRequest) {
  try {
    // Autenticación
    const authResult = await UnifiedAuth(request, ['company', 'admin']);
    if (!authResult.success) {
      return authResult.response;
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Se requiere companyId' },
        { status: 400 }
      );
    }

    // Verificar permisos
    if (authResult.user.role === 'company' && authResult.user.companyId !== companyId) {
      return NextResponse.json(
        { success: false, error: 'No tiene permisos para esta empresa' },
        { status: 403 }
      );
    }

    // Obtener BAAs de la empresa
    const baas = await baaService.getCompanyBAAs(companyId);
    
    // Buscar BAA activo
    const activeBAA = await baaService.getActiveCompanyBAA(companyId);

    // Determinar estado de onboarding
    let onboardingStatus = 'not_started';
    let currentBAA = null;

    if (activeBAA) {
      onboardingStatus = 'completed';
      currentBAA = activeBAA;
    } else if (baas.length > 0) {
      // Buscar BAA en proceso
      const pendingBAA = baas.find(baa => 
        ['draft', 'pending_review', 'pending_signature'].includes(baa.status)
      );
      
      if (pendingBAA) {
        onboardingStatus = 'in_progress';
        currentBAA = pendingBAA;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        companyId,
        onboardingStatus,
        currentBAA,
        allBAAs: baas,
        requiresOnboarding: onboardingStatus === 'not_started',
        canOperate: onboardingStatus === 'completed'
      }
    });

  } catch (error) {
    logger.error('[BAA Onboarding Status] Error:', undefined, error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener estado de onboarding' },
      { status: 500 }
    );
  }
}