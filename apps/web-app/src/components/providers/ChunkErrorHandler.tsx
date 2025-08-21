'use client';

import { setupChunkErrorHandler } from '@/utils/chunk-error-handler';
import { useEffect } from 'react';

/**
 * Client component that sets up chunk error handling
 */
export default function ChunkErrorHandler() {
  useEffect(() => {
    setupChunkErrorHandler();
  }, []);

  return null;
}
