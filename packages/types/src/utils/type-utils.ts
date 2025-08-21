/**
 * @fileoverview Utilidades para manejo de tipos
 * @module @altamedica/types/utils/type-utils
 * @description Funciones utilitarias para trabajar con tipos TypeScript
 */

/**
 * Extrae las claves de un tipo como union de strings literales
 * @template T - Tipo del cual extraer las claves
 */
export type KeysOf<T> = keyof T;

/**
 * Extrae los valores de un tipo como union
 * @template T - Tipo del cual extraer los valores
 */
export type ValuesOf<T> = T[keyof T];

/**
 * Crea un tipo que hace opcionales solo las claves especificadas
 * @template T - Tipo base
 * @template K - Claves a hacer opcionales
 */
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Crea un tipo que hace requeridas solo las claves especificadas
 * @template T - Tipo base
 * @template K - Claves a hacer requeridas
 */
export type RequiredKeys<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Extrae el tipo de retorno de una función async
 * @template T - Tipo de la función
 */
export type AsyncReturnType<T extends (...args: any) => Promise<any>> =
  T extends (...args: any) => Promise<infer R> ? R : never;

/**
 * Convierte un tipo en una versión "mutable" (quita readonly)
 * @template T - Tipo a hacer mutable
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

/**
 * Convierte un tipo en profundamente readonly
 * @template T - Tipo a hacer readonly
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Crea un tipo con todas las propiedades opcionales de forma profunda
 * @template T - Tipo a hacer parcial
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export const TypeUtils = {
  /**
   * Verifica si dos tipos son iguales en tiempo de ejecución
   * @param obj1 - Primer objeto
   * @param obj2 - Segundo objeto
   * @returns true si tienen la misma estructura
   */
  haveSameStructure<T, U>(obj1: T, obj2: U): boolean {
    if (typeof obj1 !== typeof obj2) return false;
    if (obj1 === null || obj2 === null) return (obj1 as any) === (obj2 as any);
    if (typeof obj1 !== 'object') return (obj1 as any) === (obj2 as any);
    
    const keys1 = Object.keys(obj1 as any);
    const keys2 = Object.keys(obj2 as any);
    
    if (keys1.length !== keys2.length) return false;
    
    return keys1.every(key => 
      keys2.includes(key) && 
      this.haveSameStructure((obj1 as any)[key], (obj2 as any)[key])
    );
  },

  /**
   * Clona profundamente un objeto manteniendo sus tipos
   * @param obj - Objeto a clonar
   * @returns Clon profundo del objeto
   */
  deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime()) as any;
    if (Array.isArray(obj)) return obj.map(item => this.deepClone(item)) as any;
    
    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }
    return cloned;
  },

  /**
   * Fusiona dos objetos de forma profunda manteniendo tipos
   * @param target - Objeto objetivo
   * @param source - Objeto fuente
   * @returns Objeto fusionado
   */
  deepMerge<T, U>(target: T, source: U): T & U {
    const result = { ...target } as any;
    
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const sourceValue = source[key];
        const targetValue = (target as any)[key];
        
        if (
          typeof sourceValue === 'object' &&
          sourceValue !== null &&
          typeof targetValue === 'object' &&
          targetValue !== null &&
          !Array.isArray(sourceValue) &&
          !Array.isArray(targetValue)
        ) {
          result[key] = this.deepMerge(targetValue, sourceValue);
        } else {
          result[key] = sourceValue;
        }
      }
    }
    
    return result;
  },

  /**
   * Obtiene las diferencias entre dos objetos
   * @param obj1 - Primer objeto
   * @param obj2 - Segundo objeto
   * @returns Objeto con las diferencias
   */
  getDifferences<T>(obj1: T, obj2: T): Partial<T> {
    const differences: any = {};
    
    for (const key in obj1) {
      if (Object.prototype.hasOwnProperty.call(obj1, key)) {
        const value1 = obj1[key];
        const value2 = obj2[key];
        
        if (typeof value1 === 'object' && typeof value2 === 'object' && 
            value1 !== null && value2 !== null) {
          const nestedDiff = this.getDifferences(value1, value2);
          if (Object.keys(nestedDiff).length > 0) {
            differences[key] = nestedDiff;
          }
        } else if (value1 !== value2) {
          differences[key] = value2;
        }
      }
    }
    
    return differences;
  },

  /**
   * Selecciona solo las propiedades especificadas de un objeto
   * @param obj - Objeto fuente
   * @param keys - Claves a seleccionar
   * @returns Objeto con solo las propiedades seleccionadas
   */
  pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    const result = {} as Pick<T, K>;
    keys.forEach(key => {
      if (key in (obj as any)) {
        result[key] = obj[key];
      }
    });
    return result;
  },

  /**
   * Omite las propiedades especificadas de un objeto
   * @param obj - Objeto fuente
   * @param keys - Claves a omitir
   * @returns Objeto sin las propiedades especificadas
   */
  omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
    const result = { ...obj } as any;
    keys.forEach(key => {
      delete result[key];
    });
    return result;
  },

  /**
   * Verifica si un objeto es vacío
   * @param obj - Objeto a verificar
   * @returns true si está vacío
   */
  isEmpty(obj: unknown): boolean {
    if (obj === null || obj === undefined) return true;
    if (typeof obj === 'string' || Array.isArray(obj)) return obj.length === 0;
    if (typeof obj === 'object') return Object.keys(obj).length === 0;
    return false;
  },

  /**
   * Aplana un objeto anidado
   * @param obj - Objeto a aplanar
   * @param prefix - Prefijo para las claves
   * @returns Objeto aplanado
   */
  flatten(obj: Record<string, any>, prefix: string = ''): Record<string, any> {
    const flattened: Record<string, any> = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          Object.assign(flattened, this.flatten(value, newKey));
        } else {
          flattened[newKey] = value;
        }
      }
    }
    
    return flattened;
  },

  /**
   * Desaplana un objeto previamente aplanado
   * @param obj - Objeto aplanado
   * @returns Objeto anidado
   */
  unflatten(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const keys = key.split('.');
        let current = result;
        
        for (let i = 0; i < keys.length - 1; i++) {
          const k = keys[i];
          if (!(k in current)) {
            current[k] = {};
          }
          current = current[k];
        }
        
        current[keys[keys.length - 1]] = obj[key];
      }
    }
    
    return result;
  }
} as const;