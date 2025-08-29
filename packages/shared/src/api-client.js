/**
 * 🌐 API CLIENT - ALTAMEDICA SHARED
 * Cliente de API reutilizable para todo el ecosistema
 */
import { logger } from './services/logger.service';
// Configuración de la API
const getAPIBaseURL = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
// Utilidad para requests con tipos
export async function apiRequest(endpoint, options = {}) {
    const url = `${getAPIBaseURL()}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    };
    try {
        const response = await fetch(url, config);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    }
    catch (error) {
        logger.error(`API request failed for ${endpoint}:`, error);
        throw error;
    }
}
// Utilidades de construcción de queries
export function buildQueryParams(params) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
        }
    });
    return queryParams.toString() ? `?${queryParams.toString()}` : '';
}
// Cliente base para servicios API
export class BaseAPIClient {
    baseEndpoint;
    constructor(baseEndpoint) {
        this.baseEndpoint = baseEndpoint;
    }
    async get(endpoint = '') {
        return apiRequest(`${this.baseEndpoint}${endpoint}`);
    }
    async post(data, endpoint = '') {
        return apiRequest(`${this.baseEndpoint}${endpoint}`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
    async put(data, endpoint = '') {
        return apiRequest(`${this.baseEndpoint}${endpoint}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }
    async delete(endpoint = '') {
        return apiRequest(`${this.baseEndpoint}${endpoint}`, {
            method: 'DELETE',
        });
    }
}
// Tipos de error estándar
export class APIError extends Error {
    status;
    endpoint;
    constructor(message, status, endpoint) {
        super(message);
        this.status = status;
        this.endpoint = endpoint;
        this.name = 'APIError';
    }
}
// Hook para autorización
export function withAuth(headers = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
        ...headers,
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
}
