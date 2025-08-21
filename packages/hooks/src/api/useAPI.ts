/**
 * @fileoverview Hook básico para APIs
 */

import { useState, useCallback } from 'react';

export interface UseAPIOptions {
  baseURL?: string;
  headers?: Record<string, string>;
}

export function useAPI(options: UseAPIOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const request = useCallback(async <T>(
    url: string,
    config: RequestInit = {}
  ): Promise<T> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        ...config,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
          ...config.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [options]);

  return {
    request,
    loading,
    error,
  };
}