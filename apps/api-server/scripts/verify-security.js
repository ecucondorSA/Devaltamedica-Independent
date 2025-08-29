#!/usr/bin/env node
import { logger } from '@altamedica/shared/services/logger.service';
/**
 * 🛡️ ALTAMEDICA - SECURITY VERIFICATION SCRIPT
 * Verifica que las mejoras de seguridad estén correctamente implementadas
 */

import fs from 'fs';
import path from 'path';

logger.info('🔍 ALTAMEDICA SECURITY VERIFICATION');
logger.info('===================================');

let allTestsPassed = true;
const results = [];

function test(name, condition, message) {
  const passed = condition;
  const status = passed ? '✅' : '❌';
  logger.info(`${status} ${name}: ${message}`);
  results.push({ name, passed, message });
  if (!passed) allTestsPassed = false;
  return passed;
}

// 1. Verificar que tokens hardcodeados fueron removidos
logger.info('\n🚨 1. VERIFICACIÓN DE TOKENS HARDCODEADOS');
test(
  'Tokens hardcodeados removidos',
  !fs.readFileSync('src/lib/security.ts', 'utf8').includes('test-jwt-token-altamedica'),
  'Token hardcodeado removido de security.ts'
);

test(
  'Fallback JWT secret removido',
  !fs.readFileSync('src/lib/auth.ts', 'utf8').includes('altamedica-jwt-secret'),
  'Fallback JWT secret removido de auth.ts'
);

// 2. Verificar archivos de seguridad nuevos
logger.info('\n🔐 2. VERIFICACIÓN DE ARCHIVOS DE SEGURIDAD');
test(
  'Audit logger creado',
  fs.existsSync('src/lib/audit-logger.ts'),
  'Sistema de audit logging HIPAA implementado'
);

test(
  'Rate limiting seguro creado',
  fs.existsSync('src/lib/secure-rate-limit.ts'),
  'Rate limiting escalable implementado'
);

test(
  'Autenticación segura creada',
  fs.existsSync('src/lib/secure-auth.ts'),
  'Sistema de autenticación unificado implementado'
);

// 3. Verificar configuración de Next.js
logger.info('\n⚙️ 3. VERIFICACIÓN DE CONFIGURACIÓN');
const nextConfig = fs.readFileSync('next.config.mjs', 'utf8');
test(
  'React Strict Mode habilitado',
  nextConfig.includes('reactStrictMode: true'),
  'Strict mode habilitado para mejor desarrollo'
);

test(
  'TypeScript checks habilitados',
  nextConfig.includes('ignoreBuildErrors: false'),
  'TypeScript error checking habilitado'
);

test(
  'ESLint checks habilitados',
  nextConfig.includes('ignoreDuringBuilds: false'),
  'ESLint checks habilitados en builds'
);

// 4. Verificar variables de entorno
logger.info('\n🔑 4. VERIFICACIÓN DE VARIABLES DE ENTORNO');
const envLocal = fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf8') : '';
test(
  'JWT_SECRET configurado',
  envLocal.includes('JWT_SECRET=') && !envLocal.includes('CHANGE_THIS'),
  'JWT secret seguro configurado'
);

test(
  'Encryption key configurado',
  envLocal.includes('ENCRYPTION_KEY=') && !envLocal.includes('CHANGE_THIS'),
  'Clave de encriptación configurada'
);

test(
  'Audit logging habilitado',
  envLocal.includes('ENABLE_AUDIT_LOGGING=true'),
  'Audit logging habilitado en configuración'
);

// 5. Verificar endpoint actualizado
logger.info('\n🔗 5. VERIFICACIÓN DE ENDPOINTS');
const loginRoute = fs.readFileSync('src/app/api/v1/auth/login/route.ts', 'utf8');
test(
  'Login endpoint refactorizado',
  loginRoute.includes('auditLogger') && loginRoute.includes('authRateLimiter'),
  'Endpoint de login incluye audit logging y rate limiting'
);

test(
  'Headers de seguridad en login',
  loginRoute.includes('X-Content-Type-Options') && loginRoute.includes('X-Frame-Options'),
  'Headers de seguridad implementados'
);

// 6. Verificar que directorios de logs existan
logger.info('\n📁 6. VERIFICACIÓN DE ESTRUCTURA');
test(
  'Directorio de logs preparado',
  fs.existsSync('logs') || envLocal.includes('AUDIT_LOG_DIRECTORY'),
  'Estructura para audit logs preparada'
);

// Resumen final
logger.info('\n📊 RESUMEN DE VERIFICACIÓN');
logger.info('==========================');

const passed = results.filter(r => r.passed).length;
const total = results.length;
const percentage = Math.round((passed / total) * 100);

logger.info(`✅ Tests pasados: ${passed}/${total} (${percentage}%)`);

if (allTestsPassed) {
  logger.info('\n🎉 ¡TODAS LAS VERIFICACIONES DE SEGURIDAD PASARON!');
  logger.info('✅ El API Server tiene las mejoras de seguridad implementadas');
  logger.info('✅ Vulnerabilidades críticas eliminadas');
  logger.info('✅ Sistemas de audit logging y rate limiting implementados');
  logger.info('\n🚀 SIGUIENTE PASO: Instalar dependencias y probar en desarrollo');
  logger.info('   pnpm install && pnpm run dev');
} else {
  logger.info('\n⚠️ ALGUNAS VERIFICACIONES FALLARON');
  logger.info('❌ Revisar los items marcados arriba');
  logger.info('📝 Consultar SECURITY_IMPROVEMENTS_SUMMARY.md para detalles');
}

// Verificaciones adicionales recomendadas
logger.info('\n🔍 VERIFICACIONES ADICIONALES RECOMENDADAS:');
logger.info('1. Ejecutar: pnpm run build (verificar que compile sin errores)');
logger.info('2. Ejecutar: pnpm run type-check (verificar tipos)');
logger.info('3. Probar rate limiting: curl multiple requests to auth endpoint');
logger.info('4. Verificar audit logs: tail -f logs/audit/audit-$(date +%Y-%m-%d).jsonl');
logger.info('5. Test de penetración básico en endpoints de auth');

process.exit(allTestsPassed ? 0 : 1);
