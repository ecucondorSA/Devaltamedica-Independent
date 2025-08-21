'use client';

import { useIntersectionLoader, usePerformanceMonitor } from '@/hooks/useIntersectionLoader';
import { ReactNode } from 'react';

interface LazyComponentWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  priority?: 'high' | 'medium' | 'low';
  className?: string;
  componentName?: string;
  threshold?: number;
  rootMargin?: string;
}

/**
 * 🚀 LAZY COMPONENT WRAPPER
 * Wrapper universal para cargar componentes con Intersection Observer
 */
export function LazyComponentWrapper({
  children,
  fallback = <DefaultSkeleton />,
  priority = 'medium',
  className = '',
  componentName = 'LazyComponent',
  threshold = 0.1,
  rootMargin = '200px'
}: LazyComponentWrapperProps) {
  const { ref, shouldLoad } = useIntersectionLoader({ 
    threshold, 
    rootMargin,
    triggerOnce: true 
  });
  
  const { markAsLoaded } = usePerformanceMonitor(componentName);

  // Marcar como cargado cuando el componente se renderiza
  if (shouldLoad && !markAsLoaded) {
    setTimeout(markAsLoaded, 0);
  }

  return (
    <div ref={ref} className={className}>
      {shouldLoad ? children : fallback}
    </div>
  );
}

/**
 * 🎨 DEFAULT SKELETON
 * Skeleton básico para componentes lazy
 */
function DefaultSkeleton() {
  return (
    <div className="animate-pulse bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl min-h-[300px] flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 bg-slate-200 rounded-full mx-auto animate-pulse"></div>
        <div className="h-3 bg-slate-200 rounded-full w-24 mx-auto"></div>
        <div className="h-2 bg-slate-200 rounded-full w-16 mx-auto"></div>
      </div>
    </div>
  );
}

/**
 * 🎯 SPECIALIZED WRAPPERS
 * Wrappers especializados para diferentes tipos de componentes
 */

// Para componentes 3D
export function Lazy3DWrapper({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <LazyComponentWrapper
      priority="medium"
      threshold={0.1}
      rootMargin="300px" // Cargar antes para modelos pesados
      componentName="3D Component"
      className={className}
      fallback={<ThreeDSkeleton />}
    >
      {children}
    </LazyComponentWrapper>
  );
}

// Para videos y media
export function LazyMediaWrapper({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <LazyComponentWrapper
      priority="low"
      threshold={0.2}
      rootMargin="150px"
      componentName="Media Component"
      className={className}
      fallback={<MediaSkeleton />}
    >
      {children}
    </LazyComponentWrapper>
  );
}

// Para mapas
export function LazyMapWrapper({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <LazyComponentWrapper
      priority="medium"
      threshold={0.1}
      rootMargin="250px"
      componentName="Map Component"
      className={className}
      fallback={<MapSkeleton />}
    >
      {children}
    </LazyComponentWrapper>
  );
}

/**
 * 🎨 SPECIALIZED SKELETONS
 */
function ThreeDSkeleton() {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-slate-100 rounded-xl min-h-[400px] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -translate-x-full animate-shimmer"></div>
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-blue-200 rounded-2xl mx-auto animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-4 bg-blue-200 rounded-full w-32 mx-auto animate-pulse"></div>
            <div className="h-3 bg-slate-200 rounded-full w-24 mx-auto animate-pulse delay-75"></div>
          </div>
          <p className="text-xs text-slate-500 font-medium">Cargando modelo 3D...</p>
        </div>
      </div>
    </div>
  );
}

function MediaSkeleton() {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-slate-100 rounded-xl min-h-[300px] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -translate-x-full animate-shimmer"></div>
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-purple-200 rounded-xl mx-auto animate-pulse flex items-center justify-center">
            <div className="w-6 h-6 bg-purple-400 rounded-full animate-pulse"></div>
          </div>
          <div className="h-3 bg-purple-200 rounded-full w-28 mx-auto animate-pulse"></div>
          <p className="text-xs text-slate-500 font-medium">Cargando contenido multimedia...</p>
        </div>
      </div>
    </div>
  );
}

function MapSkeleton() {
  return (
    <div className="bg-gradient-to-br from-green-50 to-slate-100 rounded-xl min-h-[400px] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -translate-x-full animate-shimmer"></div>
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-green-200 rounded-full mx-auto animate-pulse"></div>
          <div className="h-3 bg-green-200 rounded-full w-24 mx-auto animate-pulse"></div>
          <p className="text-xs text-slate-500 font-medium">Cargando mapa interactivo...</p>
        </div>
      </div>
    </div>
  );
}