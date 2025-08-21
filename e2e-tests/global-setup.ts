import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 [Global Setup] Iniciando configuración global de tests E2E...');
  
  // Configurar browser para tests
  const browser = await chromium.launch();
  const context = await browser.newContext({
    // Configuraciones específicas para AltaMedica
    ignoreHTTPSErrors: true,
    permissions: ['notifications', 'camera', 'microphone'],
    viewport: { width: 1920, height: 1080 }
  });
  
  // Verificar que los servidores estén listos
  const page = await context.newPage();
  
  const serversToCheck = [
    { name: 'api-server', url: 'http://localhost:3001/api/health', required: true },
    { name: 'web-app', url: 'http://localhost:3000', required: true },
    { name: 'doctors', url: 'http://localhost:3002', required: false },
    { name: 'patients', url: 'http://localhost:3003', required: false },
    { name: 'companies', url: 'http://localhost:3004', required: false }
  ];
  
  console.log('🔍 [Global Setup] Verificando disponibilidad de servidores...');
  
  for (const server of serversToCheck) {
    try {
      console.log(`Verificando ${server.name} en ${server.url}...`);
      const response = await page.goto(server.url, { waitUntil: 'networkidle', timeout: 10000 });
      
      if (response?.ok()) {
        console.log(`✅ ${server.name} está disponible`);
      } else if (server.required) {
        console.error(`❌ ${server.name} no responde correctamente`);
        throw new Error(`Servidor requerido ${server.name} no disponible`);
      } else {
        console.warn(`⚠️ ${server.name} no disponible (opcional)`);
      }
    } catch (error) {
      if (server.required) {
        console.error(`❌ Error conectando a ${server.name}:`, error);
        throw new Error(`No se puede conectar al servidor requerido ${server.name}`);
      } else {
        console.warn(`⚠️ ${server.name} no disponible (opcional):`, error);
      }
    }
  }
  
  await browser.close();
  console.log('✅ [Global Setup] Configuración global completada');
}

export default globalSetup;