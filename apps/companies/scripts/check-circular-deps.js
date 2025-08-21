import { logger } from '@altamedica/shared/services/logger.service';

#!/usr/bin/env node

/**
 * Script para detectar dependencias circulares en el proyecto
 * Uso: node scripts/check-circular-deps.js
 */

const { execSync } = require('child_process');
const path = require('path');

logger.info('🔍 Analizando dependencias circulares...\n');

try {
  // Instalar madge si no está instalado
  try {
    require.resolve('madge');
  } catch (e) {
    logger.info('📦 Instalando madge...');
    execSync('npm install --save-dev madge', { stdio: 'inherit' });
  }

  // Analizar el directorio src
  logger.info('📊 Analizando src/...');
  const result = execSync('npx madge --circular src/', { 
    encoding: 'utf-8',
    cwd: path.resolve(__dirname, '..')
  });

  if (result.trim()) {
    logger.info('❌ Dependencias circulares encontradas:\n');
    logger.info(result);
    process.exit(1);
  } else {
    logger.info('✅ No se encontraron dependencias circulares\n');
  }

  // Analizar específicamente page.tsx
  logger.info('📊 Analizando page.tsx específicamente...');
  const pageResult = execSync('npx madge --circular src/app/page.tsx', { 
    encoding: 'utf-8',
    cwd: path.resolve(__dirname, '..')
  });

  if (pageResult.trim()) {
    logger.info('❌ Dependencias circulares en page.tsx:\n');
    logger.info(pageResult);
  } else {
    logger.info('✅ page.tsx no tiene dependencias circulares\n');
  }

} catch (error) {
  logger.error('❌ Error al analizar dependencias:', error.message);
  process.exit(1);
}