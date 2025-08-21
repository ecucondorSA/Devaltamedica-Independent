/**
 * Utilidades de rendimiento para AltaMedica Companies
 * Implementa las nuevas características de Chrome DevTools
 */

// Type declaration for Network Information API
interface NetworkInformation extends EventTarget {
  downlink?: number;
  effectiveType?: '2g' | '3g' | '4g' | 'slow-2g';
  rtt?: number;
  saveData?: boolean;
  addEventListener(type: 'change', listener: (event: Event) => void): void;
  removeEventListener(type: 'change', listener: (event: Event) => void): void;
}

declare global {
  interface Navigator {
    connection?: NetworkInformation;
  }
}

// Detección del header Save-Data
export const detectSaveDataMode = (): boolean => {
  if (typeof navigator !== 'undefined') {
    return navigator.connection?.saveData === true || 
           navigator.connection?.effectiveType === 'slow-2g' ||
           navigator.connection?.effectiveType === '2g';
  }
  return false;
};

// Configuración para modo de datos reducidos
export const getOptimizedConfig = () => {
  const saveDataMode = detectSaveDataMode();
  
  return {
    // Imágenes optimizadas
    images: {
      quality: saveDataMode ? 60 : 80,
      format: saveDataMode ? 'webp' : 'auto',
      lazy: true,
      placeholder: saveDataMode ? 'blur' : 'empty'
    },
    
    // JavaScript optimizado
    javascript: {
      chunking: saveDataMode ? 'minimal' : 'optimal',
      preload: !saveDataMode,
      modulePreload: !saveDataMode
    },
    
    // CSS optimizado
    css: {
      inlineCritical: saveDataMode,
      minify: true,
      removeUnused: saveDataMode
    },
    
    // Red optimizada
    network: {
      timeout: saveDataMode ? 10000 : 5000,
      retries: saveDataMode ? 3 : 1,
      compression: true
    }
  };
};

import { useEffect, useState } from 'react';

// Hook para usar en componentes React
export const usePerformanceMode = () => {
  const [saveDataMode, setSaveDataMode] = useState(false);
  
  useEffect(() => {
    setSaveDataMode(detectSaveDataMode());
    
    // Listener para cambios en la conexión
    const handleConnectionChange = () => {
      setSaveDataMode(detectSaveDataMode());
    };
    
    if (navigator.connection) {
      navigator.connection.addEventListener('change', handleConnectionChange);
      return () => {
        navigator.connection?.removeEventListener('change', handleConnectionChange);
      };
    }
  }, []);
  
  return {
    saveDataMode,
    config: getOptimizedConfig()
  };
};

// Métricas de rendimiento para el dashboard
export const collectPerformanceMetrics = () => {
  if (typeof window === 'undefined') return null;
  
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const paint = performance.getEntriesByType('paint');
  
  return {
    // Core Web Vitals aproximados
    loadTime: navigation.loadEventEnd - navigation.loadEventStart,
    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
    firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
    firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
    
    // Información de red
    connectionType: navigator.connection?.effectiveType || 'unknown',
    saveDataMode: detectSaveDataMode(),
    
    // Recursos
    resources: performance.getEntriesByType('resource').length,
    
    // Timestamp
    timestamp: Date.now()
  };
};

// Componente de alerta para conexiones lentas
// Componente visual eliminado de este archivo .ts para evitar JSX.
// Si se requiere un banner visual, crear SlowConnectionAlert.tsx por separado.
