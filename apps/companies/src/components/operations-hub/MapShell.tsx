"use client";

import { ExpandableSection } from '@/components/common/ExpandableSection';
import { useOperationsUI } from '@/contexts/OperationsUIContext';
import { ChevronDown, ChevronUp, Maximize2, Minimize2 } from 'lucide-react';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';

export interface LegendItem {
  color: string;
  label: string;
  description?: string;
  count?: number;
}

export interface MapShellProps {
  title: string;
  children: ReactNode;
  legendItems?: LegendItem[];
  rightActions?: ReactNode;
  storageKeyPrefix: string;
  className?: string;
  onLayoutChange?: () => void;
  showLegend?: boolean;
  showSettings?: boolean;
  theme?: 'slate' | 'vscode';
}

export function MapShell({
  title,
  children,
  legendItems = [],
  rightActions,
  storageKeyPrefix,
  className = "",
  onLayoutChange,
  showLegend: externalShowLegend,
  showSettings = true,
  theme = 'vscode'
}: MapShellProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver>();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [localShowLegend, setLocalShowLegend] = useState(true);
  
  const { showLegend: globalShowLegend, lastLayoutChange, triggerLayoutChange } = useOperationsUI();
  
  // Usar showLegend externo o global como fallback
  const showLegend = externalShowLegend ?? globalShowLegend;
  
  // Storage key único por instancia para evitar cruces
  const legendStorageKey = `${storageKeyPrefix}.legend.visible`;
  
  // Cargar estado de leyenda desde localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(legendStorageKey);
      if (stored !== null) {
        setLocalShowLegend(stored !== 'false');
      }
    }
  }, [legendStorageKey]);
  
  // Guardar estado de leyenda
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(legendStorageKey, String(localShowLegend));
    }
  }, [localShowLegend, legendStorageKey]);

  // Invalidar tamaño del mapa con debouncing
  const invalidateMapSize = useCallback(() => {
    // Doble invalidación para asegurar que Leaflet detecta el tamaño correcto
    setTimeout(() => {
      const event = new CustomEvent('map:invalidate-size', {
        detail: { timestamp: Date.now() }
      });
      window.dispatchEvent(event);
      
      // Segunda invalidación después de animaciones CSS
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('map:invalidate-size', {
          detail: { timestamp: Date.now() }
        }));
      }, 150);
    }, 50);
  }, []);

  // Escuchar cambios de layout globales
  useEffect(() => {
    const handleLayoutChange = () => {
      invalidateMapSize();
      onLayoutChange?.();
    };
    
    const handleOperationsLayoutChange = () => {
      invalidateMapSize();
      onLayoutChange?.();
    };

    window.addEventListener('crisis:layout-changed', handleLayoutChange);
    window.addEventListener('operations:layout-changed', handleOperationsLayoutChange);
    
    return () => {
      window.removeEventListener('crisis:layout-changed', handleLayoutChange);
      window.removeEventListener('operations:layout-changed', handleOperationsLayoutChange);
    };
  }, [invalidateMapSize, onLayoutChange]);

  // ResizeObserver para cambios de tamaño del contenedor
  useEffect(() => {
    if (containerRef.current) {
      resizeObserverRef.current = new ResizeObserver(() => {
        invalidateMapSize();
      });
      
      resizeObserverRef.current.observe(containerRef.current);
      
      return () => {
        resizeObserverRef.current?.disconnect();
      };
    }
  }, [invalidateMapSize]);

  // Invalidar tamaño cuando cambia lastLayoutChange
  useEffect(() => {
    invalidateMapSize();
  }, [lastLayoutChange, invalidateMapSize]);

  // Toggle leyenda local con invalidación de mapa
  const toggleLegend = () => {
    setLocalShowLegend(prev => {
      const newValue = !prev;
      // Invalidar mapa tras toggle de leyenda usando rAF
      requestAnimationFrame(() => {
        invalidateMapSize();
        // También disparar evento de layout para consistencia
        triggerLayoutChange();
      });
      return newValue;
    });
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(prev => {
      const newValue = !prev;
      // Trigger layout change after fullscreen toggle
      setTimeout(invalidateMapSize, 100);
      return newValue;
    });
  };

  // Combinar showLegend global y local
  const shouldShowLegend = showLegend && localShowLegend && legendItems.length > 0;

  return (
    <div 
      ref={containerRef}
      className={`
        relative h-full flex flex-col
        ${isFullscreen ? 'fixed inset-0 z-50 bg-vscode-background' : ''}
        ${className}
      `}
    >
      {/* Header */}
      <div className={`flex-shrink-0 flex items-center justify-between p-3 border-b ${theme === 'vscode' ? 'bg-vscode-panel border-vscode-border text-vscode-foreground' : 'bg-slate-50/50'}`}>
        <div className="flex items-center gap-3">
          <h3 className={`${theme === 'vscode' ? 'font-semibold text-white' : 'font-semibold text-slate-800'}`}>{title}</h3>
          {legendItems.length > 0 && (
            <button
              onClick={toggleLegend}
              className={`${theme === 'vscode' ? 'text-vscode-foreground hover:bg-vscode-list-hover' : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'} flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors`}
              title="Toggle Legend"
              aria-pressed={shouldShowLegend}
              aria-controls={`legend-${storageKeyPrefix}`}
            >
              {shouldShowLegend ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              Leyenda
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {rightActions}
          {showSettings && (
            <button
              onClick={toggleFullscreen}
              className={`${theme === 'vscode' ? 'text-vscode-foreground hover:bg-vscode-list-hover' : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'} flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors`}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              aria-pressed={isFullscreen}
              aria-controls={`map-container-${storageKeyPrefix}`}
            >
              {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      {shouldShowLegend && (
        <div 
          id={`legend-${storageKeyPrefix}`}
          className={`flex-shrink-0 border-b ${theme === 'vscode' ? 'bg-vscode-panel border-vscode-border text-vscode-foreground' : 'bg-white'}`}
        >
          <ExpandableSection
            title=""
            defaultOpen={true}
            storageKey={`${storageKeyPrefix}.legend.expanded`}
            className={`border-0 ${theme === 'vscode' ? 'text-vscode-foreground' : ''}`}
          >
            <div className="px-3 py-2">
              <div className="flex flex-wrap gap-4">
                {legendItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <div 
                      className="w-3 h-3 rounded-full border border-slate-300"
                      style={{ backgroundColor: item.color }}
                      aria-label={`${item.label} indicator`}
                    />
                    <span className={`${theme === 'vscode' ? 'text-white font-medium' : 'text-slate-700 font-medium'}`}>{item.label}</span>
                    {item.count !== undefined && (
                      <span className={`${theme === 'vscode' ? 'text-vscode-foreground' : 'text-slate-500'}`}>({item.count})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </ExpandableSection>
        </div>
      )}

      {/* Map Content */}
      <div 
        id={`map-container-${storageKeyPrefix}`}
        className="flex-1 relative overflow-hidden"
      >
        <div className="absolute inset-0">
          {/* Garantizar altura mínima y máxima para Leaflet */}
          <div 
            className="h-full min-h-[360px] w-full"
            style={{ 
              minHeight: isFullscreen ? '100vh' : '360px'
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook para componentes que necesitan escuchar invalidaciones de mapa
export function useMapInvalidation(callback?: () => void) {
  useEffect(() => {
    const handleInvalidation = () => {
      callback?.();
    };

    window.addEventListener('map:invalidate-size', handleInvalidation);
    return () => window.removeEventListener('map:invalidate-size', handleInvalidation);
  }, [callback]);
}

// Componente de leyenda reutilizable
export function MapLegend({ 
  items, 
  className = "" 
}: { 
  items: LegendItem[]; 
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <div className={`bg-white/90 backdrop-blur-sm rounded-lg border p-3 shadow-sm ${className}`}>
      <h4 className="text-xs font-semibold text-slate-700 mb-2">Leyenda</h4>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div 
              className="w-3 h-3 rounded-full border border-slate-300 flex-shrink-0"
              style={{ backgroundColor: item.color }}
              aria-label={`${item.label} indicator`}
            />
            <div className="flex-1">
              <span className="text-slate-700 font-medium">{item.label}</span>
              {item.count !== undefined && (
                <span className="text-slate-500 ml-1">({item.count})</span>
              )}
              {item.description && (
                <div className="text-slate-500 text-xs mt-0.5">{item.description}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Utilidad para colores de leyenda consistentes
export const MAP_COLORS = {
  // Hospital status colors
  hospital: {
    normal: '#10b981',      // green-500
    warning: '#f59e0b',     // amber-500  
    critical: '#ef4444',    // red-500
    offline: '#6b7280'      // gray-500
  },
  
  // Marketplace colors
  marketplace: {
    doctor: '#3b82f6',      // blue-500
    hospital: '#8b5cf6',    // violet-500
    company: '#f59e0b',     // amber-500
    urgent: '#ef4444'       // red-500
  },
  
  // Route colors
  routes: {
    primary: '#059669',     // emerald-600
    secondary: '#0891b2',   // cyan-600
    emergency: '#dc2626'    // red-600
  }
} as const;