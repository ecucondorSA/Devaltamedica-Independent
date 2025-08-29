/**
 * @fileoverview Hook básico para clipboard
 */

import { useState, useCallback } from 'react';
import { logger } from '@altamedica/shared';
export function useClipboard() {
  const [hasCopied, setHasCopied] = useState(false);

  const onCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    } catch (error) {
      logger.error('Failed to copy:', error);
    }
  }, []);

  return { hasCopied, onCopy };
}
