/**
 * @fileoverview Tipos utilitarios y helpers para TypeScript
 * @module @altamedica/types/core/utility
 */

/**
 * Extrae las claves de un objeto que tienen valores de tipo T
 * @type KeysOfType
 * @template Obj - Tipo del objeto
 * @template T - Tipo de valor a buscar
 */
export type KeysOfType<Obj, T> = {
  [K in keyof Obj]: Obj[K] extends T ? K : never;
}[keyof Obj];

/**
 * Hace deep readonly un tipo
 * @type DeepReadonly
 * @template T - Tipo a hacer readonly
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends Record<string, any>
    ? DeepReadonly<T[P]>
    : T[P];
};

/**
 * Hace deep partial un tipo
 * @type DeepPartial
 * @template T - Tipo a hacer partial
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Record<string, any>
    ? DeepPartial<T[P]>
    : T[P];
};

/**
 * Extrae el tipo de los elementos de un array
 * @type ArrayElement
 * @template T - Tipo del array
 */
export type ArrayElement<T extends readonly unknown[]> = T extends readonly (infer U)[] ? U : never;

/**
 * Une dos tipos excluyendo propiedades duplicadas
 * @type Merge
 * @template T - Primer tipo
 * @template U - Segundo tipo (tiene prioridad)
 */
export type Merge<T, U> = Omit<T, keyof U> & U;

/**
 * Tipo que representa un valor o una promesa de ese valor
 * @type MaybePromise
 * @template T - Tipo del valor
 */
export type MaybePromise<T> = T | Promise<T>;

/**
 * Tipo que representa un valor o null
 * @type Nullable
 * @template T - Tipo del valor
 */
export type Nullable<T> = T | null;

/**
 * Tipo que representa un valor opcional (puede ser undefined)
 * @type Optional
 * @template T - Tipo del valor
 */
export type Optional<T> = T | undefined;

/**
 * Convierte un tipo union a intersection
 * @type UnionToIntersection
 * @template U - Union type
 */
export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

/**
 * Obtiene las claves de un objeto como string literal types
 * @type StringKeys
 * @template T - Tipo del objeto
 */
export type StringKeys<T> = Extract<keyof T, string>;

/**
 * Tipo para representar un constructor
 * @type Constructor
 * @template T - Tipo que construye
 */
export type Constructor<T = {}> = new (...args: any[]) => T;

/**
 * Tipo para representar un diccionario/mapa
 * @type Dictionary
 * @template T - Tipo de los valores
 */
export type Dictionary<T> = Record<string, T>;

/**
 * Excluye null y undefined de un tipo
 * @type NonNullable
 * @template T - Tipo original
 */
export type NonNullableFields<T> = {
  [P in keyof T]-?: NonNullable<T[P]>;
};

/**
 * Selecciona solo las propiedades de tipo función
 * @type FunctionProps
 * @template T - Tipo del objeto
 */
export type FunctionProps<T> = {
  [K in keyof T as T[K] extends Function ? K : never]: T[K];
};

/**
 * Selecciona solo las propiedades que NO son funciones
 * @type NonFunctionProps
 * @template T - Tipo del objeto
 */
export type NonFunctionProps<T> = {
  [K in keyof T as T[K] extends Function ? never : K]: T[K];
};

/**
 * Tipo para valores que pueden ser un array o un solo elemento
 * @type MaybeArray
 * @template T - Tipo del elemento
 */
export type MaybeArray<T> = T | T[];

/**
 * Obtiene el tipo de retorno de una función async
 * @type AsyncReturnType
 * @template T - Tipo de la función
 */
export type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (...args: any) => Promise<infer R> ? R : never;

/**
 * Marca propiedades específicas como requeridas
 * @type RequireFields
 * @template T - Tipo base
 * @template K - Claves a hacer requeridas
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Marca propiedades específicas como opcionales
 * @type OptionalFields
 * @template T - Tipo base
 * @template K - Claves a hacer opcionales
 */
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Tipo para representar coordenadas geográficas
 * @interface Coordinates
 */
export interface Coordinates {
  /** Latitud en grados decimales */
  latitude: number;
  /** Longitud en grados decimales */
  longitude: number;
  /** Precisión en metros (opcional) */
  accuracy?: number;
}

/**
 * Tipo para representar un rango numérico
 * @interface NumberRange
 */
export interface NumberRange {
  /** Valor mínimo (inclusive) */
  min: number;
  /** Valor máximo (inclusive) */
  max: number;
}

/**
 * Resultado de una operación que puede fallar
 * @type Result
 * @template T - Tipo del valor exitoso
 * @template E - Tipo del error
 */
export type Result<T, E = Error> = 
  | { success: true; value: T }
  | { success: false; error: E };

/**
 * Helper para crear resultados exitosos
 * @param value - Valor exitoso
 * @returns Result exitoso
 */
export function Ok<T>(value: T): Result<T, never> {
  return { success: true, value };
}

/**
 * Helper para crear resultados de error
 * @param error - Error
 * @returns Result con error
 */
export function Err<E>(error: E): Result<never, E> {
  return { success: false, error };
}