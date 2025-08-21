import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🛑 [Global Teardown] Iniciando limpieza global de tests E2E...');
  
  // Limpieza de archivos temporales si es necesario
  // No matamos los servidores aquí porque pueden estar siendo usados en desarrollo
  
  console.log('✅ [Global Teardown] Limpieza global completada');
}

export default globalTeardown;