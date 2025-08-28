/**
 * @altamedica/utils
 * Utilidades compartidas para toda la plataforma AltaMedica
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
// ==========================================
// UTILIDADES DE ESTILO (TAILWIND)
// ==========================================

/**
 * Combina clases de Tailwind CSS de manera inteligente
 * Usa clsx para condicionales y twMerge para resolver conflictos
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Versi�n simple de cn sin dependencias (para casos b�sicos)
 */
export function classNames(...classes: (string | undefined | null | false | 0)[]) {
  return classes.filter(Boolean).join(' ');
}

// ==========================================
// FORMATEO DE FECHAS Y TIEMPO
// ==========================================

export type DateFormat = 'full' | 'short' | 'medium' | 'relative' | 'time' | 'datetime';

/**
 * Formatea una fecha seg�n el formato especificado
 */
export function formatDate(
  date: Date | string | number,
  format: DateFormat = 'full',
  locale: string = 'es-MX',
): string {
  const dateObj = date instanceof Date ? date : new Date(date);

  // Validar fecha
  if (isNaN(dateObj.getTime())) {
    return 'Fecha inv�lida';
  }

  switch (format) {
    case 'relative':
      return getRelativeTime(dateObj);

    case 'short':
      return dateObj.toLocaleDateString(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

    case 'medium':
      return dateObj.toLocaleDateString(locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

    case 'time':
      return dateObj.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
      });

    case 'datetime':
      return dateObj.toLocaleString(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

    case 'full':
    default:
      return dateObj.toLocaleDateString(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
  }
}

/**
 * Obtiene tiempo relativo (hace X minutos/horas/d�as)
 */
export function getRelativeTime(date: Date | string | number): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  // Futuro
  if (diffInSeconds < 0) {
    const absDiff = Math.abs(diffInSeconds);
    if (absDiff < 60) return 'En unos momentos';
    if (absDiff < 3600) return `En ${Math.floor(absDiff / 60)} minutos`;
    if (absDiff < 86400) return `En ${Math.floor(absDiff / 3600)} horas`;
    if (absDiff < 2592000) return `En ${Math.floor(absDiff / 86400)} d�as`;
    return formatDate(dateObj, 'short');
  }

  // Pasado
  if (diffInSeconds < 60) return 'Hace un momento';
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `Hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  }
  if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `Hace ${days} ${days === 1 ? 'd�a' : 'd�as'}`;
  }

  return formatDate(dateObj, 'short');
}

/**
 * Formatea tiempo de duraci�n (ej: 1h 30min)
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}min`;
}

// ==========================================
// FORMATEO DE N�MEROS Y MONEDA
// ==========================================

/**
 * Formatea un n�mero como moneda
 */
export function formatCurrency(
  amount: number,
  currency: string = 'MXN',
  locale: string = 'es-MX',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formatea un n�mero con separadores de miles
 */
export function formatNumber(
  number: number,
  decimals: number = 0,
  locale: string = 'es-MX',
): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
}

/**
 * Formatea un porcentaje
 */
export function formatPercent(
  value: number,
  decimals: number = 0,
  locale: string = 'es-MX',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

// ==========================================
// FORMATEO DE DATOS PERSONALES
// ==========================================

/**
 * Formatea un n�mero de tel�fono
 */
export function formatPhone(phone: string): string {
  // Remover caracteres no num�ricos
  const cleaned = phone.replace(/\D/g, '');

  // Formato mexicano (10 d�gitos)
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  // Formato con c�digo de pa�s
  if (cleaned.length === 12 && cleaned.startsWith('52')) {
    return `+52 (${cleaned.slice(2, 5)}) ${cleaned.slice(5, 8)}-${cleaned.slice(8)}`;
  }

  // Retornar original si no coincide
  return phone;
}

/**
 * Calcula la edad a partir de la fecha de nacimiento
 */
export function calculateAge(birthDate: Date | string): number {
  const birth = birthDate instanceof Date ? birthDate : new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * Obtiene las iniciales de un nombre
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Capitaliza la primera letra de cada palabra
 */
export function capitalize(str: string): string {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

// ==========================================
// VALIDACIONES
// ==========================================

/**
 * Valida un email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida un n�mero de tel�fono mexicano
 */
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || (cleaned.length === 12 && cleaned.startsWith('52'));
}

/**
 * Valida un RFC mexicano
 */
export function isValidRFC(rfc: string): boolean {
  const rfcRegex = /^[A-Z�&]{3,4}\d{6}[A-Z0-9]{3}$/;
  return rfcRegex.test(rfc.toUpperCase());
}

/**
 * Valida un CURP mexicano
 */
export function isValidCURP(curp: string): boolean {
  const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
  return curpRegex.test(curp.toUpperCase());
}

// ==========================================
// UTILIDADES DE RENDIMIENTO
// ==========================================

/**
 * Debounce - Retrasa la ejecuci�n de una funci�n
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle - Limita la frecuencia de ejecuci�n
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// ==========================================
// UTILIDADES DE STRINGS
// ==========================================

/**
 * Trunca un texto agregando elipsis
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

/**
 * Genera un slug a partir de un texto
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Genera un ID �nico
 */
export function generateId(prefix?: string): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substr(2, 9);
  return prefix ? `${prefix}_${timestamp}_${randomStr}` : `${timestamp}_${randomStr}`;
}

// ==========================================
// UTILIDADES DE ARRAYS Y OBJETOS
// ==========================================

/**
 * Agrupa elementos de un array por una propiedad
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
    (result, item) => {
      const group = String(item[key]);
      if (!result[group]) result[group] = [];
      result[group].push(item);
      return result;
    },
    {} as Record<string, T[]>,
  );
}

/**
 * Ordena un array de objetos por una propiedad
 */
export function sortBy<T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    if (a[key] < b[key]) return order === 'asc' ? -1 : 1;
    if (a[key] > b[key]) return order === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Elimina duplicados de un array
 */
export function unique<T>(array: T[]): T[] {
  return [...new Set(array)];
}

/**
 * Filtra valores null y undefined de un objeto
 */
export function filterNullish<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== null && value !== undefined) {
      (acc as Record<string, unknown>)[key] = value;
    }
    return acc;
  }, {} as Partial<T>);
}

// ==========================================
// UTILIDADES DE URL Y NAVEGACI�N
// ==========================================

/**
 * Construye una URL con query params
 */
export function buildUrl(base: string, params: Record<string, unknown>): string {
  const url = new URL(base, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.append(key, String(value));
    }
  });
  return url.toString();
}

/**
 * Extrae query params de una URL
 */
export function parseQueryParams(url: string): Record<string, string> {
  const urlObj = new URL(url, window.location.origin);
  const params: Record<string, string> = {};
  urlObj.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}

// ==========================================
// UTILIDADES DE ALMACENAMIENTO
// ==========================================

/**
 * Guarda en localStorage con manejo de errores
 */
export function saveToStorage<T>(key: string, value: T): boolean {
  try {
    if (typeof window === 'undefined') return false;
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // logger.error('Error saving to localStorage:', error); // Temporarily commented out
    return false;
  }
}

/**
 * Lee de localStorage con manejo de errores
 */
export function getFromStorage<T>(key: string, defaultValue?: T): T | undefined {
  try {
    if (typeof window === 'undefined') return defaultValue;
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    // logger.error('Error reading from localStorage:', error); // Temporarily commented out
    return defaultValue;
  }
}

/**
 * Elimina de localStorage
 */
export function removeFromStorage(key: string): boolean {
  try {
    if (typeof window === 'undefined') return false;
    localStorage.removeItem(key);
    return true;
  } catch {
    // logger.error('Error removing from localStorage:', error); // Temporarily commented out
    return false;
  }
}

// ==========================================
// UTILIDADES DE DESARROLLO
// ==========================================

export * from './dev';
export * from './rate-limiter';

// ==========================================
// SERVICIOS DE COOKIES SEGURAS
// ==========================================

export * from './secure-cookies';

// ==========================================
// ALMACENAMIENTO SEGURO (ENCRIPTACIÓN)
// ==========================================

export * from './secure-storage';

// ==========================================
// EXPORTACIONES DE TIPOS
// ==========================================

export type { ClassValue } from 'clsx';
