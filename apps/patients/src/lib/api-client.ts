/**
 * 🔧 API CLIENT CONFIGURATION - PATIENTS APP
 * Configuración centralizada del cliente API
 * MIGRADO: Ahora usa @altamedica/firebase en lugar de firebase-config
 */

import { createApiClient } from '@altamedica/api-client';
import { auth } from '@altamedica/firebase';

import { logger } from '@altamedica/shared';
// Crear instancia del cliente API
export const apiClient = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000,
  
  // Callback para renovar token cuando expire
  onTokenExpired: async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const newToken = await user.getIdToken(true);
        return newToken;
      }
      return null;
    } catch (error) {
      logger.error('Error refreshing token:', error);
      return null;
    }
  },
  
  // Callback para manejar errores globalmente
  onError: (error) => {
    // Log para debugging
    logger.error('API Error:', error);
    
    // Manejar errores específicos
    if (error.statusCode === 401) {
      // Redirigir a login si no está autenticado
      window.location.href = '/login';
    } else if (error.statusCode === 403) {
      // Mostrar mensaje de no autorizado
      logger.error('No tienes permisos para realizar esta acción');
    }
  },
});

// Función helper para actualizar el token cuando el usuario se loguea
export async function updateApiToken() {
  try {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      apiClient.setAccessToken(token);
    } else {
      apiClient.setAccessToken(null);
    }
  } catch (error) {
    logger.error('Error updating API token:', error);
    apiClient.setAccessToken(null);
  }
}

// Escuchar cambios de autenticación para actualizar el token
auth.onAuthStateChanged(async (user) => {
  if (user) {
    const token = await user.getIdToken();
    apiClient.setAccessToken(token);
  } else {
    apiClient.setAccessToken(null);
  }
});