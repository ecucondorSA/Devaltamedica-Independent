/**
 * @fileoverview Hook useMediaQuery consolidado y mejorado
 * @module @altamedica/hooks/utils/useMediaQuery
 * @description Hooks completos para media queries y responsive design
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

// Simple logger implementation to avoid circular dependencies
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
// TIPOS Y INTERFACES
// ==========================================

export interface MediaQueryOptions {
  /**
   * Valor por defecto cuando no hay match
   * @default false
   */
  defaultValue?: boolean;
  /**
   * Si debe usar server-side rendering safe (siempre false inicialmente)
   * @default false
   */
  ssrSafe?: boolean;
  /**
   * Callback cuando cambie el estado
   */
  onChange?: (matches: boolean) => void;
}

export interface ViewportSize {
  width: number;
  height: number;
}

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isPortrait: boolean;
  isLandscape: boolean;
  supportsHover: boolean;
  supportsTouch: boolean;
  prefersReducedMotion: boolean;
  prefersDarkMode: boolean;
  prefersLightMode: boolean;
  viewportSize: ViewportSize;
  screenSize: ViewportSize;
  breakpoint: Breakpoint;
  devicePixelRatio: number;
}

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'unknown';

export interface ResponsiveValue<T> {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
}

// ==========================================
// CONSTANTES DE BREAKPOINTS
// ==========================================

export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const;

export const MEDIA_QUERIES = {
  xs: `(min-width: ${BREAKPOINTS.xs}px)`,
  sm: `(min-width: ${BREAKPOINTS.sm}px)`,
  md: `(min-width: ${BREAKPOINTS.md}px)`,
  lg: `(min-width: ${BREAKPOINTS.lg}px)`,
  xl: `(min-width: ${BREAKPOINTS.xl}px)`,
  '2xl': `(min-width: ${BREAKPOINTS['2xl']}px)`,
  
  // Solo rangos
  'xs-only': `(max-width: ${BREAKPOINTS.sm - 1}px)`,
  'sm-only': `(min-width: ${BREAKPOINTS.sm}px) and (max-width: ${BREAKPOINTS.md - 1}px)`,
  'md-only': `(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`,
  'lg-only': `(min-width: ${BREAKPOINTS.lg}px) and (max-width: ${BREAKPOINTS.xl - 1}px)`,
  'xl-only': `(min-width: ${BREAKPOINTS.xl}px) and (max-width: ${BREAKPOINTS['2xl'] - 1}px)`,
  '2xl-only': `(min-width: ${BREAKPOINTS['2xl']}px)`,

  // Orientación
  portrait: '(orientation: portrait)',
  landscape: '(orientation: landscape)',

  // Características del dispositivo
  hover: '(hover: hover)',
  touch: '(pointer: coarse)',
  'reduced-motion': '(prefers-reduced-motion: reduce)',
  'dark-mode': '(prefers-color-scheme: dark)',
  'light-mode': '(prefers-color-scheme: light)',
  'high-contrast': '(prefers-contrast: high)',
  'high-dpi': '(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)',

  // Print
  print: 'print',
  screen: 'screen'
} as const;

// ==========================================
// UTILIDADES
// ==========================================

/**
 * Verifica si estamos en el servidor
 */
const isServer = typeof window === 'undefined';

/**
 * Obtiene el valor inicial seguro para SSR
 */
function getInitialValue(query: string, defaultValue: boolean, ssrSafe: boolean): boolean {
  if (isServer || ssrSafe) {
    return defaultValue;
  }

  try {
    return window.matchMedia(query).matches;
  } catch {
    return defaultValue;
  }
}

// ==========================================
// HOOK PRINCIPAL DE MEDIA QUERY
// ==========================================

/**
 * Hook principal para media queries
 * @param query - Query CSS de media
 * @param options - Opciones de configuración
 * @returns true si la media query coincide
 * 
 * @example
 * ```tsx
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isDark = useMediaQuery('(prefers-color-scheme: dark)', {
 *   onChange: (matches) => logger.info('Dark mode:', matches)
 * });
 * ```
 */
export function useMediaQuery(
  query: string,
  options: MediaQueryOptions = {}
): boolean {
  const { defaultValue = false, ssrSafe = false, onChange } = options;

  const [matches, setMatches] = useState(() => 
    getInitialValue(query, defaultValue, ssrSafe)
  );

  useEffect(() => {
    if (isServer) return;

    let mediaQueryList: MediaQueryList;
    
    try {
      mediaQueryList = window.matchMedia(query);
    } catch (error) {
      logger.warn(`Invalid media query: ${query}`, error);
      return;
    }

    // Función para actualizar el estado
    const updateMatch = (event: MediaQueryListEvent) => {
      const newMatches = event.matches;
      setMatches(newMatches);
      onChange?.(newMatches);
    };

    // Establecer valor inicial si es diferente
    if (mediaQueryList.matches !== matches) {
      setMatches(mediaQueryList.matches);
      onChange?.(mediaQueryList.matches);
    }

    // Escuchar cambios
    mediaQueryList.addEventListener('change', updateMatch);

    return () => {
      mediaQueryList.removeEventListener('change', updateMatch);
    };
  }, [query, matches, onChange]);

  return matches;
}

// ==========================================
// HOOKS DE BREAKPOINTS PREDEFINIDOS
// ==========================================

/**
 * Hook para detectar dispositivos móviles (xs)
 */
export const useIsMobile = (options?: MediaQueryOptions) => 
  useMediaQuery(MEDIA_QUERIES['xs-only'], options);

/**
 * Hook para detectar tablets pequeños (sm)
 */
export const useIsSmall = (options?: MediaQueryOptions) => 
  useMediaQuery(MEDIA_QUERIES.sm, options);

/**
 * Hook para detectar tablets (md)
 */
export const useIsTablet = (options?: MediaQueryOptions) => 
  useMediaQuery(MEDIA_QUERIES.md, options);

/**
 * Hook para detectar desktop (lg)
 */
export const useIsDesktop = (options?: MediaQueryOptions) => 
  useMediaQuery(MEDIA_QUERIES.lg, options);

/**
 * Hook para detectar desktop grande (xl)
 */
export const useIsLargeDesktop = (options?: MediaQueryOptions) => 
  useMediaQuery(MEDIA_QUERIES.xl, options);

/**
 * Hook para detectar desktop extra grande (2xl)
 */
export const useIsExtraLargeDesktop = (options?: MediaQueryOptions) => 
  useMediaQuery(MEDIA_QUERIES['2xl'], options);

// ==========================================
// HOOKS DE ORIENTACIÓN
// ==========================================

/**
 * Hook para detectar orientación portrait
 */
export const useIsPortrait = (options?: MediaQueryOptions) => 
  useMediaQuery(MEDIA_QUERIES.portrait, options);

/**
 * Hook para detectar orientación landscape
 */
export const useIsLandscape = (options?: MediaQueryOptions) => 
  useMediaQuery(MEDIA_QUERIES.landscape, options);

// ==========================================
// HOOKS DE CARACTERÍSTICAS DEL DISPOSITIVO
// ==========================================

/**
 * Hook para detectar soporte de hover (mouse)
 */
export const useSupportsHover = (options?: MediaQueryOptions) => 
  useMediaQuery(MEDIA_QUERIES.hover, options);

/**
 * Hook para detectar dispositivos táctiles
 */
export const useSupportsTouch = (options?: MediaQueryOptions) => 
  useMediaQuery(MEDIA_QUERIES.touch, options);

/**
 * Hook para detectar preferencia de movimiento reducido
 */
export const usePrefersReducedMotion = (options?: MediaQueryOptions) => 
  useMediaQuery(MEDIA_QUERIES['reduced-motion'], options);

/**
 * Hook para detectar preferencia de modo oscuro
 */
export const usePrefersDarkMode = (options?: MediaQueryOptions) => 
  useMediaQuery(MEDIA_QUERIES['dark-mode'], options);

/**
 * Hook para detectar preferencia de modo claro
 */
export const usePrefersLightMode = (options?: MediaQueryOptions) => 
  useMediaQuery(MEDIA_QUERIES['light-mode'], options);

/**
 * Hook para detectar alto contraste
 */
export const usePrefersHighContrast = (options?: MediaQueryOptions) => 
  useMediaQuery(MEDIA_QUERIES['high-contrast'], options);

/**
 * Hook para detectar alta densidad de píxeles (Retina)
 */
export const useIsHighDPI = (options?: MediaQueryOptions) => 
  useMediaQuery(MEDIA_QUERIES['high-dpi'], options);

/**
 * Hook para detectar impresión
 */
export const useIsPrint = (options?: MediaQueryOptions) => 
  useMediaQuery(MEDIA_QUERIES.print, options);

// ==========================================
// HOOK DE BREAKPOINT ACTUAL
// ==========================================

/**
 * Hook que retorna el breakpoint actual
 * @param options - Opciones de configuración
 * @returns Breakpoint actual
 * 
 * @example
 * ```tsx
 * const breakpoint = useBreakpoint();
 * const columns = breakpoint === 'xs' ? 1 : breakpoint === 'md' ? 2 : 3;
 * ```
 */
export function useBreakpoint(options?: MediaQueryOptions): Breakpoint {
  const is2xl = useIsExtraLargeDesktop(options);
  const isXl = useIsLargeDesktop(options);
  const isLg = useIsDesktop(options);
  const isMd = useIsTablet(options);
  const isSm = useIsSmall(options);

  return useMemo(() => {
    if (is2xl) return '2xl';
    if (isXl) return 'xl';
    if (isLg) return 'lg';
    if (isMd) return 'md';
    if (isSm) return 'sm';
    return 'xs';
  }, [is2xl, isXl, isLg, isMd, isSm]);
}

// ==========================================
// HOOK DE TAMAÑO DE VIEWPORT
// ==========================================

/**
 * Hook que retorna el tamaño actual del viewport
 * @param options - Opciones de configuración
 * @returns Objeto con width y height
 * 
 * @example
 * ```tsx
 * const { width, height } = useViewportSize();
 * const isNarrow = width < 400;
 * ```
 */
export function useViewportSize(options?: { ssrSafe?: boolean }): ViewportSize {
  const { ssrSafe = false } = options || {};
  
  const [size, setSize] = useState<ViewportSize>(() => {
    if (isServer || ssrSafe) {
      return { width: 0, height: 0 };
    }
    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  });

  useEffect(() => {
    if (isServer) return;

    const updateSize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    // Establecer valor inicial si SSR safe estaba activo
    if (ssrSafe) {
      updateSize();
    }

    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [ssrSafe]);

  return size;
}

/**
 * Hook que retorna el tamaño de la pantalla física
 * @param options - Opciones de configuración
 * @returns Objeto con width y height de la pantalla
 */
export function useScreenSize(options?: { ssrSafe?: boolean }): ViewportSize {
  const { ssrSafe = false } = options || {};
  
  const [size, setSize] = useState<ViewportSize>(() => {
    if (isServer || ssrSafe) {
      return { width: 0, height: 0 };
    }
    return {
      width: window.screen.width,
      height: window.screen.height
    };
  });

  useEffect(() => {
    if (isServer) return;

    const updateSize = () => {
      setSize({
        width: window.screen.width,
        height: window.screen.height
      });
    };

    if (ssrSafe) {
      updateSize();
    }

    // La pantalla física no cambia, pero por consistencia con viewport
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [ssrSafe]);

  return size;
}

// ==========================================
// HOOK DE INFORMACIÓN COMPLETA DEL DISPOSITIVO
// ==========================================

/**
 * Hook que retorna información completa del dispositivo
 * @param options - Opciones de configuración
 * @returns Objeto con toda la información del dispositivo
 * 
 * @example
 * ```tsx
 * const device = useDeviceInfo();
 * if (device.isMobile && device.supportsTouch) {
 *   // Mostrar interfaz táctil optimizada
 * }
 * ```
 */
export function useDeviceInfo(options?: MediaQueryOptions): DeviceInfo {
  const isMobile = useIsMobile(options);
  const isTablet = useIsTablet(options);
  const isDesktop = useIsDesktop(options);
  const isPortrait = useIsPortrait(options);
  const isLandscape = useIsLandscape(options);
  const supportsHover = useSupportsHover(options);
  const supportsTouch = useSupportsTouch(options);
  const prefersReducedMotion = usePrefersReducedMotion(options);
  const prefersDarkMode = usePrefersDarkMode(options);
  const prefersLightMode = usePrefersLightMode(options);
  const breakpoint = useBreakpoint(options);
  const viewportSize = useViewportSize({ ssrSafe: options?.ssrSafe });
  const screenSize = useScreenSize({ ssrSafe: options?.ssrSafe });

  const [devicePixelRatio, setDevicePixelRatio] = useState(() => {
    if (isServer || options?.ssrSafe) return 1;
    return window.devicePixelRatio || 1;
  });

  useEffect(() => {
    if (isServer) return;

    const updatePixelRatio = () => {
      setDevicePixelRatio(window.devicePixelRatio || 1);
    };

    if (options?.ssrSafe) {
      updatePixelRatio();
    }

    // Escuchar cambios en la densidad de píxeles
    const mediaQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    mediaQuery.addEventListener('change', updatePixelRatio);

    return () => {
      mediaQuery.removeEventListener('change', updatePixelRatio);
    };
  }, [options?.ssrSafe]);

  return useMemo(() => ({
    isMobile,
    isTablet,
    isDesktop,
    isPortrait,
    isLandscape,
    supportsHover,
    supportsTouch,
    prefersReducedMotion,
    prefersDarkMode,
    prefersLightMode,
    breakpoint,
    viewportSize,
    screenSize,
    devicePixelRatio
  }), [
    isMobile, isTablet, isDesktop, isPortrait, isLandscape,
    supportsHover, supportsTouch, prefersReducedMotion, prefersDarkMode, prefersLightMode,
    breakpoint, viewportSize, screenSize, devicePixelRatio
  ]);
}

// ==========================================
// HOOK DE VALORES RESPONSIVOS
// ==========================================

/**
 * Hook para valores responsivos basados en breakpoints
 * @template T - Tipo del valor
 * @param values - Objeto con valores por breakpoint
 * @param defaultValue - Valor por defecto
 * @returns Valor correspondiente al breakpoint actual
 * 
 * @example
 * ```tsx
 * const columns = useResponsiveValue({
 *   xs: 1,
 *   md: 2,
 *   lg: 3,
 *   xl: 4
 * }, 1);
 * ```
 */
export function useResponsiveValue<T>(
  values: ResponsiveValue<T>,
  defaultValue: T
): T {
  const breakpoint = useBreakpoint();

  return useMemo(() => {
    // Orden de prioridad: actual -> inferior más cercano -> default
    switch (breakpoint) {
      case '2xl':
        return values['2xl'] ?? values.xl ?? values.lg ?? values.md ?? values.sm ?? values.xs ?? defaultValue;
      case 'xl':
        return values.xl ?? values.lg ?? values.md ?? values.sm ?? values.xs ?? defaultValue;
      case 'lg':
        return values.lg ?? values.md ?? values.sm ?? values.xs ?? defaultValue;
      case 'md':
        return values.md ?? values.sm ?? values.xs ?? defaultValue;
      case 'sm':
        return values.sm ?? values.xs ?? defaultValue;
      case 'xs':
        return values.xs ?? defaultValue;
      default:
        return defaultValue;
    }
  }, [values, defaultValue, breakpoint]);
}

// ==========================================
// HOOK DE LAYOUT RESPONSIVO
// ==========================================

/**
 * Hook que retorna configuraciones de layout responsivo
 * @returns Objeto con configuraciones de layout
 * 
 * @example
 * ```tsx
 * const layout = useResponsiveLayout();
 * return (
 *   <div style={{ 
 *     columns: layout.columns,
 *     gap: layout.spacing,
 *     maxWidth: layout.maxWidth 
 *   }}>
 *     {content}
 *   </div>
 * );
 * ```
 */
export function useResponsiveLayout() {
  const breakpoint = useBreakpoint();
  const { isMobile, isTablet, isDesktop } = useDeviceInfo();

  return useMemo(() => ({
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    columns: useResponsiveValue({
      xs: 1,
      sm: 1,
      md: 2,
      lg: 3,
      xl: 4,
      '2xl': 4
    }, 1),
    spacing: useResponsiveValue({
      xs: 8,
      sm: 12,
      md: 16,
      lg: 20,
      xl: 24,
      '2xl': 28
    }, 16),
    maxWidth: useResponsiveValue({
      xs: '100%',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px'
    }, '100%'),
    containerPadding: useResponsiveValue({
      xs: 16,
      sm: 20,
      md: 24,
      lg: 32,
      xl: 40,
      '2xl': 48
    }, 16)
  }), [breakpoint, isMobile, isTablet, isDesktop]);
}

// ==========================================
// HOOKS MÉDICOS ESPECIALIZADOS
// ==========================================

/**
 * Hook para detectar si es un dispositivo médico (tablet grande o desktop)
 * Útil para interfaces médicas que requieren más espacio
 */
export function useIsMedicalDevice(): boolean {
  const isLargeTablet = useMediaQuery('(min-width: 768px)');
  const hasHover = useSupportsHover();
  
  return isLargeTablet && hasHover;
}

/**
 * Hook para layout optimizado para consultas médicas
 * Retorna configuraciones específicas para interfaces médicas
 */
export function useMedicalLayout() {
  const isMedicalDevice = useIsMedicalDevice();
  const breakpoint = useBreakpoint();
  
  return useMemo(() => ({
    isMedicalDevice,
    breakpoint,
    sidebarWidth: useResponsiveValue({
      xs: 0,
      md: 280,
      lg: 320,
      xl: 360
    }, 280),
    contentPadding: useResponsiveValue({
      xs: 16,
      md: 24,
      lg: 32,
      xl: 40
    }, 24),
    cardSpacing: useResponsiveValue({
      xs: 12,
      md: 16,
      lg: 20,
      xl: 24
    }, 16),
    showFullFeatures: isMedicalDevice
  }), [isMedicalDevice, breakpoint]);
}