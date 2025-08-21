/**
 * @fileoverview Tipos compartidos para hooks utilitarios
 * @module @altamedica/hooks/utils/types
 * @description Definiciones de tipos para hooks utilitarios
 */

// ==========================================
// TIPOS DE DEBOUNCE
// ==========================================

export interface DebounceOptions {
  delay?: number;
  leading?: boolean;
  trailing?: boolean;
  maxDelay?: number;
}

// ==========================================
// TIPOS DE LOCALSTORAGE
// ==========================================

export interface LocalStorageOptions {
  serializer?: {
    parse: (value: string) => any;
    stringify: (value: any) => string;
  };
  syncAcrossTabs?: boolean;
  ttl?: number;
  onError?: (error: Error, key: string) => void;
  encrypt?: boolean;
  prefix?: string;
}

// ==========================================
// TIPOS DE MEDIA QUERY
// ==========================================

export interface MediaQueryOptions {
  defaultValue?: boolean;
  ssrSafe?: boolean;
  onChange?: (matches: boolean) => void;
}

// ==========================================
// TIPOS DE ASYNC
// ==========================================

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  called: boolean;
}

export interface AsyncOptions<T> {
  immediate?: boolean;
  initialData?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  onLoadingChange?: (loading: boolean) => void;
  deps?: any[];
  timeout?: number;
}

// ==========================================
// TIPOS DE INTERVAL
// ==========================================

export interface IntervalOptions {
  immediate?: boolean;
  pauseOnBlur?: boolean;
  onPause?: () => void;
  onResume?: () => void;
}

// ==========================================
// TIPOS DE TIMEOUT
// ==========================================

export interface TimeoutOptions {
  immediate?: boolean;
  onTimeout?: () => void;
  onCancel?: () => void;
}

// ==========================================
// TIPOS DE TOGGLE
// ==========================================

export interface ToggleActions {
  toggle: () => void;
  setTrue: () => void;
  setFalse: () => void;
  setValue: (value: boolean) => void;
}

// ==========================================
// TIPOS DE COUNTER
// ==========================================

export interface CounterActions {
  increment: (step?: number) => void;
  decrement: (step?: number) => void;
  reset: () => void;
  set: (value: number) => void;
}

// ==========================================
// TIPOS DE CLIPBOARD
// ==========================================

export interface CopyToClipboardResult {
  copy: (text: string) => Promise<boolean>;
  copied: boolean;
  error: Error | null;
  reset: () => void;
}