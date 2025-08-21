/**
 * RedirectManager - Sistema avanzado de manejo de redirecciones SSO
 * 
 * CARACTERÍSTICAS:
 * - Previene loops infinitos de redirección
 * - Manejo robusto de parámetros URL
 * - Timeouts y fallbacks automáticos
 * - Validación de URLs permitidas
 * - Logging detallado para debugging
 * - Compatibilidad con Next.js 15 App Router
 */

'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

// Simple logger implementation to avoid circular dependencies
const logger = {
  warn: (message: string, data?: any) => {
    if (typeof console !== 'undefined') {
      console.warn(message, data);
    }
  },
  error: (message: string, data?: any) => {
    if (typeof console !== 'undefined') {
      console.error(message, data);
    }
  },
  info: (message: string, data?: any) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.log(message, data);
    }
  }
};
interface RedirectOptions {
  timeout?: number; // Timeout en ms (default: 10000)
  maxRetries?: number; // Máximo reintentos (default: 3)
  fallbackUrl?: string; // URL de fallback
  validateUrl?: boolean; // Validar URL de destino (default: true)
  preserveQuery?: boolean; // Preservar query params (default: true)
  logLevel?: 'none' | 'basic' | 'detailed'; // Nivel de logging
}

interface RedirectState {
  isRedirecting: boolean;
  redirectUrl: string | null;
  error: string | null;
  attemptCount: number;
  timeoutId: NodeJS.Timeout | null;
}

const ALLOWED_DOMAINS = ['localhost'];
const ALLOWED_PORTS = ['3000', '3001', '3002', '3003', '3004', '3005'];
const DEFAULT_TIMEOUT = 10000; // 10 segundos
const DEFAULT_MAX_RETRIES = 3;

// Helper para verificar si estamos en el cliente
const isClient = () => typeof globalThis !== 'undefined' && typeof globalThis.window !== 'undefined';

export class RedirectManager {
  private static instance: RedirectManager;
  private redirectHistory: string[] = [];
  private activeRedirects: Set<string> = new Set();
  
  static getInstance(): RedirectManager {
    if (!RedirectManager.instance) {
      RedirectManager.instance = new RedirectManager();
    }
    return RedirectManager.instance;
  }

  /**
   * Parsea y valida URL de redirección desde parámetros
   */
  parseRedirectUrl(searchParams: URLSearchParams | string): string | null {
    try {
      const params = typeof searchParams === 'string' 
        ? new URLSearchParams(searchParams)
        : searchParams;
      
      const redirectParam = params.get('redirect');
      const role = params.get('role');
      
      if (!redirectParam) {
        logger.info('🔍 [RedirectManager] No redirect parameter found');
        return null;
      }

      // Decodificar URL
      const decodedUrl = decodeURIComponent(redirectParam);
      logger.info('🔗 [RedirectManager] Parsed redirect URL:', decodedUrl);
      
      // Validar formato
      if (!this.isValidRedirectUrl(decodedUrl)) {
        logger.error('❌ [RedirectManager] Invalid redirect URL:', decodedUrl);
        return null;
      }

      // Si hay role, añadirlo a la URL si no está presente
      if (role && !decodedUrl.includes('role=')) {
        const separator = decodedUrl.includes('?') ? '&' : '?';
        return `${decodedUrl}${separator}role=${role}`;
      }

      return decodedUrl;
    } catch (error) {
      logger.error('❌ [RedirectManager] Error parsing redirect URL:', error);
      return null;
    }
  }

  /**
   * Valida si una URL es permitida para redirección
   */
  isValidRedirectUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      
      // Verificar dominio
      if (!ALLOWED_DOMAINS.includes(urlObj.hostname)) {
        logger.warn('⚠️ [RedirectManager] Domain not allowed:', urlObj.hostname);
        return false;
      }

      // Verificar puerto
      if (urlObj.port && !ALLOWED_PORTS.includes(urlObj.port)) {
        logger.warn('⚠️ [RedirectManager] Port not allowed:', urlObj.port);
        return false;
      }

      // Verificar protocolo
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        logger.warn('⚠️ [RedirectManager] Protocol not allowed:', urlObj.protocol);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('❌ [RedirectManager] Invalid URL format:', url, error);
      return false;
    }
  }

  /**
   * Detecta si estamos en un loop de redirección
   */
  isRedirectLoop(url: string): boolean {
    const recentRedirects = this.redirectHistory.slice(-5);
    const occurrences = recentRedirects.filter(r => r === url).length;
    
    if (occurrences >= 2) {
      logger.error('🔄 [RedirectManager] Redirect loop detected for:', url);
      return true;
    }
    
    return false;
  }

  /**
   * Registra un intento de redirección
   */
  private recordRedirect(url: string): void {
    this.redirectHistory.push(url);
    // Mantener solo los últimos 10 redirects
    if (this.redirectHistory.length > 10) {
      this.redirectHistory = this.redirectHistory.slice(-10);
    }
  }

  /**
   * Ejecuta redirección con validaciones y timeouts
   */
  async performRedirect(
    url: string, 
    options: RedirectOptions = {}
  ): Promise<void> {
    // Verificar si estamos en el cliente
    if (typeof window === 'undefined') {
      logger.warn('⚠️ [RedirectManager] Cannot redirect on server side');
      return;
    }

    const {
      timeout = DEFAULT_TIMEOUT,
      maxRetries = DEFAULT_MAX_RETRIES,
      fallbackUrl = '/dashboard',
      validateUrl = true,
      logLevel = 'detailed'
    } = options;

    if (logLevel !== 'none') {
      logger.info('🚀 [RedirectManager] Starting redirect to:', url);
    }

    // Verificar si ya hay redirección activa para esta URL
    if (this.activeRedirects.has(url)) {
      logger.warn('⚠️ [RedirectManager] Redirect already in progress for:', url);
      return;
    }

    // Verificar loop de redirección
    if (this.isRedirectLoop(url)) {
      logger.error('🔄 [RedirectManager] Redirect loop detected, using fallback');
      window.location.href = fallbackUrl;
      return;
    }

    // Validar URL si está habilitado
    if (validateUrl && !this.isValidRedirectUrl(url)) {
      logger.error('❌ [RedirectManager] URL validation failed, using fallback');
      window.location.href = fallbackUrl;
      return;
    }

    // Marcar como activa
    this.activeRedirects.add(url);
    this.recordRedirect(url);

    try {
      // Configurar timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Redirect timeout'));
        }, timeout);
      });

      // Ejecutar redirección
      const redirectPromise = new Promise<void>((resolve) => {
        if (logLevel === 'detailed') {
          logger.info('🔗 [RedirectManager] Executing redirect...');
        }
        
        // Para URLs externas (diferentes puertos), usar location.replace
        if (this.isExternalRedirect(url)) {
          window.location.replace(url);
        } else {
          window.location.href = url;
        }
        
        resolve();
      });

      // Esperar redirección o timeout
      await Promise.race([redirectPromise, timeoutPromise]);

    } catch (error) {
      logger.error('❌ [RedirectManager] Redirect failed:', error);
      
      // Si es timeout, usar fallback
      if (error instanceof Error && error.message === 'Redirect timeout') {
        logger.info('⏰ [RedirectManager] Redirect timeout, using fallback');
        window.location.href = fallbackUrl;
      }
    } finally {
      // Limpiar estado
      this.activeRedirects.delete(url);
    }
  }

  /**
   * Determina si es redirección externa (diferente puerto)
   */
  private isExternalRedirect(url: string): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    
    try {
      const urlObj = new URL(url);
      const currentPort = window.location.port || '80';
      return urlObj.port !== currentPort && urlObj.hostname === window.location.hostname;
    } catch {
      return false;
    }
  }

  /**
   * Genera URL de redirección basada en rol de usuario
   */
  generateRoleBasedUrl(role: string, baseUrl?: string): string {
    const urlMap = {
      'patient': 'http://localhost:3003',
      'doctor': 'http://localhost:3002',
      'company': 'http://localhost:3004',
      'admin': 'http://localhost:3005',
      'default': baseUrl || 'http://localhost:3000'
    };

    const targetUrl = urlMap[role as keyof typeof urlMap] || urlMap.default;
    
    logger.info(`🎭 [RedirectManager] Generated URL for role ${role}:`, targetUrl);
    return targetUrl;
  }

  /**
   * Limpia el historial de redirecciones
   */
  clearHistory(): void {
    this.redirectHistory = [];
    this.activeRedirects.clear();
    logger.info('🧹 [RedirectManager] History cleared');
  }
}

/**
 * Hook de React para manejar redirecciones de manera reactiva
 */
export function useRedirectManager(options: RedirectOptions = {}) {
  const [state, setState] = useState<RedirectState>({
    isRedirecting: false,
    redirectUrl: null,
    error: null,
    attemptCount: 0,
    timeoutId: null
  });

  const manager = RedirectManager.getInstance();
  const router = useRouter();

  const performRedirect = useCallback(async (url: string) => {
    setState(prev => ({
      ...prev,
      isRedirecting: true,
      redirectUrl: url,
      error: null,
      attemptCount: prev.attemptCount + 1
    }));

    try {
      await manager.performRedirect(url, options);
    } catch (error) {
      setState(prev => ({
        ...prev,
        isRedirecting: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, [manager, options]);

  const parseAndRedirect = useCallback((searchParams: URLSearchParams | string) => {
    const redirectUrl = manager.parseRedirectUrl(searchParams);
    if (redirectUrl) {
      performRedirect(redirectUrl);
    }
    return redirectUrl;
  }, [manager, performRedirect]);

  const clearState = useCallback(() => {
    if (state.timeoutId) {
      clearTimeout(state.timeoutId);
    }
    setState({
      isRedirecting: false,
      redirectUrl: null,
      error: null,
      attemptCount: 0,
      timeoutId: null
    });
  }, [state.timeoutId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.timeoutId) {
        clearTimeout(state.timeoutId);
      }
    };
  }, [state.timeoutId]);

  return {
    ...state,
    performRedirect,
    parseAndRedirect,
    clearState,
    manager
  };
}

export default RedirectManager;
