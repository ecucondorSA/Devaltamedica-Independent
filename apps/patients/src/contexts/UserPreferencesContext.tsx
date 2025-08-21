"use client";

import React, { createContext, useContext, useReducer, useEffect } from 'react';

import { logger } from '@altamedica/shared/services/logger.service';
// Tipos para preferencias de usuario
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'es' | 'en';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  dashboard: {
    layout: 'compact' | 'detailed';
    showMetrics: boolean;
    autoRefresh: boolean;
    refreshInterval: number; // en segundos
  };
  accessibility: {
    fontSize: 'small' | 'medium' | 'large';
    highContrast: boolean;
    reduceMotion: boolean;
  };
  privacy: {
    shareAnalytics: boolean;
    shareUsageData: boolean;
  };
}

// Estado inicial
const defaultPreferences: UserPreferences = {
  theme: 'auto',
  language: 'es',
  notifications: {
    email: true,
    push: true,
    sms: false,
  },
  dashboard: {
    layout: 'compact',
    showMetrics: true,
    autoRefresh: true,
    refreshInterval: 30,
  },
  accessibility: {
    fontSize: 'medium',
    highContrast: false,
    reduceMotion: false,
  },
  privacy: {
    shareAnalytics: true,
    shareUsageData: false,
  },
};

// Acciones del reducer
type PreferenceAction =
  | { type: 'SET_THEME'; payload: UserPreferences['theme'] }
  | { type: 'SET_LANGUAGE'; payload: UserPreferences['language'] }
  | { type: 'UPDATE_NOTIFICATIONS'; payload: Partial<UserPreferences['notifications']> }
  | { type: 'UPDATE_DASHBOARD'; payload: Partial<UserPreferences['dashboard']> }
  | { type: 'UPDATE_ACCESSIBILITY'; payload: Partial<UserPreferences['accessibility']> }
  | { type: 'UPDATE_PRIVACY'; payload: Partial<UserPreferences['privacy']> }
  | { type: 'RESET_PREFERENCES' }
  | { type: 'LOAD_PREFERENCES'; payload: UserPreferences };

// Reducer para manejar el estado
function preferencesReducer(state: UserPreferences, action: PreferenceAction): UserPreferences {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };
    
    case 'UPDATE_NOTIFICATIONS':
      return {
        ...state,
        notifications: { ...state.notifications, ...action.payload }
      };
    
    case 'UPDATE_DASHBOARD':
      return {
        ...state,
        dashboard: { ...state.dashboard, ...action.payload }
      };
    
    case 'UPDATE_ACCESSIBILITY':
      return {
        ...state,
        accessibility: { ...state.accessibility, ...action.payload }
      };
    
    case 'UPDATE_PRIVACY':
      return {
        ...state,
        privacy: { ...state.privacy, ...action.payload }
      };
    
    case 'RESET_PREFERENCES':
      return defaultPreferences;
    
    case 'LOAD_PREFERENCES':
      return action.payload;
    
    default:
      return state;
  }
}

// Contexto
interface UserPreferencesContextType {
  preferences: UserPreferences;
  updateTheme: (theme: UserPreferences['theme']) => void;
  updateLanguage: (language: UserPreferences['language']) => void;
  updateNotifications: (notifications: Partial<UserPreferences['notifications']>) => void;
  updateDashboard: (dashboard: Partial<UserPreferences['dashboard']>) => void;
  updateAccessibility: (accessibility: Partial<UserPreferences['accessibility']>) => void;
  updatePrivacy: (privacy: Partial<UserPreferences['privacy']>) => void;
  resetPreferences: () => void;
  isLoading: boolean;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

// Hook personalizado
export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error('useUserPreferences debe ser usado dentro de UserPreferencesProvider');
  }
  return context;
}

// Provider
interface UserPreferencesProviderProps {
  children: React.ReactNode;
  userId?: string;
}

export function UserPreferencesProvider({ children, userId }: UserPreferencesProviderProps) {
  const [preferences, dispatch] = useReducer(preferencesReducer, defaultPreferences);
  const [isLoading, setIsLoading] = React.useState(true);

  // Cargar preferencias desde localStorage al inicializar
  useEffect(() => {
    const loadPreferences = () => {
      try {
        const stored = localStorage.getItem(`user-preferences-${userId || 'default'}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          dispatch({ type: 'LOAD_PREFERENCES', payload: parsed });
        }
      } catch (error) {
        logger.error('Error cargando preferencias:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [userId]);

  // Guardar preferencias en localStorage cuando cambien
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(
          `user-preferences-${userId || 'default'}`,
          JSON.stringify(preferences)
        );
      } catch (error) {
        logger.error('Error guardando preferencias:', error);
      }
    }
  }, [preferences, userId, isLoading]);

  // Aplicar tema al documento
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      const theme = preferences.theme === 'auto' 
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : preferences.theme;
      
      root.setAttribute('data-theme', theme);
      root.classList.toggle('dark', theme === 'dark');
    };

    applyTheme();

    // Escuchar cambios en preferencias del sistema
    if (preferences.theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', applyTheme);
      return () => mediaQuery.removeEventListener('change', applyTheme);
    }
  }, [preferences.theme]);

  // Aplicar configuración de accesibilidad
  useEffect(() => {
    const root = document.documentElement;
    
    // Tamaño de fuente
    root.style.setProperty('--font-size', 
      preferences.accessibility.fontSize === 'small' ? '14px' :
      preferences.accessibility.fontSize === 'large' ? '18px' : '16px'
    );
    
    // Alto contraste
    root.classList.toggle('high-contrast', preferences.accessibility.highContrast);
    
    // Reducir movimiento
    root.classList.toggle('reduce-motion', preferences.accessibility.reduceMotion);
  }, [preferences.accessibility]);

  const value: UserPreferencesContextType = {
    preferences,
    updateTheme: (theme) => dispatch({ type: 'SET_THEME', payload: theme }),
    updateLanguage: (language) => dispatch({ type: 'SET_LANGUAGE', payload: language }),
    updateNotifications: (notifications) => dispatch({ type: 'UPDATE_NOTIFICATIONS', payload: notifications }),
    updateDashboard: (dashboard) => dispatch({ type: 'UPDATE_DASHBOARD', payload: dashboard }),
    updateAccessibility: (accessibility) => dispatch({ type: 'UPDATE_ACCESSIBILITY', payload: accessibility }),
    updatePrivacy: (privacy) => dispatch({ type: 'UPDATE_PRIVACY', payload: privacy }),
    resetPreferences: () => dispatch({ type: 'RESET_PREFERENCES' }),
    isLoading,
  };

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
} 