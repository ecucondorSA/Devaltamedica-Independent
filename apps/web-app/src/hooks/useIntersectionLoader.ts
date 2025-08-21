'use client';

import { useEffect, useRef, useState } from 'react';

import { logger } from '@altamedica/shared/services/logger.service';
interface UseIntersectionLoaderOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

/**
 * 🚀 PERFORMANCE HOOK - Intersection Observer para Lazy Loading
 * Carga componentes solo cuando son visibles o están por serlo
 */
export function useIntersectionLoader(options: UseIntersectionLoaderOptions = {}) {
  const {
    threshold = 0.1,
    rootMargin = '200px', // Comenzar a cargar 200px antes
    triggerOnce = true
  } = options;
  
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || shouldLoad) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting;
        
        setIsVisible(isIntersecting);
        
        if (isIntersecting) {
          setShouldLoad(true);
          
          if (triggerOnce) {
            observer.disconnect();
          }
        }
      },
      { 
        threshold,
        rootMargin
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce, shouldLoad]);

  return { 
    ref, 
    shouldLoad, 
    isVisible,
    // Helper para reset manual si es necesario
    reset: () => setShouldLoad(false)
  };
}

/**
 * 🎯 SMART LOADER - Hook para carga inteligente con múltiples estrategias
 */
export function useSmartLoader(priority: 'high' | 'medium' | 'low' = 'medium') {
  const [shouldLoad, setShouldLoad] = useState(priority === 'high');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shouldLoad) return;

    const strategies = {
      high: 0, // Carga inmediata
      medium: 100, // Carga después de 100ms
      low: 500 // Carga después de 500ms
    };

    const delay = strategies[priority];

    if (delay === 0) {
      setShouldLoad(true);
      return;
    }

    // Combinar timeout con intersection observer
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            observer.disconnect();
          }
        },
        { 
          threshold: 0.1,
          rootMargin: priority === 'low' ? '50px' : '200px'
        }
      );

      if (ref.current) {
        observer.observe(ref.current);
      }

      // Cleanup después de 10 segundos máximo
      setTimeout(() => observer.disconnect(), 10000);
    }, delay);

    return () => clearTimeout(timer);
  }, [priority, shouldLoad]);

  return { ref, shouldLoad };
}

/**
 * 📊 PERFORMANCE OBSERVER - Hook para monitorear métricas de carga
 */
export function usePerformanceMonitor(componentName: string) {
  const startTime = useRef<number>(Date.now());
  const [loadTime, setLoadTime] = useState<number | null>(null);

  const markAsLoaded = () => {
    const endTime = Date.now();
    const duration = endTime - startTime.current;
    setLoadTime(duration);
    
    // Log solo en development
    if (process.env.NODE_ENV === 'development') {
      logger.info(`⏱️ ${componentName} loaded in ${duration}ms`);
    }
  };

  return { loadTime, markAsLoaded };
}