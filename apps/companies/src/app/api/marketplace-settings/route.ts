import { NextRequest, NextResponse } from "next/server";
import { UnifiedAuth } from '../../../../../api-server/src/auth/UnifiedAuthSystem';
import { UserRole } from "@altamedica/types";
import { auditLog, logger } from '../../../lib/medical-mocks';

// Configuración de marketplace de empleo médico para empresas
interface MarketplaceSettings {
  id: string;
  companyId: string;
  isVisible: boolean;
  priority: 'low' | 'medium' | 'high';
  featuredUntil?: Date;
  // Configuración específica para marketplace de empleo
  hiringStatus: 'active' | 'paused' | 'inactive';
  specialtiesNeeded: string[];
  workArrangements: string[];
  companyInfo: {
    name: string;
    type: 'hospital' | 'clinic' | 'pharmacy' | 'insurance' | 'startup';
    size: string;
    location: {
      city: string;
      country: string;
      allowRemote: boolean;
    };
  };
  hiringPreferences: {
    minExperience: number;
    maxExperience: number;
    languagesRequired: string[];
    certificationsRequired: string[];
    urgentPositions: boolean;
    salaryRange: {
      min: number;
      max: number;
      currency: string;
    };
  };
  interviewProcess: {
    stages: string[];
    averageDuration: number; // en días
    remoteInterviews: boolean;
  };
  benefits: string[];
  notifications: {
    newApplications: boolean;
    profileViews: boolean;
    messageAlerts: boolean;
    interviewReminders: boolean;
  };
  branding: {
    primaryColor?: string;
    logo?: string;
    description?: string;
    bannerImage?: string;
  };
  updatedAt: Date;
  updatedBy: string;
}

export async function GET(request: NextRequest) {
  // Autenticación y autorización usando UnifiedAuth
  const authResult = await UnifiedAuth(request, [UserRole.COMPANY]);
  
  if (!authResult.success) {
    return authResult.response;
  }
  
  const user = authResult.user!;
  try {
    const companyId = user.companyId;
    
    if (!companyId) {
      return NextResponse.json(
        { error: "ID de empresa no encontrado" },
        { status: 400 }
      );
    }

    // Obtener configuración actual del marketplace de empleo
    const settings: MarketplaceSettings = {
      id: `settings_${companyId}`,
      companyId,
      isVisible: true,
      priority: 'medium',
      hiringStatus: 'active',
      specialtiesNeeded: ['Cardiología', 'Pediatría', 'Medicina General', 'Enfermería'],
      workArrangements: ['on-site', 'hybrid', 'remote'],
      companyInfo: {
        name: 'Hospital Central',
        type: 'hospital',
        size: '500-1000 empleados',
        location: {
          city: 'Buenos Aires',
          country: 'Argentina',
          allowRemote: true
        }
      },
      hiringPreferences: {
        minExperience: 2,
        maxExperience: 20,
        languagesRequired: ['Español', 'Inglés'],
        certificationsRequired: ['Licencia Médica', 'BLS'],
        urgentPositions: true,
        salaryRange: {
          min: 3000,
          max: 15000,
          currency: 'USD'
        }
      },
      interviewProcess: {
        stages: ['Screening telefónico', 'Entrevista técnica', 'Entrevista cultural', 'Oferta'],
        averageDuration: 14,
        remoteInterviews: true
      },
      benefits: [
        'Seguro médico completo',
        'Capacitación continua',
        'Horario flexible',
        'Bonos por desempeño',
        'Guardería en el lugar'
      ],
      notifications: {
        newApplications: true,
        profileViews: true,
        messageAlerts: true,
        interviewReminders: true
      },
      branding: {
        primaryColor: '#0066cc',
        description: 'Centro médico líder buscando profesionales comprometidos con la excelencia'
      },
      updatedAt: new Date(),
      updatedBy: user.userId
    };

    // Log de auditoría
    await auditLog({
      action: 'marketplace_employment_settings_viewed',
      userId: user.userId,
      companyId,
      metadata: { endpoint: '/api/marketplace-settings' }
    });

    return NextResponse.json({
      success: true,
      data: settings
    }, {
      headers: {
        "Cache-Control": "private, s-maxage=300",
        "X-Data-Source": "database"
      }
    });

  } catch (error) {
    logger.error('Error getting marketplace settings:', {
      error: error instanceof Error ? error.message : String(error),
      userId: user?.userId,
      companyId: user?.companyId
    });

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  // Autenticación y autorización usando UnifiedAuth
  const authResult = await UnifiedAuth(request, [UserRole.COMPANY]);
  
  if (!authResult.success) {
    return authResult.response;
  }
  
  const user = authResult.user!;
  try {
    const companyId = user.companyId;
    
    if (!companyId) {
      return NextResponse.json(
        { error: "ID de empresa no encontrado" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updatedSettings: Partial<MarketplaceSettings> = {
      ...body,
      companyId,
      updatedAt: new Date(),
      updatedBy: user.userId
    };

    // Validaciones de negocio para marketplace de empleo
    if (updatedSettings.hiringPreferences?.minExperience && updatedSettings.hiringPreferences.minExperience < 0) {
      return NextResponse.json(
        { error: "La experiencia mínima debe ser mayor a 0" },
        { status: 400 }
      );
    }

    if (updatedSettings.hiringPreferences?.maxExperience && 
        updatedSettings.hiringPreferences.minExperience && 
        updatedSettings.hiringPreferences.maxExperience < updatedSettings.hiringPreferences.minExperience) {
      return NextResponse.json(
        { error: "La experiencia máxima debe ser mayor a la mínima" },
        { status: 400 }
      );
    }

    if (updatedSettings.hiringPreferences?.salaryRange?.min && updatedSettings.hiringPreferences.salaryRange.min < 0) {
      return NextResponse.json(
        { error: "El salario mínimo debe ser mayor a 0" },
        { status: 400 }
      );
    }

    // Log de auditoría para cambios
    await auditLog({
      action: 'marketplace_employment_settings_updated',
      userId: user.userId,
      companyId,
      metadata: { 
        changes: body,
        endpoint: '/api/marketplace-settings'
      }
    });

    // Simular guardado en base de datos
    logger.info('Marketplace employment settings updated:', {
      companyId,
      userId: user.userId,
      changes: Object.keys(body)
    });

    return NextResponse.json({
      success: true,
      data: updatedSettings,
      message: "Configuración del marketplace actualizada exitosamente"
    });

  } catch (error) {
    logger.error('Error updating marketplace settings:', {
      error: error instanceof Error ? error.message : String(error),
      userId: user?.userId,
      companyId: user?.companyId
    });

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}