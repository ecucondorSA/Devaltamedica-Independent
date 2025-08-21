/**
 * @fileoverview Tipos para requests y configuración de API
 * @module @altamedica/types/api/request
 */

import { z } from 'zod';

// ==================== REQUEST CONFIGURATION ====================

/**
 * Configuración de request HTTP
 * @interface RequestConfig
 */
export interface RequestConfig {
  /** Headers HTTP personalizados */
  headers?: Record<string, string>;
  /** Timeout en milisegundos */
  timeout?: number;
  /** Número de reintentos en caso de fallo */
  retryAttempts?: number;
  /** Delay entre reintentos en ms */
  retryDelay?: number;
  /** Requiere autenticación */
  requiresAuth?: boolean;
  /** Tipo de contenido */
  contentType?: 'json' | 'form-data' | 'multipart';
  /** Configuración de caché */
  cache?: CacheConfig;
  /** Interceptores personalizados */
  interceptors?: RequestInterceptors;
}

/**
 * Configuración de caché
 * @interface CacheConfig
 */
export interface CacheConfig {
  /** Habilitar caché */
  enabled: boolean;
  /** TTL en segundos */
  ttl?: number;
  /** Claves a excluir del caché */
  excludeKeys?: string[];
  /** Invalidar caché en error */
  invalidateOnError?: boolean;
}

/**
 * Interceptores de request/response
 * @interface RequestInterceptors
 */
export interface RequestInterceptors {
  /** Interceptor antes de enviar request */
  beforeRequest?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
  /** Interceptor después de recibir response */
  afterResponse?: <T>(response: T) => T | Promise<T>;
  /** Interceptor en caso de error */
  onError?: (error: any) => any;
}

// ==================== PAGINATION ====================

/**
 * Parámetros de paginación para requests
 * @interface PaginationRequest
 */
export interface PaginationRequest {
  /** Número de página (1-indexed) */
  page: number;
  /** Elementos por página */
  pageSize: number;
  /** Campo para ordenar */
  sortBy?: string;
  /** Dirección del orden */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Schema de validación para paginación
 */
export const PaginationRequestSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().min(1).max(100),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

// ==================== FILTERS ====================

/**
 * Filtros de búsqueda genéricos
 * @interface SearchFilters
 */
export interface SearchFilters {
  /** Búsqueda de texto libre */
  search?: string;
  /** Filtro por estado activo/inactivo */
  isActive?: boolean;
  /** Rango de fechas */
  dateRange?: {
    startDate: string | Date;
    endDate: string | Date;
  };
  /** Tags para filtrar */
  tags?: string[];
  /** IDs a excluir */
  excludeIds?: string[];
}

/**
 * Filtros específicos para requests médicos
 * @interface MedicalFilters
 */
export interface MedicalFilters extends SearchFilters {
  /** Filtrar por especialidad */
  specialty?: string;
  /** Filtrar por tipo de consulta */
  consultationType?: 'in_person' | 'telemedicine' | 'home_visit';
  /** Filtrar por urgencia */
  urgency?: 'routine' | 'urgent' | 'emergency';
  /** Filtrar por estado de seguro */
  insuranceStatus?: 'covered' | 'pending' | 'denied';
}

// ==================== BATCH OPERATIONS ====================

/**
 * Request para operaciones batch
 * @interface BatchRequest
 * @template T - Tipo de los items
 */
export interface BatchRequest<T> {
  /** Operación a realizar */
  operation: 'create' | 'update' | 'delete';
  /** Items a procesar */
  items: T[];
  /** Opciones de batch */
  options?: BatchOptions;
}

/**
 * Opciones para operaciones batch
 * @interface BatchOptions
 */
export interface BatchOptions {
  /** Continuar en caso de error */
  continueOnError?: boolean;
  /** Validar antes de procesar */
  validateBeforeProcess?: boolean;
  /** Tamaño del chunk para procesamiento */
  chunkSize?: number;
  /** Procesar en paralelo */
  parallel?: boolean;
}

// ==================== FILE UPLOAD ====================

/**
 * Request para carga de archivos
 * @interface FileUploadRequest
 */
export interface FileUploadRequest {
  /** Archivo a cargar */
  file: File | Blob;
  /** Nombre del archivo */
  fileName?: string;
  /** Categoría del archivo */
  category: 'medical_record' | 'lab_result' | 'imaging' | 'prescription' | 'other';
  /** Descripción del archivo */
  description?: string;
  /** ID de la entidad relacionada */
  relatedEntityId?: string;
  /** Tipo de entidad relacionada */
  relatedEntityType?: 'patient' | 'appointment' | 'record';
  /** Metadatos adicionales */
  metadata?: Record<string, any>;
}

/**
 * Progreso de carga de archivo
 * @interface UploadProgress
 */
export interface UploadProgress {
  /** Porcentaje completado (0-100) */
  percentage: number;
  /** Bytes cargados */
  loaded: number;
  /** Bytes totales */
  total: number;
  /** Velocidad de carga en bytes/segundo */
  speed?: number;
  /** Tiempo restante estimado en segundos */
  remainingTime?: number;
}

// ==================== WEBHOOKS ====================

/**
 * Configuración de webhook
 * @interface WebhookConfig
 */
export interface WebhookConfig {
  /** URL del webhook */
  url: string;
  /** Eventos a escuchar */
  events: string[];
  /** Headers personalizados */
  headers?: Record<string, string>;
  /** Secret para validación */
  secret?: string;
  /** Reintentos en caso de fallo */
  retryPolicy?: {
    maxAttempts: number;
    backoffMultiplier: number;
    maxBackoffSeconds: number;
  };
  /** Activo */
  isActive: boolean;
}

// ==================== RATE LIMITING ====================

/**
 * Información de rate limiting
 * @interface RateLimitInfo
 */
export interface RateLimitInfo {
  /** Límite de requests */
  limit: number;
  /** Requests restantes */
  remaining: number;
  /** Timestamp de reset */
  reset: Date;
  /** Ventana de tiempo en segundos */
  window: number;
}

// ==================== EXPORT REQUESTS ====================

/**
 * Request para exportación de datos
 * @interface ExportRequest
 */
export interface ExportRequest {
  /** Formato de exportación */
  format: 'csv' | 'excel' | 'pdf' | 'json';
  /** Tipo de datos a exportar */
  dataType: 'patients' | 'appointments' | 'records' | 'reports';
  /** Filtros a aplicar */
  filters?: SearchFilters;
  /** Campos a incluir */
  fields?: string[];
  /** Incluir datos relacionados */
  includeRelated?: boolean;
  /** Opciones específicas del formato */
  formatOptions?: {
    /** Para CSV */
    delimiter?: string;
    /** Para PDF */
    orientation?: 'portrait' | 'landscape';
    /** Para Excel */
    includeFormulas?: boolean;
  };
}