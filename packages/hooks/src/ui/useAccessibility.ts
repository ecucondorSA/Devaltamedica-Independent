/**
 * @fileoverview Hook de accesibilidad para aplicaciones médicas
 * @description Herramientas WCAG 2.2 AA compliant para interfaces médicas accesibles
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@altamedica/shared';
interface AccessibilitySettings {
  fontSize: 'normal' | 'large' | 'extra-large';
  highContrast: boolean;
  reducedMotion: boolean;
  largeClickTargets: boolean;
  screenReaderOptimized: boolean;
  keyboardNavigation: boolean;
}

interface AccessibilityAnnouncement {
  message: string;
  priority: 'polite' | 'assertive';
  id?: string;
}

const FONT_SIZE_CLASSES = {
  'normal': 'text-size-normal',
  'large': 'text-size-large',
  'extra-large': 'text-size-extra-large'
};

const DEFAULT_SETTINGS: AccessibilitySettings = {
  fontSize: 'normal',
  highContrast: false,
  reducedMotion: false,
  largeClickTargets: false,
  screenReaderOptimized: false,
  keyboardNavigation: true
};

export function useAccessibility() {
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_SETTINGS);
  const [announcements, setAnnouncements] = useState<AccessibilityAnnouncement[]>([]);

  // Cargar configuración guardada y detectar preferencias del sistema
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Cargar configuración guardada
    const savedSettings = localStorage.getItem('altamedica_accessibility_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        logger.warn('Error parsing accessibility settings:', error);
      }
    }

    // Detectar preferencias del sistema
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

    setSettings(prev => ({
      ...prev,
      reducedMotion: savedSettings ? prev.reducedMotion : prefersReducedMotion,
      highContrast: savedSettings ? prev.highContrast : (prefersHighContrast || prefersDarkMode)
    }));
  }, []);

  // Aplicar configuraciones al DOM
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Guardar en localStorage
    localStorage.setItem('altamedica_accessibility_settings', JSON.stringify(settings));
    
    const root = document.documentElement;
    const body = document.body;
    
    // Limpiar clases anteriores
    root.classList.remove(
      'text-size-normal', 
      'text-size-large', 
      'text-size-extra-large',
      'high-contrast', 
      'reduced-motion', 
      'large-targets',
      'screen-reader-optimized',
      'keyboard-navigation'
    );
    
    // Aplicar clases basadas en configuración
    root.classList.add(FONT_SIZE_CLASSES[settings.fontSize]);
    
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    }
    
    if (settings.reducedMotion) {
      root.classList.add('reduced-motion');
      // Aplicar CSS para reducir animaciones
      root.style.setProperty('--animation-duration', '0.01ms');
      root.style.setProperty('--transition-duration', '0.01ms');
    } else {
      root.style.removeProperty('--animation-duration');
      root.style.removeProperty('--transition-duration');
    }
    
    if (settings.largeClickTargets) {
      root.classList.add('large-targets');
    }
    
    if (settings.screenReaderOptimized) {
      root.classList.add('screen-reader-optimized');
    }
    
    if (settings.keyboardNavigation) {
      root.classList.add('keyboard-navigation');
    }

    // Configurar atributos ARIA para mejor accesibilidad
    if (settings.screenReaderOptimized) {
      body.setAttribute('aria-live', 'polite');
    } else {
      body.removeAttribute('aria-live');
    }
  }, [settings]);

  // Función para actualizar configuración específica
  const updateSetting = useCallback(<K extends keyof AccessibilitySettings>(
    key: K, 
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  // Funciones específicas para tamaño de fuente
  const increaseFontSize = useCallback(() => {
    const sizes: AccessibilitySettings['fontSize'][] = ['normal', 'large', 'extra-large'];
    const currentIndex = sizes.indexOf(settings.fontSize);
    if (currentIndex < sizes.length - 1) {
      updateSetting('fontSize', sizes[currentIndex + 1]);
    }
  }, [settings.fontSize, updateSetting]);

  const decreaseFontSize = useCallback(() => {
    const sizes: AccessibilitySettings['fontSize'][] = ['normal', 'large', 'extra-large'];
    const currentIndex = sizes.indexOf(settings.fontSize);
    if (currentIndex > 0) {
      updateSetting('fontSize', sizes[currentIndex - 1]);
    }
  }, [settings.fontSize, updateSetting]);

  // Función para anuncios de screen reader
  const announce = useCallback((
    message: string, 
    priority: 'polite' | 'assertive' = 'polite'
  ) => {
    const announcement: AccessibilityAnnouncement = {
      message,
      priority,
      id: `announcement-${Date.now()}`
    };
    
    setAnnouncements(prev => [...prev, announcement]);
    
    // Remover el anuncio después de 5 segundos
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a.id !== announcement.id));
    }, 5000);
  }, []);

  // Función para resetear configuraciones
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  // Función para aplicar preset médico
  const applyMedicalPreset = useCallback(() => {
    setSettings({
      fontSize: 'large',
      highContrast: true,
      reducedMotion: false,
      largeClickTargets: true,
      screenReaderOptimized: true,
      keyboardNavigation: true
    });
    announce('Configuración médica aplicada: texto grande, alto contraste y navegación optimizada', 'assertive');
  }, [announce]);

  // Función para detectar navegación por teclado
  const detectKeyboardNavigation = useCallback(() => {
    if (typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        updateSetting('keyboardNavigation', true);
      }
    };

    const handleMouseDown = () => {
      updateSetting('keyboardNavigation', false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [updateSetting]);

  // Función para generar props de accesibilidad
  const getAccessibilityProps = useCallback((element: 'button' | 'input' | 'link' | 'general' = 'general') => {
    const baseProps: Record<string, any> = {};

    if (settings.largeClickTargets) {
      baseProps.style = {
        ...baseProps.style,
        minHeight: '44px',
        minWidth: '44px'
      };
    }

    switch (element) {
      case 'button':
        return {
          ...baseProps,
          role: 'button',
          tabIndex: settings.keyboardNavigation ? 0 : -1,
          'aria-pressed': false
        };
      
      case 'input':
        return {
          ...baseProps,
          'aria-required': true,
          'aria-invalid': false
        };
      
      case 'link':
        return {
          ...baseProps,
          role: 'link',
          tabIndex: settings.keyboardNavigation ? 0 : -1
        };
      
      default:
        return baseProps;
    }
  }, [settings.largeClickTargets, settings.keyboardNavigation]);

  // Hook para focus management
  const manageFocus = useCallback((elementId: string) => {
    if (typeof window === 'undefined') return;

    setTimeout(() => {
      const element = document.getElementById(elementId);
      if (element) {
        element.focus();
        // Anunciar el foco para screen readers
        if (settings.screenReaderOptimized) {
          const elementText = element.textContent || element.getAttribute('aria-label') || 'Elemento enfocado';
          announce(`Foco en: ${elementText}`, 'polite');
        }
      }
    }, 100);
  }, [settings.screenReaderOptimized, announce]);

  return {
    // Estado
    settings,
    announcements,
    
    // Configuración
    updateSetting,
    resetSettings,
    applyMedicalPreset,
    
    // Tamaño de fuente
    increaseFontSize,
    decreaseFontSize,
    
    // Funcionalidades avanzadas
    announce,
    detectKeyboardNavigation,
    getAccessibilityProps,
    manageFocus,
    
    // Helpers
    isHighContrast: settings.highContrast,
    isReducedMotion: settings.reducedMotion,
    isLargeFontSize: settings.fontSize !== 'normal',
    isScreenReaderOptimized: settings.screenReaderOptimized
  };
}

// Hook para detectar capacidades de accesibilidad
export function useAccessibilityCapabilities() {
  const [capabilities, setCapabilities] = useState({
    screenReader: false,
    highContrast: false,
    reducedMotion: false,
    keyboardNavigation: false
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detectar screen reader (heurística)
    const detectScreenReader = () => {
      return !!(
        window.navigator.userAgent.match(/NVDA|JAWS|VoiceOver|TalkBack/) ||
        window.speechSynthesis ||
        document.body.getAttribute('aria-live')
      );
    };

    setCapabilities({
      screenReader: detectScreenReader(),
      highContrast: window.matchMedia('(prefers-contrast: high)').matches,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      keyboardNavigation: false // Se detecta dinámicamente con el uso
    });
  }, []);

  return capabilities;
}

// Hook para verificar cumplimiento WCAG
export function useWCAGCompliance() {
  const checkColorContrast = useCallback((foreground: string, background: string): number => {
    // Implementación simplificada del cálculo de contraste WCAG
    const getLuminance = (color: string): number => {
      // Esta es una implementación básica, en producción usar una librería especializada
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;
      
      const sRGB = [r, g, b].map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
      return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
    };

    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    const contrast = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    
    return Math.round(contrast * 100) / 100;
  }, []);

  const isWCAGCompliant = useCallback((
    contrastRatio: number, 
    level: 'AA' | 'AAA' = 'AA',
    isLargeText: boolean = false
  ): boolean => {
    const requirements = {
      AA: { normal: 4.5, large: 3 },
      AAA: { normal: 7, large: 4.5 }
    };
    
    const required = requirements[level][isLargeText ? 'large' : 'normal'];
    return contrastRatio >= required;
  }, []);

  return {
    checkColorContrast,
    isWCAGCompliant
  };
}
