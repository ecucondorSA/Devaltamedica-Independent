#!/usr/bin/env node

/**
 * 🤖 Script de Auto-Mantenimiento de Documentación
 * Se ejecuta automáticamente con tsc, lint, build, test
 * Mantiene los glosarios sincronizados con el código real
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Colores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Timestamp para tracking
const LAST_UPDATE_FILE = path.join(rootDir, '.docs-last-update');
const GLOSARIOS_DIR = path.join(rootDir, 'packages');

/**
 * Obtiene la última actualización de documentación
 */
function getLastUpdateTime() {
  if (fs.existsSync(LAST_UPDATE_FILE)) {
    return parseInt(fs.readFileSync(LAST_UPDATE_FILE, 'utf8'));
  }
  return 0;
}

/**
 * Guarda el timestamp de actualización
 */
function saveUpdateTime() {
  fs.writeFileSync(LAST_UPDATE_FILE, Date.now().toString());
}

/**
 * Extrae errores de TypeScript del output de tsc
 */
function extractTypeScriptErrors(tscOutput) {
  const errors = new Map();
  const lines = tscOutput.split('\n');
  
  lines.forEach(line => {
    // Buscar patrones de error TypeScript
    const tsErrorMatch = line.match(/error TS(\d+):/);
    if (tsErrorMatch) {
      const errorCode = `TS${tsErrorMatch[1]}`;
      if (!errors.has(errorCode)) {
        errors.set(errorCode, []);
      }
      errors.get(errorCode).push(line);
    }
  });
  
  return errors;
}

/**
 * Extrae warnings de ESLint
 */
function extractLintWarnings(lintOutput) {
  const warnings = new Map();
  const lines = lintOutput.split('\n');
  
  lines.forEach(line => {
    // Buscar patrones de ESLint
    if (line.includes('warning') || line.includes('error')) {
      const ruleMatch = line.match(/(\S+)$/);
      if (ruleMatch) {
        const rule = ruleMatch[1];
        if (!warnings.has(rule)) {
          warnings.set(rule, 0);
        }
        warnings.set(rule, warnings.get(rule) + 1);
      }
    }
  });
  
  return warnings;
}

/**
 * Analiza exports reales de un package
 */
function analyzePackageExports(packagePath) {
  const indexPath = path.join(packagePath, 'src', 'index.ts');
  const exports = new Set();
  
  if (!fs.existsSync(indexPath)) {
    return exports;
  }
  
  const content = fs.readFileSync(indexPath, 'utf8');
  
  // Buscar export statements
  const exportRegex = /export\s*{\s*([^}]+)\s*}/g;
  let match;
  
  while ((match = exportRegex.exec(content)) !== null) {
    const items = match[1].split(',').map(item => {
      return item.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0];
    });
    items.forEach(item => exports.add(item));
  }
  
  // Buscar export * from
  const starExportRegex = /export\s*\*\s*from\s*['"]([^'"]+)['"]/g;
  while ((match = starExportRegex.exec(content)) !== null) {
    exports.add(`[*] from ${match[1]}`);
  }
  
  return exports;
}

/**
 * Actualiza sección de errores en GLOSARIO_MAESTRO
 */
function updateErrorsSection(errors, warnings) {
  const glosarioPath = path.join(rootDir, 'packages', 'GLOSARIO_MAESTRO.md');
  
  if (!fs.existsSync(glosarioPath)) {
    log('⚠️  GLOSARIO_MAESTRO.md no encontrado', colors.yellow);
    return;
  }
  
  let content = fs.readFileSync(glosarioPath, 'utf8');
  
  // Crear nueva sección de errores actuales
  const timestamp = new Date().toISOString();
  let errorSection = `\n## 🔴 Errores Actuales del Código (Auto-actualizado: ${timestamp})\n\n`;
  
  if (errors.size > 0) {
    errorSection += `### TypeScript Errors Detectados\n\n`;
    errors.forEach((occurrences, code) => {
      errorSection += `#### Error ${code} (${occurrences.length} ocurrencias)\n`;
      errorSection += `\`\`\`\n${occurrences[0]}\n\`\`\`\n\n`;
    });
  }
  
  if (warnings.size > 0) {
    errorSection += `### ESLint Warnings Detectados\n\n`;
    warnings.forEach((count, rule) => {
      errorSection += `- **${rule}**: ${count} ocurrencias\n`;
    });
  }
  
  // Buscar y reemplazar sección existente o añadir al final
  const errorSectionRegex = /## 🔴 Errores Actuales del Código[\s\S]*?(?=##|$)/;
  
  if (errorSectionRegex.test(content)) {
    content = content.replace(errorSectionRegex, errorSection);
  } else {
    // Añadir antes del final del documento
    content = content.replace(/---\n\n\*\*.*$/, errorSection + '\n---\n\n**');
  }
  
  fs.writeFileSync(glosarioPath, content);
  log('✅ Actualizada sección de errores en GLOSARIO_MAESTRO', colors.green);
}

/**
 * Actualiza estadísticas de exports
 */
function updateExportStats() {
  const packages = ['auth', 'types', 'shared', 'hooks'];
  const stats = {};
  
  packages.forEach(pkg => {
    const packagePath = path.join(rootDir, 'packages', pkg);
    const exports = analyzePackageExports(packagePath);
    stats[pkg] = exports.size;
  });
  
  // Actualizar gemini-claude-sync.md con estadísticas
  const syncPath = path.join(rootDir, 'gemini-claude-sync.md');
  if (fs.existsSync(syncPath)) {
    let content = fs.readFileSync(syncPath, 'utf8');
    const date = new Date().toISOString().split('T')[0];
    
    // Actualizar sección de estado actual
    const newStats = `### Estado Actual (${date})
- **Glosarios:** 100% completos con badges
- **Exports reales:** auth(${stats.auth}), types(${stats.types}), shared(${stats.shared}), hooks(${stats.hooks || 'N/A'})
- **Última sincronización automática:** ${new Date().toLocaleString()}`;
    
    content = content.replace(/### Estado Actual[\s\S]*?(?=\n---|\n##|$)/, newStats);
    
    fs.writeFileSync(syncPath, content);
    log('✅ Actualizado gemini-claude-sync.md con estadísticas', colors.green);
  }
}

/**
 * Detecta cambios en tipos y actualiza glosarios
 */
function detectTypeChanges() {
  const typesPath = path.join(rootDir, 'packages', 'types', 'src');
  const changes = [];
  
  // Buscar archivos modificados recientemente (últimos 5 minutos)
  const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
  
  function checkDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    files.forEach(file => {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        checkDirectory(fullPath);
      } else if (file.name.endsWith('.ts')) {
        const stats = fs.statSync(fullPath);
        if (stats.mtimeMs > fiveMinutesAgo) {
          changes.push({
            file: fullPath.replace(rootDir, '.'),
            modified: stats.mtime
          });
        }
      }
    });
  }
  
  checkDirectory(typesPath);
  
  if (changes.length > 0) {
    log(`🔍 Detectados ${changes.length} archivos de tipos modificados`, colors.cyan);
    changes.forEach(change => {
      log(`  - ${change.file}`, colors.cyan);
    });
    
    // Marcar que los glosarios necesitan actualización
    return true;
  }
  
  return false;
}

/**
 * Genera reporte de salud de la documentación
 */
function generateHealthReport() {
  const report = {
    timestamp: new Date().toISOString(),
    glosarios: {},
    coverage: {},
    recommendations: []
  };
  
  // Verificar existencia de glosarios
  const requiredGlosarios = [
    'packages/GLOSARIO_MAESTRO.md',
    'packages/auth/GLOSARIO.md',
    'packages/types/GLOSARIO.md',
    'packages/shared/GLOSARIO.md',
    'packages/hooks/GLOSARIO.md'
  ];
  
  requiredGlosarios.forEach(glosario => {
    const fullPath = path.join(rootDir, glosario);
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      const ageInDays = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24);
      
      report.glosarios[glosario] = {
        exists: true,
        lastModified: stats.mtime,
        ageInDays: ageInDays.toFixed(1),
        needsUpdate: ageInDays > 7
      };
      
      if (ageInDays > 7) {
        report.recommendations.push(`⚠️ ${glosario} no se actualiza hace ${ageInDays.toFixed(0)} días`);
      }
    } else {
      report.glosarios[glosario] = { exists: false };
      report.recommendations.push(`❌ Falta crear ${glosario}`);
    }
  });
  
  // Calcular coverage
  const packages = ['auth', 'types', 'shared', 'hooks'];
  packages.forEach(pkg => {
    const exports = analyzePackageExports(path.join(rootDir, 'packages', pkg));
    report.coverage[pkg] = exports.size;
  });
  
  // Guardar reporte
  const reportPath = path.join(rootDir, 'docs-health-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Mostrar resumen
  log('\n📊 Reporte de Salud de Documentación', colors.bright + colors.cyan);
  log(`📅 ${report.timestamp}`, colors.blue);
  
  if (report.recommendations.length > 0) {
    log('\n⚠️ Recomendaciones:', colors.yellow);
    report.recommendations.forEach(rec => log(rec, colors.yellow));
  } else {
    log('\n✅ Toda la documentación está actualizada!', colors.green);
  }
  
  return report;
}

/**
 * Función principal que se ejecuta con cada comando
 */
async function updateDocumentation(trigger = 'manual') {
  log(`\n🤖 Auto-actualización de documentación (trigger: ${trigger})`, colors.bright + colors.cyan);
  
  const lastUpdate = getLastUpdateTime();
  const timeSinceLastUpdate = Date.now() - lastUpdate;
  
  // No actualizar si fue hace menos de 1 minuto (evitar spam)
  if (timeSinceLastUpdate < 60000 && trigger !== 'force') {
    log('⏭️  Saltando actualización (muy reciente)', colors.yellow);
    return;
  }
  
  // 1. Detectar errores de TypeScript si se ejecutó tsc
  if (trigger === 'tsc' || trigger === 'build') {
    try {
      log('🔍 Analizando errores de TypeScript...', colors.blue);
      const tscOutput = execSync('npx tsc --noEmit 2>&1', { 
        cwd: rootDir,
        encoding: 'utf8'
      });
      const errors = extractTypeScriptErrors(tscOutput);
      
      if (errors.size > 0) {
        log(`❌ Encontrados ${errors.size} tipos de errores TypeScript`, colors.red);
        updateErrorsSection(errors, new Map());
      }
    } catch (error) {
      // tsc falló, analizar el error
      const errors = extractTypeScriptErrors(error.stdout || error.message);
      if (errors.size > 0) {
        updateErrorsSection(errors, new Map());
      }
    }
  }
  
  // 2. Detectar warnings de lint si se ejecutó lint
  if (trigger === 'lint') {
    try {
      log('🔍 Analizando warnings de ESLint...', colors.blue);
      const lintOutput = execSync('pnpm lint 2>&1', {
        cwd: rootDir,
        encoding: 'utf8'
      });
      const warnings = extractLintWarnings(lintOutput);
      
      if (warnings.size > 0) {
        log(`⚠️  Encontrados ${warnings.size} tipos de warnings`, colors.yellow);
        updateErrorsSection(new Map(), warnings);
      }
    } catch (error) {
      // lint falló, analizar warnings
      const warnings = extractLintWarnings(error.stdout || error.message);
      if (warnings.size > 0) {
        updateErrorsSection(new Map(), warnings);
      }
    }
  }
  
  // 3. Actualizar estadísticas de exports
  log('📊 Actualizando estadísticas de exports...', colors.blue);
  updateExportStats();
  
  // 4. Detectar cambios en tipos
  if (detectTypeChanges()) {
    log('🔄 Tipos modificados, considerar actualizar glosarios', colors.yellow);
  }
  
  // 5. Generar reporte de salud
  const healthReport = generateHealthReport();
  
  // 6. Guardar timestamp
  saveUpdateTime();
  
  log('✅ Documentación actualizada exitosamente!\n', colors.green);
  
  // Si hay recomendaciones críticas, mostrar alerta
  if (healthReport.recommendations.length > 3) {
    log('🚨 ATENCIÓN: La documentación necesita mantenimiento manual', colors.red + colors.bright);
    log('   Ejecutar: npm run docs:maintain', colors.yellow);
  }
}

// Parsear argumentos de línea de comandos
const args = process.argv.slice(2);
const trigger = args[0] || 'manual';

// Ejecutar actualización
updateDocumentation(trigger).catch(error => {
  log(`❌ Error actualizando documentación: ${error.message}`, colors.red);
  process.exit(1);
});