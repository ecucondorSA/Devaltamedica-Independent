import { NextRequest, NextResponse } from "next/server";
import { UnifiedAuth } from '../../../../../api-server/src/auth/UnifiedAuthSystem';
import { UserRole } from "@altamedica/types";
import { auditLog, logger } from '../../../lib/medical-mocks';

interface HiringMetrics {
  companyId: string;
  period: 'last_7_days' | 'last_30_days' | 'last_90_days' | 'last_year';
  
  // Métricas de ofertas
  activeJobOffers: number;
  totalJobOffers: number;
  jobOffersExpiringSoon: number;
  
  // Métricas de aplicaciones
  totalApplications: number;
  newApplications: number;
  applicationsInReview: number;
  applicationsInInterview: number;
  pendingOffers: number;
  
  // Métricas de contratación
  totalHires: number;
  averageTimeToHire: number; // días
  averageApplicationsPerJob: number;
  conversionRate: number; // aplicaciones -> contrataciones
  
  // Métricas de calidad
  averageApplicantRating: number;
  topSpecialties: Array<{
    specialty: string;
    applications: number;
    hires: number;
  }>;
  
  // Tendencias
  applicationsGrowth: number; // % cambio período anterior
  hiresGrowth: number;
  
  // Datos para gráficos
  applicationsTimeline: Array<{
    date: string;
    applications: number;
    hires: number;
  }>;
  
  specialtyDistribution: Array<{
    specialty: string;
    percentage: number;
    count: number;
  }>;
  
  generatedAt: Date;
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
    const url = new URL(request.url);
    const period = (url.searchParams.get('period') as HiringMetrics['period']) || 'last_30_days';
    
    if (!companyId) {
      return NextResponse.json(
        { error: "ID de empresa no encontrado" },
        { status: 400 }
      );
    }

    // Datos simulados para demo - en producción vendrían de la base de datos
    const mockMetrics: HiringMetrics = {
      companyId,
      period,
      
      // Ofertas
      activeJobOffers: 8,
      totalJobOffers: 15,
      jobOffersExpiringSoon: 2,
      
      // Aplicaciones
      totalApplications: 127,
      newApplications: 23,
      applicationsInReview: 45,
      applicationsInInterview: 12,
      pendingOffers: 5,
      
      // Contrataciones
      totalHires: 18,
      averageTimeToHire: 21, // días
      averageApplicationsPerJob: 8.5,
      conversionRate: 14.2, // %
      
      // Calidad
      averageApplicantRating: 4.3,
      topSpecialties: [
        { specialty: 'Cardiología', applications: 34, hires: 6 },
        { specialty: 'Neurología', applications: 28, hires: 4 },
        { specialty: 'Pediatría', applications: 22, hires: 3 },
        { specialty: 'Oncología', applications: 19, hires: 2 },
        { specialty: 'Psiquiatría', applications: 24, hires: 3 }
      ],
      
      // Tendencias
      applicationsGrowth: 15.8,
      hiresGrowth: 22.5,
      
      // Timeline últimos 30 días
      applicationsTimeline: [
        { date: '2025-01-01', applications: 5, hires: 1 },
        { date: '2025-01-02', applications: 3, hires: 0 },
        { date: '2025-01-03', applications: 7, hires: 2 },
        { date: '2025-01-04', applications: 4, hires: 1 },
        { date: '2025-01-05', applications: 6, hires: 0 },
        { date: '2025-01-06', applications: 2, hires: 1 },
        { date: '2025-01-07', applications: 8, hires: 2 }
      ],
      
      specialtyDistribution: [
        { specialty: 'Cardiología', percentage: 26.8, count: 34 },
        { specialty: 'Neurología', percentage: 22.0, count: 28 },
        { specialty: 'Psiquiatría', percentage: 18.9, count: 24 },
        { specialty: 'Pediatría', percentage: 17.3, count: 22 },
        { specialty: 'Oncología', percentage: 15.0, count: 19 }
      ],
      
      generatedAt: new Date()
    };

    // Log de auditoría
    await auditLog({
      action: 'hiring_dashboard_viewed',
      userId: user.userId,
      companyId,
      metadata: { 
        period,
        endpoint: '/api/hiring-dashboard'
      }
    });

    return NextResponse.json({
      success: true,
      data: mockMetrics
    }, {
      headers: {
        "Cache-Control": "private, s-maxage=300", // 5 minutos de cache
        "X-Data-Source": "analytics_engine"
      }
    });

  } catch (error) {
    logger.error('Error getting hiring dashboard:', {
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

// Endpoint para exportar métricas
export async function POST(request: NextRequest) {
  // Autenticación y autorización usando UnifiedAuth
  const authResult = await UnifiedAuth(request, [UserRole.COMPANY]);
  
  if (!authResult.success) {
    return authResult.response;
  }
  
  const user = authResult.user!;
  try {
    const companyId = user.companyId;
    const body = await request.json();
    const { format = 'pdf', period = 'last_30_days' } = body;
    
    if (!companyId) {
      return NextResponse.json(
        { error: "ID de empresa no encontrado" },
        { status: 400 }
      );
    }

    // Log de auditoría para export
    await auditLog({
      action: 'hiring_report_exported',
      userId: user.userId,
      companyId,
      metadata: { 
        format,
        period,
        endpoint: '/api/hiring-dashboard'
      }
    });

    // Simular generación de reporte
    const reportId = `report_${companyId}_${Date.now()}`;
    const downloadUrl = `/api/reports/download/${reportId}`;

    logger.info('Hiring report generated:', {
      reportId,
      companyId,
      userId: user.userId,
      format,
      period
    });

    return NextResponse.json({
      success: true,
      data: {
        reportId,
        downloadUrl,
        format,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
        estimatedSize: '2.5 MB'
      },
      message: "Reporte generado exitosamente"
    });

  } catch (error) {
    logger.error('Error generating hiring report:', {
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