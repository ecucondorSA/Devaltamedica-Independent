import { useState } from 'react';

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  status?: 'success' | 'error' | 'warning' | 'info';
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastOptions[]>([]);

  const toast = (options: ToastOptions) => {
    console.log('Toast:', options);
    setToasts((prev) => [...prev, options]);
  };

  return { toast };
};
