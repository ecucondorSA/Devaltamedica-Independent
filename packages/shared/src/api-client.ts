/**
 * 🌐 API CLIENT - ALTAMEDICA SHARED
 * Cliente de API reutilizable para todo el ecosistema
 */

import { logger } from './services/logger.service';

export interface APIResponse<T> {
  data: T
  message?: string
  status?: number
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    hasNext?: boolean
    hasPrev?: boolean
  }
}

// Configuración de la API
const getAPIBaseURL = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

// Utilidad para requests con tipos
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<APIResponse<T>> {
  const url = `${getAPIBaseURL()}${endpoint}`
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(url, config)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    logger.error(`API request failed for ${endpoint}:`, endpoint, error)
    throw error
  }
}

// Utilidades de construcción de queries
export function buildQueryParams(params: Record<string, any>): string {
  const queryParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, String(value))
    }
  })
  
  return queryParams.toString() ? `?${queryParams.toString()}` : ''
}

// Cliente base para servicios API
export class BaseAPIClient {
  constructor(private baseEndpoint: string) {}

  protected async get<T>(endpoint: string = ''): Promise<APIResponse<T>> {
    return apiRequest<T>(`${this.baseEndpoint}${endpoint}`)
  }

  protected async post<T>(data: any, endpoint: string = ''): Promise<APIResponse<T>> {
    return apiRequest<T>(`${this.baseEndpoint}${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  protected async put<T>(data: any, endpoint: string = ''): Promise<APIResponse<T>> {
    return apiRequest<T>(`${this.baseEndpoint}${endpoint}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  protected async delete<T>(endpoint: string = ''): Promise<APIResponse<T>> {
    return apiRequest<T>(`${this.baseEndpoint}${endpoint}`, {
      method: 'DELETE',
    })
  }
}

// Tipos de error estándar
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public endpoint: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

// Hook para autorización
export function withAuth(headers: Record<string, string> = {}): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  
  return {
    ...headers,
    ...(token && { 'Authorization': `Bearer ${token}` })
  }
}