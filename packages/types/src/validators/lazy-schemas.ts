/**
 * @fileoverview Schemas Zod con lazy loading para optimización de performance
 * @module @altamedica/types/validators/lazy-schemas
 * @description Validaciones optimizadas que se cargan solo cuando se necesitan
 */

import { z } from 'zod';

// TODO: Re-enable when shared package is built
// // Simple logger implementation to avoid circular dependencies
const logger = {
  info: (message, data) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.log(message, data);
    }
  },
  warn: (message, data) => {
    if (typeof console !== 'undefined') {
      console.warn(message, data);
    }
  },
  error: (message, data) => {
    if (typeof console !== 'undefined') {
      console.error(message, data);
    }
  },
  debug: (message, data) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.debug(message, data);
    }
  }
};
// ==================== LAZY LOADING UTILITIES ====================

/**
 * Cache de schemas compilados
 */
const schemaCache = new Map<string, z.ZodSchema>();

/**
 * Configuración de cache
 */
interface CacheConfig {
  /** TTL en milisegundos */
  ttl?: number;
  /** Tamaño máximo del cache */
  maxSize?: number;
  /** Habilitar cache */
  enabled?: boolean;
}

const defaultCacheConfig: Required<CacheConfig> = {
  ttl: 5 * 60 * 1000, // 5 minutos
  maxSize: 100,
  enabled: true
};

/**
 * Entrada del cache con metadatos
 */
interface CacheEntry {
  schema: z.ZodSchema;
  createdAt: number;
  accessCount: number;
  lastAccessed: number;
}

const cacheEntries = new Map<string, CacheEntry>();

/**
 * Crea un schema lazy con cache inteligente
 * @param key - Clave única para el schema
 * @param schemaFactory - Función que crea el schema
 * @param config - Configuración del cache
 * @returns Schema lazy con cache
 */
export function createLazySchema<T extends z.ZodSchema>(
  key: string,
  schemaFactory: () => T,
  config: CacheConfig = {}
): T {
  const finalConfig = { ...defaultCacheConfig, ...config };

  if (!finalConfig.enabled) {
    return schemaFactory();
  }

  return (z.lazy(() => {
    const now = Date.now();
    const entry = cacheEntries.get(key);

    // Check if cached version is valid
    if (entry && (now - entry.createdAt) < finalConfig.ttl) {
      entry.accessCount++;
      entry.lastAccessed = now;
      return entry.schema;
    }

    // Create new schema
    const schema = schemaFactory();
    
    // Manage cache size
    if (cacheEntries.size >= finalConfig.maxSize) {
      // Remove least recently used entry
      let lruKey = '';
      let oldestAccess = now;
      
      for (const [cacheKey, cacheEntry] of cacheEntries.entries()) {
        if (cacheEntry.lastAccessed < oldestAccess) {
          oldestAccess = cacheEntry.lastAccessed;
          lruKey = cacheKey;
        }
      }
      
      if (lruKey) {
        cacheEntries.delete(lruKey);
      }
    }

    // Cache the new schema
    cacheEntries.set(key, {
      schema,
      createdAt: now,
      accessCount: 1,
      lastAccessed: now
    });

    return schema;
  }) as unknown as T);
}

/**
 * Limpia el cache de schemas
 * @param key - Clave específica a limpiar (opcional)
 */
export function clearSchemaCache(key?: string): void {
  if (key) {
    cacheEntries.delete(key);
    schemaCache.delete(key);
  } else {
    cacheEntries.clear();
    schemaCache.clear();
  }
}

/**
 * Obtiene estadísticas del cache
 * @returns Estadísticas del cache
 */
export function getCacheStats(): {
  size: number;
  entries: Array<{
    key: string;
    accessCount: number;
    age: number;
    lastAccessed: number;
  }>;
} {
  const now = Date.now();
  const entries = Array.from(cacheEntries.entries()).map(([key, entry]) => ({
    key,
    accessCount: entry.accessCount,
    age: now - entry.createdAt,
    lastAccessed: entry.lastAccessed
  }));

  return {
    size: cacheEntries.size,
    entries
  };
}

// ==================== OPTIMIZED MEDICAL SCHEMAS ====================

/**
 * Schema básico de paciente (lazy)
 */
export const LazyPatientBaseSchema = createLazySchema(
  'patient-base',
  () => z.object({
    id: z.string().uuid('ID de paciente inválido'),
    userId: z.string().uuid('ID de usuario inválido'),
    medicalRecordNumber: z.string().min(1, 'Número de historia clínica requerido')
  }),
  { ttl: 10 * 60 * 1000 } // 10 minutos cache
);

/**
 * Schema de información personal PHI (lazy con validación especial)
 */
export const LazyPatientPHISchema = createLazySchema(
  'patient-phi',
  () => z.object({
    dateOfBirth: z.date()
      .refine(date => date < new Date(), 'Fecha debe ser en el pasado')
      .refine(date => date > new Date('1900-01-01'), 'Fecha muy antigua'),
    
    gender: z.enum(['male', 'female', 'other'], {
      errorMap: () => ({ message: 'Género debe ser male, female u other' })
    }),
    
    documentType: z.enum(['DNI', 'PASSPORT', 'CEDULA', 'LC', 'LE'], {
      errorMap: () => ({ message: 'Tipo de documento inválido' })
    }),
    
    documentNumber: z.string()
      .min(7, 'Documento muy corto')
      .max(20, 'Documento muy largo')
      .regex(/^[A-Z0-9]+$/, 'Documento solo puede contener letras y números')
  }),
  { ttl: 15 * 60 * 1000 } // 15 minutos cache para PHI
);

/**
 * Schema de información médica crítica (lazy con validaciones médicas)
 */
export const LazyMedicalInfoSchema = createLazySchema(
  'medical-info',
  () => z.object({
    bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
      .optional(),
    
    rhFactor: z.enum(['+', '-']).optional(),
    
    height: z.number()
      .positive('Altura debe ser positiva')
      .min(30, 'Altura muy baja')
      .max(300, 'Altura muy alta')
      .optional(),
    
    weight: z.number()
      .positive('Peso debe ser positivo')
      .min(0.5, 'Peso muy bajo')
      .max(1000, 'Peso muy alto')
      .optional(),
    
    allergies: z.array(z.string().min(1))
      .max(50, 'Demasiadas alergias listadas')
      .default([]),
    
    chronicConditions: z.array(z.string().min(1))
      .max(30, 'Demasiadas condiciones listadas')
      .default([])
  }),
  { ttl: 20 * 60 * 1000 } // 20 minutos cache
);

// ==================== PROGRESSIVE VALIDATION ====================

/**
 * Validador progresivo que valida campos gradualmente
 */
export class ProgressiveValidator<T extends z.ZodType> {
  private schema: T;
  private partialResults: Map<string, any> = new Map();
  
  constructor(schema: T) {
    this.schema = schema;
  }

  /**
   * Valida un campo específico
   * @param fieldName - Nombre del campo
   * @param value - Valor a validar
   * @returns Resultado de validación
   */
  validateField(fieldName: string, value: any): {
    success: boolean;
    error?: string;
    data?: any;
  } {
    try {
      // Para validación de campo individual, usamos pick si es posible
      if (this.schema instanceof z.ZodObject) {
        const fieldSchema = (this.schema.shape as any)[fieldName];
        if (fieldSchema) {
          const result = fieldSchema.parse(value);
          this.partialResults.set(fieldName, result);
          return { success: true, data: result };
        }
      }
      
      // Fallback: validar el objeto completo con el campo
      const testObject = { ...Object.fromEntries(this.partialResults), [fieldName]: value };
      const result = this.schema.parse(testObject);
      this.partialResults.set(fieldName, value);
      return { success: true, data: result };
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.errors.find(e => 
          e.path.length > 0 && e.path[0] === fieldName
        );
        return {
          success: false,
          error: fieldError?.message || 'Error de validación'
        };
      }
      return { success: false, error: 'Error desconocido' };
    }
  }

  /**
   * Valida el objeto completo con todos los campos parciales
   * @returns Resultado de validación completa
   */
  validateComplete(): z.SafeParseReturnType<any, T['_output']> {
    const completeObject = Object.fromEntries(this.partialResults);
    return this.schema.safeParse(completeObject);
  }

  /**
   * Obtiene los campos validados hasta ahora
   * @returns Campos validados
   */
  getValidatedFields(): Record<string, any> {
    return Object.fromEntries(this.partialResults);
  }

  /**
   * Limpia los resultados parciales
   */
  reset(): void {
    this.partialResults.clear();
  }
}

// ==================== CONDITIONAL SCHEMAS ====================

/**
 * Crea un schema condicional basado en otro campo
 * @param condition - Función que determina qué schema usar
 * @param schemas - Map de schemas por condición
 * @returns Schema condicional
 */
export function createConditionalSchema<T>(
  condition: (data: any) => string,
  schemas: Record<string, z.ZodSchema<T>>
): z.ZodSchema<T> {
  return z.lazy(() => 
    z.any().superRefine((data, ctx) => {
      const conditionKey = condition(data);
      const schema = schemas[conditionKey];
      
      if (!schema) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Schema no encontrado para condición: ${conditionKey}`
        });
        return;
      }
      
      const result = schema.safeParse(data);
      if (!result.success) {
        result.error.errors.forEach(error => {
          ctx.addIssue(error);
        });
      }
      
      return result.data;
    })
  );
}

// ==================== BATCH VALIDATION ====================

/**
 * Validador batch optimizado para grandes volúmenes
 */
export class BatchValidator<T extends z.ZodType> {
  private schema: T;
  private batchSize: number;
  
  constructor(schema: T, batchSize: number = 100) {
    this.schema = schema;
    this.batchSize = batchSize;
  }

  /**
   * Valida un array de datos en batches
   * @param data - Array de datos a validar
   * @param onProgress - Callback de progreso
   * @returns Resultados de validación
   */
  async validateBatch(
    data: any[],
    onProgress?: (processed: number, total: number) => void
  ): Promise<{
    valid: T['_output'][];
    invalid: Array<{ index: number; data: any; errors: z.ZodError }>;
    totalProcessed: number;
  }> {
    const valid: T['_output'][] = [];
    const invalid: Array<{ index: number; data: any; errors: z.ZodError }> = [];
    
    for (let i = 0; i < data.length; i += this.batchSize) {
      const batch = data.slice(i, i + this.batchSize);
      
      // Process batch
      const batchPromises = batch.map(async (item, batchIndex) => {
        const actualIndex = i + batchIndex;
        const result = await this.schema.safeParseAsync(item);
        
        if (result.success) {
          valid.push(result.data);
        } else {
          invalid.push({
            index: actualIndex,
            data: item,
            errors: result.error
          });
        }
      });
      
      await Promise.all(batchPromises);
      
      // Report progress
      onProgress?.(Math.min(i + this.batchSize, data.length), data.length);
      
      // Allow event loop to continue
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    return {
      valid,
      invalid,
      totalProcessed: data.length
    };
  }
}

// ==================== PERFORMANCE MONITORING ====================

/**
 * Wrapper para monitoreo de performance de schemas
 * @param schema - Schema a monitorear
 * @param name - Nombre del schema para métricas
 * @returns Schema con monitoreo
 */
export function withPerformanceMonitoring<T extends z.ZodType>(
  schema: T,
  name: string
): T {
  const metrics = {
    validationCount: 0,
    totalTime: 0,
    errorCount: 0,
    averageTime: 0
  };
  
  return (z.lazy(() => 
    schema.transform((data, ctx) => {
      const startTime = performance.now();
      
      try {
        const result = schema.parse(data);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        metrics.validationCount++;
        metrics.totalTime += duration;
        metrics.averageTime = metrics.totalTime / metrics.validationCount;
        
        // Log performance metrics periodically
        if (metrics.validationCount % 100 === 0) {
          // logger.debug(`Schema ${name} metrics:`, {
          //   validations: metrics.validationCount,
          //   avgTime: metrics.averageTime.toFixed(2) + 'ms',
          //   errorRate: (metrics.errorCount / metrics.validationCount * 100).toFixed(1) + '%'
          // });
        }
        
        return result;
      } catch (error) {
        metrics.errorCount++;
        throw error;
      }
    })
  ) as unknown as T);
}

// ==================== PRECOMPILED SCHEMAS ====================

/**
 * Schemas precompilados para uso frecuente
 */
export const PrecompiledSchemas = {
  /** Email optimizado con cache */
  email: createLazySchema(
    'email',
    () => z.string().email('Email inválido').toLowerCase().trim(),
    { ttl: 30 * 60 * 1000 }
  ),
  
  /** UUID optimizado */
  uuid: createLazySchema(
    'uuid',
    () => z.string().uuid('UUID inválido'),
    { ttl: 60 * 60 * 1000 }
  ),
  
  /** Teléfono internacional */
  phone: createLazySchema(
    'phone',
    () => z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Teléfono inválido'),
    { ttl: 30 * 60 * 1000 }
  ),
  
  /** Fecha ISO */
  isoDate: createLazySchema(
    'iso-date',
    () => z.string().datetime('Fecha ISO inválida'),
    { ttl: 60 * 60 * 1000 }
  )
} as const;