/**
 * 📡 API CLIENT ADAPTER - DOCTORS APP
 * Adaptador para usar axios con la interfaz ApiClient de @altamedica/patient-services
 */

import axios from 'axios';
import type { ApiResponse, ApiClient } from '@altamedica/patient-services';

import { logger } from '@altamedica/shared';
// Configuración de la API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Instancia de axios configurada
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token de autenticación
axiosInstance.interceptors.request.use(async (config) => {
  try {
    // Obtener token de Firebase Auth
    const user = JSON.parse(localStorage.getItem('firebase:authUser:demo-api-key:[DEFAULT]') || '{}');
    if (user.stsTokenManager?.accessToken) {
      config.headers.Authorization = `Bearer ${user.stsTokenManager.accessToken}`;
    }
  } catch (error) {
    logger.warn('No se pudo obtener token de autenticación:', String(error));
  }
  return config;
});

// Adaptador que convierte respuestas de axios al formato ApiResponse
class AxiosApiClientAdapter implements ApiClient {
  
  private handleResponse<T>(axiosPromise: Promise<any>): Promise<ApiResponse<T>> {
    return axiosPromise
      .then(response => ({
        success: true,
        data: response.data,
        status: response.status
      }))
      .catch(error => ({
        success: false,
        error: error.response?.data?.message || error.message || 'Error de conexión',
        status: error.response?.status || 0
      }));
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.handleResponse<T>(axiosInstance.get(endpoint));
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.handleResponse<T>(axiosInstance.post(endpoint, data));
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.handleResponse<T>(axiosInstance.put(endpoint, data));
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.handleResponse<T>(axiosInstance.patch(endpoint, data));
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.handleResponse<T>(axiosInstance.delete(endpoint));
  }
}

// Instancia singleton del adaptador
export const apiClient = new AxiosApiClientAdapter();

// Exportar también para compatibilidad
export default apiClient;
