#!/usr/bin/env node

/**
 * Script para configurar secrets locales sin AWS
 * Esto te permite desarrollar sin necesidad de AWS Secrets Manager
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔐 Configurando secrets locales para desarrollo...\n');

// Generar secrets seguros
const secrets = {
  JWT_SECRET: crypto.randomBytes(64).toString('hex'),
  JWT_REFRESH_SECRET: crypto.randomBytes(64).toString('hex'),
  ENCRYPTION_KEY: crypto.randomBytes(32).toString('hex'),
  SESSION_SECRET: crypto.randomBytes(32).toString('hex')
};

// Leer .env existente
const envPath = path.join(process.cwd(), '.env');
let envContent = '';

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

// Agregar secrets si no existen
let updated = false;
Object.entries(secrets).forEach(([key, value]) => {
  if (!envContent.includes(key)) {
    envContent += `\n${key}=${value}`;
    updated = true;
    console.log(`✅ Generado: ${key}`);
  } else {
    console.log(`⏩ Ya existe: ${key}`);
  }
});

// Agregar configuración AWS mock para desarrollo
const awsConfig = `
# AWS Configuration (Local Development - No real AWS needed)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=local-development-key
AWS_SECRET_ACCESS_KEY=local-development-secret
USE_LOCAL_SECRETS=true
`;

if (!envContent.includes('AWS_REGION')) {
  envContent += awsConfig;
  console.log('✅ Agregada configuración AWS local');
}

// Guardar .env actualizado
if (updated) {
  fs.writeFileSync(envPath, envContent.trim() + '\n');
  console.log('\n✅ Archivo .env actualizado con secrets locales');
}

// Crear archivo de secrets locales para simular AWS Secrets Manager
const localSecretsPath = path.join(process.cwd(), 'config', 'local-secrets.json');
const localSecrets = {
  "altamedica/jwt": {
    JWT_SECRET: secrets.JWT_SECRET,
    JWT_REFRESH_SECRET: secrets.JWT_REFRESH_SECRET
  },
  "altamedica/encryption": {
    ENCRYPTION_KEY: secrets.ENCRYPTION_KEY
  },
  "altamedica/session": {
    SESSION_SECRET: secrets.SESSION_SECRET
  }
};

// Crear directorio config si no existe
if (!fs.existsSync(path.dirname(localSecretsPath))) {
  fs.mkdirSync(path.dirname(localSecretsPath), { recursive: true });
}

fs.writeFileSync(localSecretsPath, JSON.stringify(localSecrets, null, 2));
console.log('✅ Creado archivo config/local-secrets.json');

console.log('\n📝 Próximos pasos:');
console.log('1. Los secrets se han generado localmente');
console.log('2. No necesitas AWS para desarrollo local');
console.log('3. Para producción, sube estos secrets a AWS Secrets Manager');
console.log('\n🚀 ¡Listo para desarrollo local!');