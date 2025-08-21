import { UnifiedAuth } from '@/auth/UnifiedAuthSystem';
import { patientDataAggregator, patientDataExportService } from '@altamedica/shared';
import type { ExportFormat, ExportOptions, ExportScope } from '@altamedica/shared/services/patient-data-export.service';
import { UserRole } from '@altamedica/types';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { logger } from '@altamedica/shared/services/logger.service';
// Schema de validación para la solicitud de exportación (payload UI)
// Nota: Las claves de options provienen del modal de pacientes y se mapean luego a ExportOptions del servicio.
const UiExportRequestSchema = z.object({
  patientId: z.string(),
  format: z.enum(['json', 'pdf', 'csv', 'zip', 'fhir']),
  scope: z.enum(['complete', 'last-year', 'last-5-years', 'custom']),
  options: z.object({
    includePersonalInfo: z.boolean(),
    includeMedicalHistory: z.boolean(),
    includePrescriptions: z.boolean(),
    includeLabResults: z.boolean(),
    includeImagingStudies: z.boolean(),
    includeAppointments: z.boolean(),
    includeTelemedicine: z.boolean(),
    includeInsurance: z.boolean(),
    includeBilling: z.boolean(),
    includeConsents: z.boolean(),
    includeAuditLogs: z.boolean(),
  }),
  dateRange: z.object({
    startDate: z.string(),
    endDate: z.string(),
  }).optional(),
});

type UiExportRequest = z.infer<typeof UiExportRequestSchema>;

// Mapeo UI -> ExportOptions servicio
function mapUiOptionsToService(opts: UiExportRequest['options']): ExportOptions {
  return {
    includeMedicalHistory: opts.includeMedicalHistory,
    includeLabResults: opts.includeLabResults,
    includePrescriptions: opts.includePrescriptions,
    includeAppointments: opts.includeAppointments,
    includeVitalSigns: true, // se habilita por defecto mientras UI no lo expone
    includeImmunizations: true,
    includeAllergies: true,
    includeProcedures: true,
    includeDiagnoses: true,
    includeNotes: true,
    includeImages: opts.includeImagingStudies,
    includeDocuments: opts.includePersonalInfo, // tratamos docs personales como documents
    includeBilling: opts.includeBilling,
    includeConsents: opts.includeConsents,
    includeAuditLogs: opts.includeAuditLogs,
  };
}

// Construye ExportFormat simplificado; se extiende si la UI agrega banderas específicas
function buildExportFormat(format: UiExportRequest['format']): ExportFormat {
  return {
    type: format,
    includeImages: true,
    includeDocuments: true,
    language: 'es'
  };
}

// Construye ExportScope base según selección de UI
function buildExportScope(scope: UiExportRequest['scope']): ExportScope {
  if (scope === 'complete') {
    return { includeAll: true };
  }
  return { includeAll: false, categories: undefined }; // categorías específicas pendiente de refinamiento
}

/**
 * POST /api/v1/patients/export
 * Crea una solicitud de exportación de datos del paciente
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
  const authResult = await UnifiedAuth(request, [UserRole.PATIENT, UserRole.DOCTOR, UserRole.ADMIN]);
    if (!authResult.success) {
      return authResult.response;
    }

    const { user } = authResult;
    const body = await request.json();
    
    // Validar request
  const validatedData = UiExportRequestSchema.parse(body);
    
    // Verificar permisos
    // Un paciente solo puede exportar sus propios datos
    // Un doctor puede exportar datos de sus pacientes
    // Un admin puede exportar cualquier dato
  if (user.role === UserRole.PATIENT && user.id !== validatedData.patientId) {
      return NextResponse.json(
        { error: 'No autorizado para exportar datos de otro paciente' },
        { status: 403 }
      );
    }
    
  if (user.role === UserRole.DOCTOR) {
      // Verificar que el doctor tenga relación con el paciente
      // TODO: Implementar verificación de relación doctor-paciente
    }

    // Crear solicitud de exportación
    const serviceOptions = mapUiOptionsToService(validatedData.options);
    const serviceFormat = buildExportFormat(validatedData.format);
    const serviceScope = buildExportScope(validatedData.scope);

    const exportRequest = await patientDataExportService.createExportRequest(
      validatedData.patientId,
      user.id, // requestedBy correcto
      serviceFormat,
      serviceScope,
      serviceOptions,
      validatedData.dateRange ? { from: new Date(validatedData.dateRange.startDate), to: new Date(validatedData.dateRange.endDate) } : undefined
    );

    // Log de auditoría
    logger.info(`[Export API] Export request created:`, {
      requestId: exportRequest.id,
      patientId: validatedData.patientId,
      format: validatedData.format,
      requestedBy: user.id,
      role: user.role,
    });

    // Procesar exportación de forma asíncrona
  processExportAsync(exportRequest.id, validatedData, { serviceFormat, serviceOptions });

    return NextResponse.json({
      success: true,
      requestId: exportRequest.id,
      status: exportRequest.status,
      message: 'Su solicitud de exportación está siendo procesada',
      estimatedTime: '1-5 minutos',
    });

  } catch (error) {
    logger.error('[Export API] Error:', undefined, error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al procesar la solicitud de exportación' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/patients/export?requestId=xxx
 * Obtiene el estado de una solicitud de exportación
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const authResult = await UnifiedAuth(request, ['patient', 'doctor', 'admin']);
    if (!authResult.success) {
      return authResult.response;
    }

    const { user } = authResult;
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');
    
    if (!requestId) {
      return NextResponse.json(
        { error: 'ID de solicitud requerido' },
        { status: 400 }
      );
    }

    // Obtener estado de la solicitud
    const exportRequest = await patientDataExportService.getExportRequest(requestId);
    
    if (!exportRequest) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      );
    }

    // Verificar permisos
    if (user.role === 'patient' && user.id !== exportRequest.patientId) {
      return NextResponse.json(
        { error: 'No autorizado para ver esta solicitud' },
        { status: 403 }
      );
    }

    // Si está completada, incluir URL de descarga
    let downloadUrl = null;
    if (exportRequest.status === 'completed' && exportRequest.downloadUrl) {
      // Generar URL temporal firmada (válida por 7 días)
      downloadUrl = await generateSignedDownloadUrl(
        exportRequest.downloadUrl,
        exportRequest.patientId
      );
    }

    return NextResponse.json({
      success: true,
      request: {
        id: exportRequest.id,
        status: exportRequest.status,
        format: exportRequest.format,
        scope: exportRequest.scope,
        createdAt: exportRequest.createdAt,
        completedAt: exportRequest.completedAt,
        expiresAt: exportRequest.expiresAt,
        downloadUrl,
        errorMessage: exportRequest.errorMessage,
      },
    });

  } catch (error) {
    logger.error('[Export API] Error:', undefined, error);
    return NextResponse.json(
      { error: 'Error al obtener estado de exportación' },
      { status: 500 }
    );
  }
}

/**
 * Procesa la exportación de forma asíncrona
 */
interface ProcessContext {
  serviceFormat: ExportFormat;
  serviceOptions: ExportOptions;
}

async function processExportAsync(
  requestId: string,
  data: UiExportRequest,
  ctx: ProcessContext
) {
  try {
    logger.info(`[Export API] Starting async export processing for request ${requestId}`);
    
    // Actualizar estado a procesando
    await patientDataExportService.updateExportStatus(requestId, 'processing');
    
    // Agregar datos del paciente
    const aggregatedData = await patientDataAggregator.aggregatePatientData(
      data.patientId,
      ctx.serviceOptions
    );
    
    logger.info(`[Export API] Data aggregated for patient ${data.patientId}`);
    
    // Convertir al formato solicitado
    const exportBuffer = await patientDataAggregator.exportAggregatedData(
      aggregatedData,
      data.format
    );
    
    logger.info(`[Export API] Data exported to ${data.format} format`);
    
    // Guardar archivo y obtener URL
    const downloadUrl = await saveExportFile(
      requestId,
      data.patientId,
      data.format,
      exportBuffer
    );
    
    // Actualizar solicitud con URL de descarga
    await patientDataExportService.completeExportRequest(
      requestId,
      downloadUrl
    );
    
    logger.info(`[Export API] Export completed successfully for request ${requestId}`);
    
    // Enviar notificación al paciente
    // TODO: Implementar notificación por email/push
    
  } catch (error) {
    logger.error(`[Export API] Error processing export:`, undefined, error);
    
    // Actualizar estado a error
    await patientDataExportService.updateExportStatus(
      requestId,
      'failed',
      error instanceof Error ? error.message : 'Error desconocido'
    );
  }
}

/**
 * Guarda el archivo exportado y retorna la URL de descarga
 */
async function saveExportFile(
  requestId: string,
  patientId: string,
  format: ExportFormat,
  buffer: Buffer
): Promise<string> {
  // En producción, esto guardaría en un servicio de almacenamiento como S3
  // Por ahora, simulamos con una URL local
  
  const fileName = `export_${patientId}_${requestId}.${format}`;
  const filePath = `/exports/${fileName}`;
  
  // TODO: Implementar guardado real en almacenamiento
  // await uploadToStorage(filePath, buffer);
  
  // Retornar URL (en producción sería una URL de S3 o similar)
  return `${process.env.NEXT_PUBLIC_API_URL}/downloads${filePath}`;
}

/**
 * Genera una URL de descarga firmada y temporal
 */
async function generateSignedDownloadUrl(
  originalUrl: string,
  patientId: string
): Promise<string> {
  // En producción, esto generaría una URL firmada con expiración
  // Por ahora, retornamos la URL original
  
  // TODO: Implementar firma de URL con JWT o servicio de almacenamiento
  
  return originalUrl;
}