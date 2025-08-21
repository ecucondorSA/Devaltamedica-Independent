// Configuración de URLs para los diferentes microservicios
// Estas URLs deben ajustarse según el entorno (desarrollo, staging, producción)

import { logger } from '@altamedica/shared/services/logger.service';

interface AppUrls {
  patients: string;
  doctors: string;
  companies: string;
  admin: string;
  medical: string;
}

// URLs para desarrollo local
const developmentUrls: AppUrls = {
  patients: 'http://localhost:3003',    // Portal de pacientes
  doctors: 'http://localhost:3002',     // Portal de doctores
  companies: 'http://localhost:3004',   // Portal de empresas
  admin: 'http://localhost:3005',       // Panel administrativo
  medical: 'http://localhost:3006'      // Sistema médico
};

// URLs para Ngrok (desarrollo remoto)
const ngrokUrls: AppUrls = {
  patients: 'https://altamedica-patients.ngrok.io',
  doctors: 'https://altamedica-doctors.ngrok.io',
  companies: 'https://altamedica-companies.ngrok.io', 
  admin: 'https://altamedica-admin.ngrok.io',
  medical: 'https://altamedica-api.ngrok.io'
};

// URLs para producción (ajustar según tu configuración de dominios)
const productionUrls: AppUrls = {
  patients: 'https://patients.altamedica.com',
  doctors: 'https://doctors.altamedica.com', 
  companies: 'https://companies.altamedica.com',
  admin: 'https://admin.altamedica.com',
  medical: 'https://medical.altamedica.com'
};

// Detectar el entorno actual
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
const isNgrok = process.env.NEXT_PUBLIC_USE_NGROK === 'true' || 
              (typeof window !== 'undefined' && window.location.hostname.includes('ngrok.io'));

// Exportar las URLs según el entorno
export const APP_URLS: AppUrls = isProduction 
  ? productionUrls 
  : isNgrok 
    ? ngrokUrls 
    : developmentUrls;

// Función helper para obtener la URL del dashboard según el tipo de usuario
export function getDashboardUrl(userType: 'patient' | 'doctor' | 'company' | 'admin'): string {
  logger.info('🔍 [getDashboardUrl] Llamado con userType:', userType);
  
  let url = '/';
  switch (userType) {
    case 'patient':
      url = APP_URLS.patients; // Ya apunta a http://localhost:3003 (raíz)
      break;
    case 'doctor':
      url = `${APP_URLS.doctors}/dashboard`;
      break;
    case 'company':
      url = `${APP_URLS.companies}/dashboard`;
      break;
    case 'admin':
      url = `${APP_URLS.admin}/dashboard`;
      break;
    default:
      // Fallback a la página principal de web-app
      logger.warn('⚠️ [getDashboardUrl] Tipo de usuario desconocido:', userType);
      url = '/';
  }
  
  logger.info('✅ [getDashboardUrl] Retornando URL:', url);
  return url;
}

// Función para obtener la URL base según el tipo de usuario
export function getAppBaseUrl(userType: 'patient' | 'doctor' | 'company' | 'admin'): string {
  switch (userType) {
    case 'patient':
      return APP_URLS.patients;
    case 'doctor':
      return APP_URLS.doctors;
    case 'company':
      return APP_URLS.companies;
    case 'admin':
      return APP_URLS.admin;
    default:
      return '/';
  }
}

// Función para verificar si una URL es externa (para manejar redirecciones)
export function isExternalUrl(url: string): boolean {
  try {
    const urlObj = new URL(url, window.location.origin);
    return urlObj.origin !== window.location.origin;
  } catch {
    return false;
  }
}
