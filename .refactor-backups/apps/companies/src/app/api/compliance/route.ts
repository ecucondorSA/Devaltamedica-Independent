import { NextRequest, NextResponse } from "next/server";
import { UnifiedAuth } from '../../../../../api-server/src/auth/UnifiedAuthSystem';
import { UserRole } from "@altamedica/types";
import { auditLog, encryptData, validateCompliance, logger } from '../../../lib/medical-mocks';

interface ComplianceStatus {
  companyId: string;
  hipaaCompliant: boolean;
  lastAuditDate: Date;
  nextAuditDate: Date;
  complianceScore: number; // 0-100
  
  // Áreas de compliance
  areas: {
    dataEncryption: {
      status: 'compliant' | 'partial' | 'non_compliant';
      score: number;
      issues: string[];
      lastChecked: Date;
    };
    accessControls: {
      status: 'compliant' | 'partial' | 'non_compliant';
      score: number;
      issues: string[];
      lastChecked: Date;
    };
    auditLogging: {
      status: 'compliant' | 'partial' | 'non_compliant';
      score: number;
      issues: string[];
      lastChecked: Date;
    };
    dataBackup: {
      status: 'compliant' | 'partial' | 'non_compliant';
      score: number;
      issues: string[];
      lastChecked: Date;
    };
    userTraining: {
      status: 'compliant' | 'partial' | 'non_compliant';
      score: number;
      issues: string[];
      lastChecked: Date;
    };
    incidentResponse: {
      status: 'compliant' | 'partial' | 'non_compliant';
      score: number;
      issues: string[];
      lastChecked: Date;
    };
  };
  
  // Acciones requeridas
  requiredActions: Array<{
    id: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    dueDate: Date;
    assignedTo?: string;
    status: 'pending' | 'in_progress' | 'completed';
  }>;
  
  // Histórico de auditorías
  auditHistory: Array<{
    date: Date;
    auditorId: string;
    auditorName: string;
    score: number;
    findings: string[];
    recommendations: string[];
  }>;
}

export async function GET(request: NextRequest) {
  // Autenticación y autorización usando UnifiedAuth
  const authResult = await UnifiedAuth(request, [UserRole.COMPANY, UserRole.ADMIN]);
  
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

    // Ejecutar validación de compliance en tiempo real
    const complianceValidation = await validateCompliance(companyId);
    
    // Datos simulados para demo - en producción vendrían de la base de datos
    const complianceStatus: ComplianceStatus = {
      companyId,
      hipaaCompliant: complianceValidation.isCompliant,
      lastAuditDate: new Date('2025-01-15'),
      nextAuditDate: new Date('2025-04-15'),
      complianceScore: 87,
      
      areas: {
        dataEncryption: {
          status: 'compliant',
          score: 95,
          issues: [],
          lastChecked: new Date()
        },
        accessControls: {
          status: 'partial',
          score: 78,
          issues: [
            'Algunos usuarios no han actualizado contraseñas en 90 días',
            'Falta configurar 2FA para 3 usuarios administrativos'
          ],
          lastChecked: new Date()
        },
        auditLogging: {
          status: 'compliant',
          score: 92,
          issues: [],
          lastChecked: new Date()
        },
        dataBackup: {
          status: 'compliant',
          score: 88,
          issues: [
            'Último backup hace 25 horas (debe ser < 24h)'
          ],
          lastChecked: new Date()
        },
        userTraining: {
          status: 'partial',
          score: 75,
          issues: [
            '12 empleados pendientes de completar training HIPAA 2025',
            'Training de manejo de PHI vence en 15 días'
          ],
          lastChecked: new Date()
        },
        incidentResponse: {
          status: 'compliant',
          score: 90,
          issues: [],
          lastChecked: new Date()
        }
      },
      
      requiredActions: [
        {
          id: 'action_001',
          title: 'Actualizar contraseñas vencidas',
          description: 'Requerir actualización de contraseñas para usuarios con credenciales > 90 días',
          priority: 'high',
          dueDate: new Date('2025-02-01'),
          assignedTo: 'security_admin',
          status: 'pending'
        },
        {
          id: 'action_002',
          title: 'Configurar 2FA para administradores',
          description: 'Habilitar autenticación de dos factores para 3 usuarios administrativos',
          priority: 'high',
          dueDate: new Date('2025-01-30'),
          assignedTo: 'it_admin',
          status: 'in_progress'
        },
        {
          id: 'action_003',
          title: 'Completar training HIPAA',
          description: 'Programar y completar training HIPAA para 12 empleados pendientes',
          priority: 'medium',
          dueDate: new Date('2025-02-15'),
          assignedTo: 'hr_manager',
          status: 'pending'
        }
      ],
      
      auditHistory: [
        {
          date: new Date('2025-01-15'),
          auditorId: 'auditor_001',
          auditorName: 'María Rodríguez - HIPAA Certified',
          score: 87,
          findings: [
            'Controles de acceso necesitan fortalecimiento',
            'Training de usuarios debe actualizarse'
          ],
          recommendations: [
            'Implementar revisión trimestral de permisos',
            'Actualizar material de training con casos 2025'
          ]
        },
        {
          date: new Date('2024-10-15'),
          auditorId: 'auditor_002',
          auditorName: 'Carlos López - Security Specialist',
          score: 82,
          findings: [
            'Algunas vulnerabilidades menores en logs',
            'Proceso de backup podría optimizarse'
          ],
          recommendations: [
            'Aumentar frecuencia de logs críticos',
            'Automatizar validación de backups'
          ]
        }
      ]
    };

    // Log de auditoría para acceso a compliance
    await auditLog({
      action: 'compliance_status_viewed',
      userId: user.userId,
      companyId,
      metadata: { 
        complianceScore: complianceStatus.complianceScore,
        hipaaCompliant: complianceStatus.hipaaCompliant,
        endpoint: '/api/compliance'
      }
    });

    return NextResponse.json({
      success: true,
      data: complianceStatus
    }, {
      headers: {
        "Cache-Control": "private, s-maxage=300", // 5 minutos de cache
        "X-Data-Source": "compliance_engine"
      }
    });

  } catch (error) {
    logger.error('Error getting compliance status:', {
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

// Endpoint para generar reporte de compliance
export async function POST(request: NextRequest) {
  // Autenticación y autorización usando UnifiedAuth
  const authResult = await UnifiedAuth(request, [UserRole.COMPANY, UserRole.ADMIN]);
  
  if (!authResult.success) {
    return authResult.response;
  }
  
  const user = authResult.user!;
  try {
    const companyId = user.companyId;
    const body = await request.json();
    const { 
      reportType = 'full', 
      format = 'pdf',
      includeRecommendations = true,
      includeHistory = true 
    } = body;
    
    if (!companyId) {
      return NextResponse.json(
        { error: "ID de empresa no encontrado" },
        { status: 400 }
      );
    }

    // Log de auditoría crítico para generación de reportes
    await auditLog({
      action: 'compliance_report_generated',
      userId: user.userId,
      companyId,
      metadata: { 
        reportType,
        format,
        includeRecommendations,
        includeHistory,
        endpoint: '/api/compliance'
      }
    });

    // Simular generación de reporte
    const reportId = `compliance_report_${companyId}_${Date.now()}`;
    const downloadUrl = `/api/reports/compliance/${reportId}`;

    // Datos encriptados para el reporte (simulado)
    const encryptedReportData = await encryptData({
      companyId,
      reportType,
      generatedAt: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
    });

    logger.info('Compliance report generated:', {
      reportId,
      companyId,
      userId: user.userId,
      reportType,
      format
    });

    return NextResponse.json({
      success: true,
      data: {
        reportId,
        downloadUrl,
        format,
        reportType,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
        estimatedSize: '3.2 MB',
        encryptedData: encryptedReportData.hash // Solo el hash, no los datos
      },
      message: "Reporte de compliance generado exitosamente"
    });

  } catch (error) {
    logger.error('Error generating compliance report:', {
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

// Endpoint para actualizar estado de acciones correctivas
export async function PUT(request: NextRequest) {
  // Autenticación y autorización usando UnifiedAuth
  const authResult = await UnifiedAuth(request, [UserRole.COMPANY, UserRole.ADMIN]);
  
  if (!authResult.success) {
    return authResult.response;
  }
  
  const user = authResult.user!;
  try {
    const companyId = user.companyId;
    const body = await request.json();
    const { actionId, status, notes } = body;
    
    if (!companyId) {
      return NextResponse.json(
        { error: "ID de empresa no encontrado" },
        { status: 400 }
      );
    }

    if (!actionId || !status) {
      return NextResponse.json(
        { error: "actionId y status son requeridos" },
        { status: 400 }
      );
    }

    // Log de auditoría para cambios en acciones correctivas
    await auditLog({
      action: 'compliance_action_updated',
      userId: user.userId,
      companyId,
      metadata: { 
        actionId,
        oldStatus: 'pending', // En producción, obtener de la BD
        newStatus: status,
        notes,
        endpoint: '/api/compliance'
      }
    });

    // Simular actualización en base de datos
    logger.info('Compliance action updated:', {
      actionId,
      companyId,
      userId: user.userId,
      status,
      notes
    });

    return NextResponse.json({
      success: true,
      data: {
        actionId,
        status,
        updatedAt: new Date(),
        updatedBy: user.userId
      },
      message: "Acción correctiva actualizada exitosamente"
    });

  } catch (error) {
    logger.error('Error updating compliance action:', {
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