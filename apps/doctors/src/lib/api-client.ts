import { createApiClient } from '@altamedica/api-client';

import { logger } from '@altamedica/shared';
// Configuración base apuntando al api-server local en dev
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export const apiClient = createApiClient({
  baseURL: BASE_URL,
  onError: (err) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      logger.error('[API Client]', JSON.stringify(err, null, 2));
    }
  }
});

// Helper: compatibilidad con opciones { headers, params }
// el ApiClient.request acepta RequestInit; mapeamos params a querystring
export function withOptions(options?: { headers?: Record<string,string>; params?: Record<string,any>; token?: string }) {
  const headers = options?.headers;
  const token = options?.token;
  const params = options?.params;
  return {
    headers,
    token,
    getQuery: (path: string) => {
      if (!params) return path;
      const usp = new URLSearchParams();
      Object.entries(params).forEach(([k,v]) => {
        if (v !== undefined && v !== null) usp.append(k, String(v));
      });
      const qs = usp.toString();
      return qs ? `${path}?${qs}` : path;
    }
  };
}
