#!/usr/bin/env node

/**
 * Migrar de AWS a Vercel (PostgreSQL + KV)
 * No más AWS, todo en Vercel que es más simple
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Migrando de AWS a Vercel Storage\n');

// Leer .env actual
const envPath = path.join(process.cwd(), '.env');
let envContent = fs.readFileSync(envPath, 'utf8');

// Eliminar configuración AWS
const awsVars = [
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID', 
  'AWS_SECRET_ACCESS_KEY',
  'AWS_SECRET_NAME',
  'USE_LOCAL_SECRETS'
];

awsVars.forEach(varName => {
  const regex = new RegExp(`^${varName}=.*$`, 'gm');
  envContent = envContent.replace(regex, '');
});

// Limpiar líneas vacías múltiples
envContent = envContent.replace(/\n\n+/g, '\n\n');

// Agregar configuración Vercel
const vercelConfig = `
# ===================================
# VERCEL STORAGE (Sin AWS!)
# ===================================

# Vercel Postgres (reemplaza DATABASE_URL)
# Ve a: https://vercel.com/dashboard/stores
# Crea un Postgres y copia las credenciales aquí
POSTGRES_URL=""
POSTGRES_PRISMA_URL=""
POSTGRES_URL_NON_POOLING=""
POSTGRES_USER=""
POSTGRES_HOST=""
POSTGRES_PASSWORD=""
POSTGRES_DATABASE=""

# Vercel KV (Redis + Secrets storage)
KV_URL=""
KV_REST_API_URL=""
KV_REST_API_TOKEN=""
KV_REST_API_READ_ONLY_TOKEN=""

# Usar Vercel en lugar de AWS
USE_VERCEL_STORAGE=true
`;

// Actualizar DATABASE_URL para usar Vercel Postgres
envContent = envContent.replace(
  /DATABASE_URL=.*/g,
  '# DATABASE_URL se usa ahora desde POSTGRES_PRISMA_URL de Vercel'
);

// Actualizar REDIS_URL para usar Vercel KV
envContent = envContent.replace(
  /REDIS_URL=.*/g, 
  '# REDIS_URL se usa ahora desde KV_URL de Vercel'
);

// Guardar .env actualizado
fs.writeFileSync(envPath, envContent + vercelConfig);

console.log('✅ Archivo .env actualizado para Vercel\n');

// Crear nuevo secrets loader para Vercel
const vercelSecretsLoader = `import { kv } from '@vercel/kv';

/**
 * Carga secrets desde Vercel KV (Sin AWS!)
 * Mucho más simple que AWS Secrets Manager
 */
export async function initSecrets() {
  console.log('[secrets-loader] 🚀 Cargando secrets desde Vercel KV...');
  
  try {
    // Si estamos en desarrollo local, usar .env
    if (!process.env.KV_REST_API_URL) {
      console.log('[secrets-loader] 📁 Usando secrets locales desde .env');
      return;
    }
    
    // Cargar secrets desde Vercel KV
    const secrets = await kv.hgetall('secrets:altamedica');
    
    if (secrets) {
      // JWT Secrets
      if (secrets.JWT_SECRET) process.env.JWT_SECRET = secrets.JWT_SECRET;
      if (secrets.JWT_REFRESH_SECRET) process.env.JWT_REFRESH_SECRET = secrets.JWT_REFRESH_SECRET;
      if (secrets.ENCRYPTION_KEY) process.env.ENCRYPTION_KEY = secrets.ENCRYPTION_KEY;
      
      console.log('[secrets-loader] ✅ Secrets cargados desde Vercel KV');
    } else {
      // Si no hay secrets en KV, guardarlos
      const localSecrets = {
        JWT_SECRET: process.env.JWT_SECRET,
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET, 
        ENCRYPTION_KEY: process.env.ENCRYPTION_KEY
      };
      
      await kv.hset('secrets:altamedica', localSecrets);
      console.log('[secrets-loader] 📝 Secrets guardados en Vercel KV');
    }
  } catch (error) {
    console.log('[secrets-loader] ⚠️ KV no disponible, usando .env local');
  }
}
`;

// Guardar nuevo loader
const loaderPath = path.join(process.cwd(), 'apps', 'api-server', 'src', 'config', 'vercel-secrets-loader.ts');
fs.writeFileSync(loaderPath, vercelSecretsLoader);

console.log('✅ Creado nuevo loader: apps/api-server/src/config/vercel-secrets-loader.ts\n');

// Actualizar package.json para agregar @vercel/kv
const packageJsonPath = path.join(process.cwd(), 'apps', 'api-server', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

if (!packageJson.dependencies['@vercel/kv']) {
  packageJson.dependencies['@vercel/kv'] = '^0.2.4';
  packageJson.dependencies['@vercel/postgres'] = '^0.5.1';
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Agregadas dependencias de Vercel al package.json\n');
}

console.log('📋 Próximos pasos:');
console.log('1. Ve a https://vercel.com/dashboard/stores');
console.log('2. Crea un Postgres database');
console.log('3. Crea un KV store'); 
console.log('4. Copia las credenciales a tu .env');
console.log('5. Ejecuta: cd apps/api-server && pnpm install');
console.log('6. Ejecuta: pnpm dev');
console.log('\n🎉 ¡Adiós AWS, hola Vercel!');