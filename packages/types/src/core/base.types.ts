/**
 * @fileoverview Tipos base fundamentales del sistema AltaMedica
 * @module @altamedica/types/core
 */

import { z } from 'zod';
// Importamos roles unificados para evitar duplicación de export
import { UserRole } from '../auth/roles';

// ==================== BASE ENTITIES ====================

/**
 * Entidad base con campos comunes para todas las entidades del sistema
 * @interface BaseEntity
 */
export interface BaseEntity {
  /** Identificador único de la entidad */
  id: string;
  /** Fecha de creación en ISO 8601 */
  createdAt: Date;
  /** Fecha de última actualización en ISO 8601 */
  updatedAt: Date;
  /** Indica si la entidad está activa */
  isActive?: boolean;
  /** Metadatos adicionales de la entidad */
  metadata?: Record<string, unknown>;
}

/**
 * Parámetros base para paginación
 * @interface PaginationParams
 */
export interface PaginationParams {
  /** Número de página (1-indexed) */
  page: number;
  /** Cantidad de elementos por página */
  pageSize: number;
  /** Campo por el cual ordenar */
  sortBy?: string;
  /** Dirección del ordenamiento */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Respuesta paginada genérica
 * @interface PaginatedResponse
 * @template T - Tipo de los elementos paginados
 */
export interface PaginatedResponse<T> {
  /** Elementos de la página actual */
  data: T[];
  /** Total de elementos en todas las páginas */
  total: number;
  /** Número de página actual */
  page: number;
  /** Cantidad de elementos por página */
  pageSize: number;
  /** Total de páginas disponibles */
  totalPages: number;
  /** Indica si hay página siguiente */
  hasNextPage: boolean;
  /** Indica si hay página anterior */
  hasPreviousPage: boolean;
}

// ==================== USER & AUTH TYPES ====================

// Deprecated: enum legacy; se mantiene como alias para compatibilidad de compilación si algún módulo interno lo usa.
/** @deprecated Usar UserRole unificado de '../auth/roles' */
export enum LegacyUserRole {
  ADMIN = 'admin',
  DOCTOR = 'doctor',
  PATIENT = 'patient',
  STAFF = 'staff',
  COMPANY_ADMIN = 'company_admin'
}
/** @deprecated Usar UserRoleSchema de roles.ts si fuera necesario */
export const LegacyUserRoleSchema = z.nativeEnum(LegacyUserRole);

/**
 * Estados posibles de un usuario
 * @enum {string}
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification'
}

/**
 * Información básica de usuario
 * @interface BaseUser
 */
export interface BaseUser extends BaseEntity {
  /** Correo electrónico único */
  email: string;
  /** Nombre(s) del usuario */
  firstName: string;
  /** Apellido(s) del usuario */
  lastName: string;
  /** Rol principal del usuario */
  role: UserRole; // rol unificado
  /** Estado actual del usuario */
  status: UserStatus;
  /** URL del avatar del usuario */
  avatarUrl?: string;
  /** Número de teléfono con formato internacional */
  phoneNumber?: string;
  /** Indica si el perfil está completo */
  profileComplete: boolean;
  /** Última fecha de inicio de sesión */
  lastLoginAt?: Date;
  /** Preferencias del usuario */
  preferences?: UserPreferences;
}

/**
 * Preferencias de usuario
 * @interface UserPreferences
 */
export interface UserPreferences {
  /** Idioma preferido (ISO 639-1) */
  language: string;
  /** Zona horaria (IANA timezone) */
  timezone: string;
  /** Preferencias de notificaciones */
  notifications: NotificationPreferences;
  /** Tema de la interfaz */
  theme?: 'light' | 'dark' | 'system';
}

/**
 * Preferencias de notificaciones
 * @interface NotificationPreferences
 */
export interface NotificationPreferences {
  /** Notificaciones por email */
  email: boolean;
  /** Notificaciones por SMS */
  sms: boolean;
  /** Notificaciones push */
  push: boolean;
  /** Notificaciones por WhatsApp */
  whatsapp?: boolean;
}

// ==================== API RESPONSE TYPES ====================

/**
 * Respuesta exitosa de API
 * @interface ApiSuccessResponse
 * @template T - Tipo de los datos retornados
 */
export interface ApiSuccessResponse<T = any> {
  /** Indica operación exitosa */
  success: true;
  /** Datos retornados por la API */
  data: T;
  /** Mensaje descriptivo opcional */
  message?: string;
  /** Timestamp de la respuesta */
  timestamp: string;
  /** ID de trazabilidad para debugging */
  traceId?: string;
}

/**
 * Error de API con detalles
 * @interface ApiError
 */
export interface ApiError {
  /** Código único del error */
  code: string;
  /** Mensaje legible del error */
  message: string;
  /** Detalles adicionales del error */
  details?: any;
  /** Código de estado HTTP */
  statusCode?: number;
  /** Campo que causó el error (para validaciones) */
  field?: string;
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
  /** Timestamp del error */
  timestamp: string;
  /** ID de trazabilidad para debugging */
  traceId?: string;
}

/**
 * Tipo unión para respuestas de API
 * @type ApiResponse
 * @template T - Tipo de los datos en caso de éxito
 */
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// ==================== UTILITY TYPES ====================

/**
 * Hace todas las propiedades de T opcionales excepto las especificadas
 * @type PartialExcept
 * @template T - Tipo base
 * @template K - Claves que permanecen requeridas
 */
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

/**
 * Hace todas las propiedades de T requeridas excepto las especificadas
 * @type RequiredExcept
 * @template T - Tipo base
 * @template K - Claves que permanecen opcionales
 */
export type RequiredExcept<T, K extends keyof T> = Required<Omit<T, K>> & Pick<T, K>;

/**
 * Tipo para representar un rango de fechas
 * @interface DateRange
 */
export interface DateRange {
  /** Fecha de inicio (inclusive) */
  startDate: Date;
  /** Fecha de fin (inclusive) */
  endDate: Date;
}

/**
 * Opciones de filtrado genéricas
 * @interface FilterOptions
 * @template T - Tipo de la entidad a filtrar
 */
export interface FilterOptions<T = any> extends PaginationParams {
  /** Filtros específicos de la entidad */
  filters?: Partial<T>;
  /** Búsqueda de texto libre */
  search?: string;
  /** Rango de fechas para filtrar */
  dateRange?: DateRange;
  /** Incluir entidades inactivas */
  includeInactive?: boolean;
}

// ==================== VALIDATION SCHEMAS ====================

/**
 * Schema para validación de email
 */
export const EmailSchema = z
  .string()
  .email('Email inválido')
  .toLowerCase()
  .trim();

/**
 * Schema para validación de teléfono internacional
 */
export const PhoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Formato de teléfono inválido')
  .optional();

/**
 * Schema para validación de contraseña segura
 */
export const PasswordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
  .regex(/[a-z]/, 'Debe contener al menos una minúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número')
  .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial');

/**
 * Schema para validación de UUID
 */
export const UUIDSchema = z
  .string()
  .uuid('ID inválido');

/**
 * Schema para validación de fecha ISO
 */
export const ISODateSchema = z
  .string()
  .datetime('Fecha debe estar en formato ISO 8601');

// ==================== EXPORT ALL SCHEMAS ====================

export const schemas = {
  LegacyUserRoleSchema,
  EmailSchema,
  PhoneSchema,
  PasswordSchema,
  UUIDSchema,
  ISODateSchema
} as const;