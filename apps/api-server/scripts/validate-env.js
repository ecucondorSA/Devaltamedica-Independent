#!/usr/bin/env node
/**
 * Environment Validation Script
 * Valida que todas las variables críticas estén configuradas antes del deploy
 * 
 * Uso:
 * - pnpm run validate:env:staging
 * - pnpm run validate:env:production
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { logger } from '@altamedica/shared/services/logger.service';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de validación por ambiente
const ENV_CONFIGS = {
    staging: {
        required: [
            'NODE_ENV',
            'PORT',
            'API_URL',
            'FIREBASE_PROJECT_ID',
            'FIREBASE_CLIENT_EMAIL',
            'FIREBASE_PRIVATE_KEY',
            'JWT_SECRET',
            'JWT_REFRESH_SECRET',
            'ENCRYPTION_SECRET',
            'ALLOWED_ORIGINS',
            'SIGNALING_SERVER_URL'
        ],
        critical: [
            'JWT_SECRET',
            'JWT_REFRESH_SECRET',
            'ENCRYPTION_SECRET',
            'FIREBASE_PRIVATE_KEY'
        ],
        file: '.env.staging'
    },
    production: {
        required: [
            'NODE_ENV',
            'PORT',
            'API_URL',
            'FIREBASE_PROJECT_ID',
            'FIREBASE_CLIENT_EMAIL',
            'FIREBASE_PRIVATE_KEY',
            'JWT_SECRET',
            'JWT_REFRESH_SECRET',
            'ENCRYPTION_SECRET',
            'ALLOWED_ORIGINS',
            'SIGNALING_SERVER_URL',
            'DATABASE_URL',
            'REDIS_URL'
        ],
        critical: [
            'JWT_SECRET',
            'JWT_REFRESH_SECRET',
            'ENCRYPTION_SECRET',
            'FIREBASE_PRIVATE_KEY',
            'DATABASE_URL'
        ],
        file: '.env.production'
    }
};

// Función para leer archivo .env
function readEnvFile(envPath) {
    const env = {};
    if (!fs.existsSync(envPath)) {
        throw new Error(`Archivo ${envPath} no encontrado`);
    }

    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            if (key && valueParts.length > 0) {
                env[key.trim()] = valueParts.join('=').trim();
            }
        }
    }

    return env;
}

// Función para validar variables
function validateEnvironment(env, config, envName) {
    const errors = [];
    const warnings = [];

    logger.info(`🔍 Validando ${envName}...`);

    // Validar variables requeridas
    for (const required of config.required) {
        if (!env[required] || env[required] === '') {
            errors.push(`❌ Variable requerida faltante: ${required}`);
        } else if (env[required].includes('REPLACE_WITH_ACTUAL')) {
            errors.push(`❌ Variable ${required} contiene placeholder: ${env[required]}`);
        }
    }

    // Validar variables críticas
    for (const critical of config.critical) {
        if (env[critical]) {
            const value = env[critical];
            if (value.length < 32) {
                warnings.push(`⚠️  Variable crítica ${critical} parece muy corta (${value.length} chars)`);
            }
            if (value.includes('dev-') || value.includes('test-') || value.includes('mock')) {
                errors.push(`❌ Variable crítica ${critical} contiene valor de desarrollo: ${value}`);
            }
        }
    }

    // Validar NODE_ENV
    if (env.NODE_ENV !== envName) {
        errors.push(`❌ NODE_ENV debe ser '${envName}', actual: ${env.NODE_ENV}`);
    }

    // Validar URLs
    if (env.API_URL && !env.API_URL.startsWith('https://')) {
        warnings.push(`⚠️  API_URL debería usar HTTPS en ${envName}: ${env.API_URL}`);
    }

    if (env.ALLOWED_ORIGINS && env.ALLOWED_ORIGINS.includes('localhost')) {
        warnings.push(`⚠️  ALLOWED_ORIGINS contiene localhost en ${envName}: ${env.ALLOWED_ORIGINS}`);
    }

    // Validar flags de seguridad
    const securityFlags = ['RATE_LIMIT_ENABLED', 'AUDIT_LOGGING_ENABLED', 'RBAC_ENABLED'];
    for (const flag of securityFlags) {
        if (env[flag] === 'false') {
            warnings.push(`⚠️  Flag de seguridad ${flag} está deshabilitado en ${envName}`);
        }
    }

    return { errors, warnings };
}

// Función principal
function main() {
    const envName = process.argv[2];

    if (!envName || !ENV_CONFIGS[envName]) {
        logger.error('❌ Uso: node validate-env.js <staging|production>');
        logger.error('   Ejemplo: node validate-env.js production');
        process.exit(1);
    }

    const config = ENV_CONFIGS[envName];
    const envPath = path.join(__dirname, '..', config.file);

    try {
        const env = readEnvFile(envPath);
        const { errors, warnings } = validateEnvironment(env, config, envName);

        // Mostrar resultados
        if (warnings.length > 0) {
            logger.info('\n⚠️  ADVERTENCIAS:');
            warnings.forEach(w => logger.info(`  ${w}`));
        }

        if (errors.length > 0) {
            logger.info('\n❌ ERRORES CRÍTICOS:');
            errors.forEach(e => logger.info(`  ${e}`));
            logger.info('\n🚫 Deploy bloqueado. Corrige los errores antes de continuar.');
            process.exit(1);
        }

        logger.info('\n✅ Validación exitosa. Todas las variables críticas están configuradas.');
        logger.info(`📋 Archivo validado: ${config.file}`);

    } catch (error) {
        logger.error(`❌ Error durante la validación: ${error.message}`);
        process.exit(1);
    }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
