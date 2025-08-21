/**
 * @fileoverview Hooks avanzados de optimización de performance
 * @description Herramientas para mejorar el rendimiento y optimización de React
 */

import { useCallback, useEffect, useRef, useState } from 'react';

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
// Hook para lazy loading de componentes pesados
export function useLazyComponent<T>(
  importFn: () => Promise<{ default: T }>,
  delay: number = 0
) {
  const [Component, setComponent] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      const module = await importFn();
      setComponent(() => module.default);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [importFn, delay]);

  return { Component, isLoading, error, load };
}

// Hook para intersection observer (lazy loading de imágenes/componentes)
export function useIntersectionObserver(
  options?: IntersectionObserverInit
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const targetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      if (entry.isIntersecting) {
        setHasIntersected(true);
      }
    }, options);

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return { targetRef, isIntersecting, hasIntersected };
}

// Hook para optimización de renderizado con memo
export function useOptimizedState<T>(initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  
  const optimizedSetValue = useCallback((newValue: T | ((prev: T) => T)) => {
    setValue(prev => {
      const nextValue = typeof newValue === 'function' 
        ? (newValue as (prev: T) => T)(prev)
        : newValue;
      
      // Solo actualizar si el valor cambió
      if (JSON.stringify(prev) === JSON.stringify(nextValue)) {
        return prev;
      }
      
      return nextValue;
    });
  }, []);

  return [value, optimizedSetValue] as const;
}

// Hook para prefetch de datos
export function usePrefetch<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = []
) {
  const cache = useRef<T | null>(null);
  const [isPrefetching, setIsPrefetching] = useState(false);

  const prefetch = useCallback(async () => {
    if (cache.current || isPrefetching) return;
    
    setIsPrefetching(true);
    try {
      const data = await fetchFn();
      cache.current = data;
    } catch (error) {
      logger.error('Prefetch error:', error);
    } finally {
      setIsPrefetching(false);
    }
  }, [fetchFn, isPrefetching]);

  const getData = useCallback(async (): Promise<T | null> => {
    if (cache.current) {
      return cache.current;
    }
    
    try {
      const data = await fetchFn();
      cache.current = data;
      return data;
    } catch (error) {
      logger.error('Fetch error:', error);
      return null;
    }
  }, [fetchFn]);

  // Prefetch automático cuando cambian las dependencias
  useEffect(() => {
    prefetch();
  }, dependencies);

  return { prefetch, getData, isPrefetching, data: cache.current };
}

// Hook para medir el rendimiento
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;

    if (process.env.NODE_ENV === 'development') {
      logger.info(`[Performance] ${componentName}:`, {
        renderCount: renderCount.current,
        timeSinceLastRender: `${timeSinceLastRender}ms`,
        timestamp: new Date().toISOString()
      });
    }
  });

  return {
    renderCount: renderCount.current,
    measureTime: (label: string, fn: () => void) => {
      const start = performance.now();
      fn();
      const end = performance.now();
      if (process.env.NODE_ENV === 'development') {
        logger.info(`[Performance] ${componentName} - ${label}: ${(end - start).toFixed(2)}ms`);
      }
    }
  };
}

// Hook para throttle
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastRun.current >= delay) {
        lastRun.current = now;
        return callback(...args);
      }
    },
    [callback, delay]
  ) as T;
}

// Hook para detectar renders innecesarios
export function useWhyDidYouUpdate(name: string, props: Record<string, any>) {
  const previous = useRef<Record<string, any>>();

  useEffect(() => {
    if (previous.current) {
      const allKeys = Object.keys({ ...previous.current, ...props });
      const changes: Record<string, { from: any; to: any }> = {};

      allKeys.forEach(key => {
        if (previous.current![key] !== props[key]) {
          changes[key] = {
            from: previous.current![key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changes).length) {
        logger.info('[WhyDidYouUpdate]', name, changes);
      }
    }

    previous.current = props;
  });
}

// Hook para lazy loading con viewport
export function useLazyLoad<T extends HTMLElement = HTMLDivElement>(
  threshold: number = 0.1
) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const elementRef = useRef<T>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
          setHasLoaded(true);
          observer.unobserve(element);
        }
      },
      { threshold }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, hasLoaded]);

  return { elementRef, isVisible, hasLoaded };
}

// Hook para optimización de imágenes
export function useImageOptimization() {
  const [supportsWebP, setSupportsWebP] = useState<boolean | null>(null);
  const [supportsAVIF, setSupportsAVIF] = useState<boolean | null>(null);

  useEffect(() => {
    // Test WebP support
    const webpTest = new Image();
    webpTest.onload = webpTest.onerror = () => {
      setSupportsWebP(webpTest.height === 2);
    };
    webpTest.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';

    // Test AVIF support
    const avifTest = new Image();
    avifTest.onload = avifTest.onerror = () => {
      setSupportsAVIF(avifTest.height === 2);
    };
    avifTest.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  }, []);

  const getOptimalFormat = useCallback((originalSrc: string): string => {
    if (supportsAVIF) return originalSrc.replace(/\.(jpg|jpeg|png)$/, '.avif');
    if (supportsWebP) return originalSrc.replace(/\.(jpg|jpeg|png)$/, '.webp');
    return originalSrc;
  }, [supportsAVIF, supportsWebP]);

  const generateSrcSet = useCallback((baseSrc: string, sizes: number[]): string => {
    const format = supportsAVIF ? 'avif' : supportsWebP ? 'webp' : 'jpg';
    return sizes
      .map(size => `${baseSrc}-${size}w.${format} ${size}w`)
      .join(', ');
  }, [supportsAVIF, supportsWebP]);

  return {
    supportsWebP,
    supportsAVIF,
    getOptimalFormat,
    generateSrcSet,
    isReady: supportsWebP !== null && supportsAVIF !== null
  };
}