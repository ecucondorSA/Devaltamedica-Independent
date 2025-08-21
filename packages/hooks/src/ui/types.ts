/**
 * @fileoverview Tipos para hooks UI
 */

export interface DisclosureState {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onToggle: () => void;
}

export interface ModalOptions {
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  blockScrollOnMount?: boolean;
}

export interface ToastOptions {
  title: string;
  description?: string;
  status?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  isClosable?: boolean;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Breakpoint {
  base: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}