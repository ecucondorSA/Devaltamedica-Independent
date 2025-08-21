/**
 * @fileoverview Hook useCopyToClipboard para copiar al portapapeles
 */

import { useState, useCallback } from 'react';
import type { CopyToClipboardResult } from './types';

export function useCopyToClipboard(): CopyToClipboardResult {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const copy = useCallback(async (text: string): Promise<boolean> => {
    if (!navigator?.clipboard) {
      const error = new Error('Clipboard not supported');
      setError(error);
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setError(null);
      
      // Reset después de 2 segundos
      setTimeout(() => setCopied(false), 2000);
      
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to copy');
      setError(error);
      setCopied(false);
      return false;
    }
  }, []);

  const reset = useCallback(() => {
    setCopied(false);
    setError(null);
  }, []);

  return { copy, copied, error, reset };
}