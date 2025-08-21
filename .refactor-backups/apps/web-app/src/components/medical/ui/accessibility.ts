import { useEffect, useRef, useState, useCallback } from 'react';

// Web Speech API Types
interface SpeechSynthesisUtterance {
  text: string;
  lang?: string;
  volume?: number;
  rate?: number;
  pitch?: number;
  voice?: SpeechSynthesisVoice;
}

// Voice-over utility functions
export const useVoiceOver = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Check if Web Speech API is supported
    if ('speechSynthesis' in window) {
      setIsSupported(true);
      
      // Load voices
      const loadVoices = () => {
        const availableVoices = speechSynthesis.getVoices();
        setVoices(availableVoices);
      };

      loadVoices();
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const speak = useCallback((text: string, options?: {
    lang?: string;
    rate?: number;
    pitch?: number;
    volume?: number;
  }) => {
    if (!isSupported || !isEnabled) return;

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure voice settings optimized for elderly users
    utterance.rate = options?.rate || 0.8; // Slower speech rate
    utterance.pitch = options?.pitch || 1.0;
    utterance.volume = options?.volume || 1.0;
    utterance.lang = options?.lang || 'en-US';

    // Select a clear, friendly voice
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Microsoft') || 
      voice.name.includes('Google') ||
      voice.name.includes('Alex') ||
      voice.default
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  }, [isSupported, isEnabled, voices]);

  const stop = useCallback(() => {
    speechSynthesis.cancel();
  }, []);

  const toggle = useCallback(() => {
    setIsEnabled(prev => !prev);
  }, []);

  return {
    isSupported,
    isEnabled,
    speak,
    stop,
    toggle,
    voices,
  };
};

// Keyboard navigation utilities
export const useKeyboardNavigation = () => {
  const [focusedElement, setFocusedElement] = useState<HTMLElement | null>(null);
  const focusableElements = useRef<HTMLElement[]>([]);

  const getFocusableElements = useCallback((container: HTMLElement) => {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([aria-disabled="true"])',
      '[role="link"]:not([aria-disabled="true"])',
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent, container: HTMLElement) => {
    const elements = getFocusableElements(container);
    focusableElements.current = elements;

    const currentIndex = elements.indexOf(document.activeElement as HTMLElement);

    switch (event.key) {
      case 'Tab':
        // Let native tab behavior handle this
        break;
      
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        const nextIndex = (currentIndex + 1) % elements.length;
        elements[nextIndex]?.focus();
        setFocusedElement(elements[nextIndex]);
        break;
      
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        const prevIndex = currentIndex <= 0 ? elements.length - 1 : currentIndex - 1;
        elements[prevIndex]?.focus();
        setFocusedElement(elements[prevIndex]);
        break;
      
      case 'Home':
        event.preventDefault();
        elements[0]?.focus();
        setFocusedElement(elements[0]);
        break;
      
      case 'End':
        event.preventDefault();
        elements[elements.length - 1]?.focus();
        setFocusedElement(elements[elements.length - 1]);
        break;
      
      case 'Escape':
        event.preventDefault();
        (document.activeElement as HTMLElement)?.blur();
        setFocusedElement(null);
        break;
    }
  }, [getFocusableElements]);

  return {
    focusedElement,
    handleKeyDown,
    getFocusableElements,
  };
};

// ARIA utilities for medical components
export const getAriaLabel = (type: string, value: string | number, unit?: string) => {
  const labels = {
    heartRate: (val: string | number) => `Heart rate: ${val} beats per minute`,
    bloodPressure: (val: string | number) => `Blood pressure: ${val} millimeters of mercury`,
    temperature: (val: string | number) => `Temperature: ${val} degrees Celsius`,
    oxygenSat: (val: string | number) => `Oxygen saturation: ${val} percent`,
    bloodSugar: (val: string | number) => `Blood sugar: ${val} milligrams per deciliter`,
  };

  const labelFunction = labels[type as keyof typeof labels];
  return labelFunction ? labelFunction(value) : `${type}: ${value}${unit ? ` ${unit}` : ''}`;
};

export const getAriaDescription = (type: string, value: number, normalRange: { min: number; max: number }) => {
  let status = 'normal';
  
  if (value < normalRange.min) {
    status = 'below normal range';
  } else if (value > normalRange.max) {
    status = 'above normal range';
  }

  return `${status}. Normal range is ${normalRange.min} to ${normalRange.max}.`;
};

// Screen reader utilities
export const announceToScreenReader = (message: string) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

export const announceUrgent = (message: string) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'assertive');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// Focus management
export const useFocusManagement = () => {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const saveFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
  }, []);

  const restoreFocus = useCallback(() => {
    if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, []);

  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, []);

  return {
    saveFocus,
    restoreFocus,
    trapFocus,
  };
};

// High contrast mode detection
export const useHighContrastMode = () => {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    // Check for high contrast mode
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isHighContrast;
};

// Reduced motion detection
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};
