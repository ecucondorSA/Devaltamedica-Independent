import { NextRequest, NextResponse } from 'next/server';
import { UnifiedAuth } from '@/auth/UnifiedAuthSystem';
import { patientDataAggregator } from '@altamedica/shared';
import type { ExportFormat, ExportScope } from '@altamedica/shared/services/patient-data-export.service';
import { z } from 'zod';

import { logger } from '@altamedica/shared/services/logger.service';
// Schema para exportación rápida
const QuickExportSchema = z.object({
  patientId: z.string(),
  format: z.enum(['json', 'pdf', 'csv']),
  scope: z.enum(['last-year', 'last-month', 'last-week']).default('last-year'),
});

/**
 * POST /api/v1/patients/export/quick
 * Exportación rápida con opciones predefinidas
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const authResult = await UnifiedAuth(request, ['patient', 'doctor', 'admin']);
    if (!authResult.success) {
      return authResult.response;
    }

    const { user } = authResult;
    const body = await request.json();
    
    // Validar request
    const validatedData = QuickExportSchema.parse(body);
    
    // Verificar permisos
    if (user.role === 'patient' && user.id !== validatedData.patientId) {
      return NextResponse.json(
        { error: 'No autorizado para exportar datos de otro paciente' },
        { status: 403 }
      );
    }

    logger.info(`[Quick Export] Processing quick export for patient ${validatedData.patientId}`);

    // Opciones predefinidas para exportación rápida
    const quickExportOptions = {
      includePersonalInfo: true,
      includeMedicalHistory: true,
      includePrescriptions: true,
      includeLabResults: true,
      includeImagingStudies: false,
      includeAppointments: true,
      includeTelemedicine: false,
      includeInsurance: false,
      includeBilling: false,
      includeConsents: false,
      includeAuditLogs: false,
    };

    // Agregar datos del paciente
    const aggregatedData = await patientDataAggregator.aggregatePatientData(
      validatedData.patientId,
      quickExportOptions
    );
    
    // Convertir al formato solicitado
    const exportBuffer = await patientDataAggregator.exportAggregatedData(
      aggregatedData,
      validatedData.format
    );
    
    // Convertir buffer a base64 para envío directo
    const base64Data = exportBuffer.toString('base64');
    const mimeType = getMimeType(validatedData.format);
    
    // Crear data URL para descarga directa
    const downloadUrl = `data:${mimeType};base64,${base64Data}`;
    
    // Log de auditoría
    logger.info(`[Quick Export] Export completed:`, {
      patientId: validatedData.patientId,
      format: validatedData.format,
      scope: validatedData.scope,
      requestedBy: user.id,
      size: exportBuffer.length,
    });

    return NextResponse.json({
      success: true,
      downloadUrl,
      fileName: `patient_data_${validatedData.patientId}_${Date.now()}.${validatedData.format}`,
      size: exportBuffer.length,
      format: validatedData.format,
    });

  } catch (error) {
    logger.error('[Quick Export] Error:', undefined, error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al procesar la exportación rápida' },
      { status: 500 }
    );
  }
}

/**
 * Obtiene el tipo MIME según el formato
 */
function getMimeType(format: 'json' | 'pdf' | 'csv'): string {
  switch (format) {
    case 'json':
      return 'application/json';
    case 'pdf':
      return 'application/pdf';
    case 'csv':
      return 'text/csv';
    default:
      return 'application/octet-stream';
  }
}