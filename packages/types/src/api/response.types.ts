/**
 * @fileoverview Tipos para responses de API
 * @module @altamedica/types/api/response
 */

import { z } from 'zod';

// ==================== BASE RESPONSE TYPES ====================

/**
 * Respuesta exitosa de API
 * @interface ApiSuccessResponse
 * @template T - Tipo de los datos retornados
 */
export interface ApiSuccessResponse<T = any> {
  /** Indica operación exitosa */
  success: true;
  /** Datos retornados */
  data: T;
  /** Mensaje descriptivo opcional */
  message?: string;
  /** Timestamp ISO 8601 */
  timestamp: string;
  /** ID de trazabilidad */
  traceId: string;
  /** Metadatos adicionales */
  metadata?: ResponseMetadata;
}

/**
 * Error detallado de API
 * @interface ApiError
 */
export interface ApiError {
  /** Código único del error */
  code: string;
  /** Mensaje legible del error */
  message: string;
  /** Detalles técnicos del error */
  details?: any;
  /** Campo que causó el error */
  field?: string;
  /** Valor que causó el error */
  value?: any;
  /** Stack trace (solo en desarrollo) */
  stack?: string;
}

/**
 * Respuesta de error de API
 * @interface ApiErrorResponse
 */
export interface ApiErrorResponse {
  /** Indica operación fallida */
  success: false;
  /** Información del error */
  error: ApiError;
  /** Código de estado HTTP */
  statusCode: number;
  /** Timestamp ISO 8601 */
  timestamp: string;
  /** ID de trazabilidad */
  traceId: string;
  /** Errores de validación */
  validationErrors?: ValidationError[];
}

/**
 * Error de validación
 * @interface ValidationError
 */
export interface ValidationError {
  /** Campo con error */
  field: string;
  /** Mensaje de error */
  message: string;
  /** Tipo de validación que falló */
  type: 'required' | 'format' | 'range' | 'unique' | 'custom';
  /** Valor recibido */
  received?: any;
  /** Valor esperado */
  expected?: any;
}

/**
 * Tipo unión para cualquier respuesta de API
 * @type ApiResponse
 * @template T - Tipo de datos en caso de éxito
 */
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// ==================== METADATA ====================

/**
 * Metadatos de respuesta
 * @interface ResponseMetadata
 */
export interface ResponseMetadata {
  /** Versión de la API */
  apiVersion?: string;
  /** Tiempo de procesamiento en ms */
  processingTime?: number;
  /** Servidor que procesó la request */
  serverInstance?: string;
  /** Información de caché */
  cache?: CacheMetadata;
  /** Rate limit info */
  rateLimit?: RateLimitMetadata;
}

/**
 * Metadatos de caché
 * @interface CacheMetadata
 */
export interface CacheMetadata {
  /** Respuesta viene de caché */
  hit: boolean;
  /** TTL restante en segundos */
  ttl?: number;
  /** Timestamp de cuando se cacheó */
  cachedAt?: string;
}

/**
 * Metadatos de rate limit
 * @interface RateLimitMetadata
 */
export interface RateLimitMetadata {
  /** Límite de requests */
  limit: number;
  /** Requests restantes */
  remaining: number;
  /** Timestamp de reset */
  reset: string;
}

// ==================== PAGINATED RESPONSE ====================

/**
 * Respuesta paginada
 * @interface PaginatedResponse
 * @template T - Tipo de los elementos
 */
export interface PaginatedResponse<T> {
  /** Elementos de la página actual */
  items: T[];
  /** Información de paginación */
  pagination: PaginationInfo;
  /** Agregaciones opcionales */
  aggregations?: Record<string, any>;
}

/**
 * Información de paginación
 * @interface PaginationInfo
 */
export interface PaginationInfo {
  /** Página actual */
  currentPage: number;
  /** Total de páginas */
  totalPages: number;
  /** Elementos por página */
  pageSize: number;
  /** Total de elementos */
  totalItems: number;
  /** Hay página siguiente */
  hasNextPage: boolean;
  /** Hay página anterior */
  hasPreviousPage: boolean;
  /** Primer elemento de la página */
  startIndex: number;
  /** Último elemento de la página */
  endIndex: number;
}

// ==================== BATCH RESPONSE ====================

/**
 * Respuesta de operación batch
 * @interface BatchResponse
 * @template T - Tipo de los resultados
 */
export interface BatchResponse<T> {
  /** Resultados exitosos */
  succeeded: BatchResult<T>[];
  /** Resultados fallidos */
  failed: BatchError[];
  /** Resumen de la operación */
  summary: BatchSummary;
}

/**
 * Resultado individual de batch
 * @interface BatchResult
 * @template T - Tipo del resultado
 */
export interface BatchResult<T> {
  /** Índice en el batch original */
  index: number;
  /** ID del item procesado */
  id?: string;
  /** Resultado de la operación */
  result: T;
  /** Warnings si hubo */
  warnings?: string[];
}

/**
 * Error individual de batch
 * @interface BatchError
 */
export interface BatchError {
  /** Índice en el batch original */
  index: number;
  /** ID del item si existe */
  id?: string;
  /** Error ocurrido */
  error: ApiError;
}

/**
 * Resumen de operación batch
 * @interface BatchSummary
 */
export interface BatchSummary {
  /** Total de items procesados */
  total: number;
  /** Items exitosos */
  succeeded: number;
  /** Items fallidos */
  failed: number;
  /** Tiempo de procesamiento en ms */
  processingTime: number;
  /** Procesados en paralelo */
  parallel: boolean;
}

// ==================== STREAMING RESPONSE ====================

/**
 * Respuesta de streaming
 * @interface StreamingResponse
 * @template T - Tipo de los chunks
 */
export interface StreamingResponse<T> {
  /** ID del stream */
  streamId: string;
  /** Tipo de evento */
  eventType: 'start' | 'data' | 'end' | 'error';
  /** Datos del chunk */
  data?: T;
  /** Error si ocurrió */
  error?: ApiError;
  /** Progreso si aplica */
  progress?: {
    current: number;
    total: number;
    percentage: number;
  };
  /** Timestamp del evento */
  timestamp: string;
}

// ==================== HEALTH CHECK ====================

/**
 * Respuesta de health check
 * @interface HealthCheckResponse
 */
export interface HealthCheckResponse {
  /** Estado general del servicio */
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** Versión del servicio */
  version: string;
  /** Uptime en segundos */
  uptime: number;
  /** Timestamp del check */
  timestamp: string;
  /** Checks individuales */
  checks: HealthCheck[];
}

/**
 * Check individual de salud
 * @interface HealthCheck
 */
export interface HealthCheck {
  /** Nombre del componente */
  name: string;
  /** Estado del componente */
  status: 'up' | 'down' | 'degraded';
  /** Tiempo de respuesta en ms */
  responseTime?: number;
  /** Mensaje adicional */
  message?: string;
  /** Detalles del check */
  details?: Record<string, any>;
}

// ==================== SCHEMAS ====================

/**
 * Schema para respuesta exitosa
 */
export const ApiSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.any(),
  message: z.string().optional(),
  timestamp: z.string(),
  traceId: z.string(),
  metadata: z.record(z.any()).optional()
});

/**
 * Schema para respuesta de error
 */
export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
    field: z.string().optional()
  }),
  statusCode: z.number(),
  timestamp: z.string(),
  traceId: z.string(),
  validationErrors: z.array(z.object({
    field: z.string(),
    message: z.string(),
    type: z.enum(['required', 'format', 'range', 'unique', 'custom'])
  })).optional()
});

/**
 * Schema para cualquier respuesta
 */
export const ApiResponseSchema = z.union([
  ApiSuccessResponseSchema,
  ApiErrorResponseSchema
]);