"use client";

import React, { createContext, useContext, useCallback, useEffect, useReducer, useRef } from 'react';

import { logger } from '@altamedica/shared/services/logger.service';
// Tipos para el contexto UI
export type TabType = 'network' | 'redistribution' | 'marketplace';

export interface OperationsUIState {
  // Layout state
  sidebarOpen: boolean;
  activeTab: TabType;
  zenMode: boolean;
  splitView: boolean;
  splitRatio: number;
  
  // UI preferences
  showLegend: boolean;
  showMetrics: boolean;
  
  // Performance
  lastLayoutChange: number;
}

export interface OperationsUIActions {
  toggleSidebar: () => void;
  setActiveTab: (tab: TabType) => void;
  toggleZenMode: () => void;
  toggleSplitView: () => void;
  setSplitRatio: (ratio: number) => void;
  toggleLegend: () => void;
  toggleMetrics: () => void;
  triggerLayoutChange: () => void;
  resetToDefaults: () => void;
}

// Action types para el reducer
type OperationsUIAction =
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_ACTIVE_TAB'; payload: TabType }
  | { type: 'TOGGLE_ZEN_MODE' }
  | { type: 'TOGGLE_SPLIT_VIEW' }
  | { type: 'SET_SPLIT_RATIO'; payload: number }
  | { type: 'TOGGLE_LEGEND' }
  | { type: 'TOGGLE_METRICS' }
  | { type: 'TRIGGER_LAYOUT_CHANGE' }
  | { type: 'RESET_DEFAULTS' }
  | { type: 'LOAD_STATE'; payload: Partial<OperationsUIState> };

// Estado inicial
const initialState: OperationsUIState = {
  sidebarOpen: true,
  activeTab: 'network',
  zenMode: false,
  splitView: false,
  splitRatio: 0.5,
  showLegend: true,
  showMetrics: true,
  lastLayoutChange: Date.now(),
};

// Storage keys para persistencia
const STORAGE_KEYS = {
  sidebar: 'ops.sidebar.open',
  tab: 'ops.tab',
  zen: 'ops.zen.mode',
  split: 'ops.split.enabled',
  ratio: 'ops.split.ratio',
  legend: 'ops.legend.visible',
  metrics: 'ops.metrics.visible',
} as const;

// Reducer para manejar acciones
function operationsUIReducer(
  state: OperationsUIState, 
  action: OperationsUIAction
): OperationsUIState {
  switch (action.type) {
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen, lastLayoutChange: Date.now() };
      
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload, lastLayoutChange: Date.now() };
      
    case 'TOGGLE_ZEN_MODE':
      return { 
        ...state, 
        zenMode: !state.zenMode,
        sidebarOpen: state.zenMode ? true : false, // Al salir de zen, restaurar sidebar
        lastLayoutChange: Date.now()
      };
      
    case 'TOGGLE_SPLIT_VIEW':
      return { ...state, splitView: !state.splitView, lastLayoutChange: Date.now() };
      
    case 'SET_SPLIT_RATIO':
      return { 
        ...state, 
        splitRatio: Math.max(0.2, Math.min(0.8, action.payload)),
        lastLayoutChange: Date.now()
      };
      
    case 'TOGGLE_LEGEND':
      // Incluir lastLayoutChange para reflow consistente de leyenda
      return { ...state, showLegend: !state.showLegend, lastLayoutChange: Date.now() };
      
    case 'TOGGLE_METRICS':
      return { ...state, showMetrics: !state.showMetrics, lastLayoutChange: Date.now() };
      
    case 'TRIGGER_LAYOUT_CHANGE':
      return { ...state, lastLayoutChange: Date.now() };
      
    case 'RESET_DEFAULTS':
      return { ...initialState, lastLayoutChange: Date.now() };
      
    case 'LOAD_STATE':
      return { ...state, ...action.payload, lastLayoutChange: Date.now() };
      
    default:
      return state;
  }
}

// Context
const OperationsUIContext = createContext<
  (OperationsUIState & OperationsUIActions) | undefined
>(undefined);

// Utilidad para cargar estado desde localStorage
function loadStoredState(): Partial<OperationsUIState> {
  if (typeof window === 'undefined') return {};
  
  try {
    // Parseo seguro de splitRatio con fallback
    const storedRatio = localStorage.getItem(STORAGE_KEYS.ratio);
    const parsedRatio = parseFloat(storedRatio || '0.5');
    const safeRatio = isNaN(parsedRatio) ? 0.5 : parsedRatio;
    
    return {
      sidebarOpen: localStorage.getItem(STORAGE_KEYS.sidebar) !== 'false',
      activeTab: (localStorage.getItem(STORAGE_KEYS.tab) as TabType) || 'network',
      zenMode: localStorage.getItem(STORAGE_KEYS.zen) === 'true',
      splitView: localStorage.getItem(STORAGE_KEYS.split) === 'true',
      splitRatio: safeRatio,
      showLegend: localStorage.getItem(STORAGE_KEYS.legend) !== 'false',
      showMetrics: localStorage.getItem(STORAGE_KEYS.metrics) !== 'false',
    };
  } catch (error) {
    logger.warn('Failed to load Operations UI state from localStorage:', error);
    return {};
  }
}

// Utilidad para guardar en localStorage
function saveToStorage(key: keyof typeof STORAGE_KEYS, value: any) {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEYS[key], String(value));
  } catch (error) {
    logger.warn(`Failed to save ${key} to localStorage:`, error);
  }
}

// Debouncer para eventos de layout
function useDebounceCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;
}

// Provider component
export function OperationsUIProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(operationsUIReducer, initialState);

  // Cargar estado inicial desde localStorage
  useEffect(() => {
    const storedState = loadStoredState();
    if (Object.keys(storedState).length > 0) {
      dispatch({ type: 'LOAD_STATE', payload: storedState });
    }
  }, []);

  // Persistir cambios en localStorage
  useEffect(() => {
    saveToStorage('sidebar', state.sidebarOpen);
  }, [state.sidebarOpen]);

  useEffect(() => {
    saveToStorage('tab', state.activeTab);
  }, [state.activeTab]);

  useEffect(() => {
    saveToStorage('zen', state.zenMode);
  }, [state.zenMode]);

  useEffect(() => {
    saveToStorage('split', state.splitView);
  }, [state.splitView]);

  useEffect(() => {
    saveToStorage('ratio', state.splitRatio);
  }, [state.splitRatio]);

  useEffect(() => {
    saveToStorage('legend', state.showLegend);
  }, [state.showLegend]);

  useEffect(() => {
    saveToStorage('metrics', state.showMetrics);
  }, [state.showMetrics]);

  // Debounced event emission para múltiples toggles seguidos
  const emitLayoutEvent = useDebounceCallback((timestamp: number, currentState: OperationsUIState) => {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('operations:layout-changed', {
        detail: { timestamp, state: currentState }
      });
      window.dispatchEvent(event);
      
      // También emitir el evento existente para compatibilidad
      const legacyEvent = new CustomEvent('crisis:layout-changed', {
        detail: { timestamp }
      });
      window.dispatchEvent(legacyEvent);
    }
  }, 150); // Debounce de 150ms

  // Emit global event for layout changes con debouncing
  useEffect(() => {
    emitLayoutEvent(state.lastLayoutChange, state);
  }, [state.lastLayoutChange, state, emitLayoutEvent]);

  // Actions
  const actions = {
    toggleSidebar: useCallback(() => dispatch({ type: 'TOGGLE_SIDEBAR' }), []),
    setActiveTab: useCallback((tab: TabType) => dispatch({ type: 'SET_ACTIVE_TAB', payload: tab }), []),
    toggleZenMode: useCallback(() => dispatch({ type: 'TOGGLE_ZEN_MODE' }), []),
    toggleSplitView: useCallback(() => dispatch({ type: 'TOGGLE_SPLIT_VIEW' }), []),
    setSplitRatio: useCallback((ratio: number) => dispatch({ type: 'SET_SPLIT_RATIO', payload: ratio }), []),
    toggleLegend: useCallback(() => dispatch({ type: 'TOGGLE_LEGEND' }), []),
    toggleMetrics: useCallback(() => dispatch({ type: 'TOGGLE_METRICS' }), []),
    triggerLayoutChange: useCallback(() => dispatch({ type: 'TRIGGER_LAYOUT_CHANGE' }), []),
    resetToDefaults: useCallback(() => dispatch({ type: 'RESET_DEFAULTS' }), []),
  };

  const contextValue = {
    ...state,
    ...actions,
  };

  return (
    <OperationsUIContext.Provider value={contextValue}>
      {children}
    </OperationsUIContext.Provider>
  );
}

// Hook personalizado para usar el contexto
export function useOperationsUI() {
  const context = useContext(OperationsUIContext);
  if (!context) {
    throw new Error('useOperationsUI must be used within an OperationsUIProvider');
  }
  return context;
}

// Hook para escuchar cambios de layout
export function useLayoutEvents() {
  const { lastLayoutChange } = useOperationsUI();

  useEffect(() => {
    const handleLayoutChange = (event: any) => {
      logger.info('🎮 Operations Layout Changed:', event.detail);
    };

    window.addEventListener('operations:layout-changed', handleLayoutChange);
    return () => window.removeEventListener('operations:layout-changed', handleLayoutChange);
  }, []);

  return lastLayoutChange;
}

// Utilidades para atajos de teclado cross-platform
export function useOperationsKeyboard() {
  const { toggleSidebar, setActiveTab, toggleSplitView, toggleZenMode, zenMode } = useOperationsUI();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cross-platform modifier key (Ctrl en Windows/Linux, Cmd en Mac)
      const isModifierPressed = event.ctrlKey || event.metaKey;

      // Ctrl/Cmd+B: Toggle sidebar
      if (isModifierPressed && event.key === 'b') {
        event.preventDefault();
        toggleSidebar();
        return;
      }

      // Ctrl/Cmd+1/2/3: Switch tabs
      if (isModifierPressed && ['1', '2', '3'].includes(event.key)) {
        event.preventDefault();
        const tabMap: Record<string, TabType> = {
          '1': 'network',
          '2': 'redistribution',
          '3': 'marketplace'
        };
        setActiveTab(tabMap[event.key]);
        return;
      }

      // Alt+S: Toggle split view
      if (event.altKey && event.key === 's') {
        event.preventDefault();
        toggleSplitView();
        return;
      }

      // Escape: Exit zen mode solo si está activo (no toggle)
      if (event.key === 'Escape' && zenMode) {
        event.preventDefault();
        toggleZenMode();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar, setActiveTab, toggleSplitView, toggleZenMode, zenMode]);
}