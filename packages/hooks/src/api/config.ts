/**
 * @fileoverview Configuración para hooks de API
 */

export interface APIConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  headers: Record<string, string>;
}

export const DEFAULT_API_CONFIG: APIConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 10000,
  retryAttempts: 3,
  headers: {
    'Content-Type': 'application/json',
  },
};

export function createAPIConfig(overrides: Partial<APIConfig> = {}): APIConfig {
  return {
    ...DEFAULT_API_CONFIG,
    ...overrides,
  };
}