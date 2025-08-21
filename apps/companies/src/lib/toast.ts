// Simple toast implementation for BAA components
import { logger } from '@altamedica/shared/services/logger.service';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const toast = (options: ToastOptions) => {
    // Log to console for now - can be replaced with a proper toast library later
    const type = options.variant === 'destructive' ? 'ERROR' : 'INFO';
    logger.info(`[${type}] ${options.title}${options.description ? ': ' + options.description : ''}`);
    
    // You could also dispatch a custom event here for a global toast handler
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('toast', { detail: options }));
    }
  };

  return { toast };
}