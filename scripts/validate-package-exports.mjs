#!/usr/bin/env node

/**
 * Script de Validación Automática de Exports de Packages
 * Verifica que todos los exports documentados en los glosarios
 * existan realmente en los paquetes correspondientes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Configuración de paquetes a validar
const PACKAGES_TO_VALIDATE = [
  {
    name: '@altamedica/auth',
    glosarioPath: 'packages/auth/GLOSARIO.md',
    packagePath: 'packages/auth',
    indexPath: 'packages/auth/src/index.ts'
  },
  {
    name: '@altamedica/types',
    glosarioPath: 'packages/types/GLOSARIO.md',
    packagePath: 'packages/types',
    indexPath: 'packages/types/src/index.ts'
  },
  {
    name: '@altamedica/shared',
    glosarioPath: 'packages/shared/GLOSARIO.md',
    packagePath: 'packages/shared',
    indexPath: 'packages/shared/src/index.ts'
  }
];

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

function logSection(title) {
  console.log();
  log(`${'='.repeat(60)}`, colors.cyan);
  log(title, colors.bright + colors.cyan);
  log(`${'='.repeat(60)}`, colors.cyan);
}

/**
 * Extrae los exports documentados del glosario
 */
function extractDocumentedExports(glosarioPath) {
  const fullPath = path.join(rootDir, glosarioPath);
  
  if (!fs.existsSync(fullPath)) {
    log(`⚠️  Glosario no encontrado: ${glosarioPath}`, colors.yellow);
    return [];
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  const exports = new Set();
  
  // Buscar patrones como:
  // - **@ExportName** - `import { ExportName } from '@altamedica/package'`
  const pattern = /\*\*@(\w+)\*\*/g;
  let match;
  
  while ((match = pattern.exec(content)) !== null) {
    exports.add(match[1]);
  }
  
  // También buscar en bloques de código
  const codeBlockPattern = /import\s*{([^}]+)}\s*from\s*['"]@altamedica/g;
  while ((match = codeBlockPattern.exec(content)) !== null) {
    const items = match[1].split(',').map(item => {
      // Limpiar type prefix y espacios
      return item.trim().replace(/^type\s+/, '');
    });
    items.forEach(item => exports.add(item));
  }
  
  return Array.from(exports).sort();
}

/**
 * Extrae los exports reales del archivo index.ts
 */
function extractActualExports(indexPath) {
  const fullPath = path.join(rootDir, indexPath);
  
  if (!fs.existsSync(fullPath)) {
    log(`⚠️  Index file no encontrado: ${indexPath}`, colors.yellow);
    return [];
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  const exports = new Set();
  
  // Buscar export { ... } from
  const namedExportPattern = /export\s*{([^}]+)}\s*from/g;
  let match;
  
  while ((match = namedExportPattern.exec(content)) !== null) {
    const items = match[1].split(',').map(item => {
      // Limpiar type prefix, as alias y espacios
      const cleaned = item.trim();
      // Si tiene "as", tomar el nombre después de "as"
      if (cleaned.includes(' as ')) {
        return cleaned.split(' as ')[1].trim();
      }
      // Quitar type prefix si existe
      return cleaned.replace(/^type\s+/, '');
    });
    items.forEach(item => exports.add(item));
  }
  
  // Buscar export * from (exports todo)
  const starExportPattern = /export\s*\*\s*from\s*['"]([^'"]+)['"]/g;
  while ((match = starExportPattern.exec(content)) !== null) {
    // Para star exports, necesitaríamos analizar recursivamente
    // Por ahora, lo marcamos como caso especial
    exports.add(`[*] from ${match[1]}`);
  }
  
  // Buscar export const/function/class directos
  const directExportPattern = /export\s+(const|function|class|interface|type|enum)\s+(\w+)/g;
  while ((match = directExportPattern.exec(content)) !== null) {
    exports.add(match[2]);
  }
  
  return Array.from(exports).sort();
}

/**
 * Valida un paquete comparando glosario vs exports reales
 */
function validatePackage(packageConfig) {
  logSection(`Validando ${packageConfig.name}`);
  
  const documented = extractDocumentedExports(packageConfig.glosarioPath);
  const actual = extractActualExports(packageConfig.indexPath);
  
  log(`📚 Exports documentados: ${documented.length}`, colors.blue);
  log(`📦 Exports reales: ${actual.length}`, colors.blue);
  
  // Encontrar discrepancias
  const onlyInDocs = documented.filter(exp => !actual.includes(exp) && !actual.some(a => a.startsWith('[*]')));
  const onlyInCode = actual.filter(exp => !documented.includes(exp) && !exp.startsWith('[*]'));
  
  const results = {
    package: packageConfig.name,
    documented: documented.length,
    actual: actual.length,
    onlyInDocs: onlyInDocs,
    onlyInCode: onlyInCode,
    hasStarExports: actual.some(a => a.startsWith('[*]')),
    isValid: onlyInDocs.length === 0
  };
  
  // Reportar problemas
  if (onlyInDocs.length > 0) {
    log(`\n❌ Exports documentados pero NO encontrados en código:`, colors.red);
    onlyInDocs.forEach(exp => {
      log(`   - ${exp}`, colors.red);
    });
  }
  
  if (onlyInCode.length > 0) {
    log(`\n⚠️  Exports en código pero NO documentados:`, colors.yellow);
    onlyInCode.forEach(exp => {
      log(`   - ${exp}`, colors.yellow);
    });
  }
  
  if (results.hasStarExports) {
    log(`\nℹ️  Este paquete usa star exports (export * from)`, colors.cyan);
    log(`   Algunos exports podrían no ser detectados automáticamente`, colors.cyan);
  }
  
  if (results.isValid && onlyInCode.length === 0) {
    log(`\n✅ Todos los exports están correctamente documentados!`, colors.green);
  }
  
  return results;
}

/**
 * Genera un reporte de validación
 */
function generateReport(results) {
  logSection('REPORTE DE VALIDACIÓN');
  
  const timestamp = new Date().toISOString();
  const totalPackages = results.length;
  const validPackages = results.filter(r => r.isValid).length;
  const totalDocumented = results.reduce((sum, r) => sum + r.documented, 0);
  const totalActual = results.reduce((sum, r) => sum + r.actual, 0);
  
  log(`📅 Fecha: ${timestamp}`, colors.blue);
  log(`📦 Paquetes validados: ${totalPackages}`, colors.blue);
  log(`✅ Paquetes válidos: ${validPackages}/${totalPackages}`, validPackages === totalPackages ? colors.green : colors.yellow);
  log(`📚 Total exports documentados: ${totalDocumented}`, colors.blue);
  log(`🔧 Total exports reales: ${totalActual}`, colors.blue);
  
  // Resumen por paquete
  log(`\n📊 Resumen por paquete:`, colors.cyan);
  results.forEach(r => {
    const status = r.isValid ? '✅' : '❌';
    const color = r.isValid ? colors.green : colors.red;
    log(`   ${status} ${r.package}: ${r.documented} docs / ${r.actual} real`, color);
  });
  
  // Guardar reporte JSON
  const reportPath = path.join(rootDir, 'validation-report.json');
  const report = {
    timestamp,
    summary: {
      totalPackages,
      validPackages,
      invalidPackages: totalPackages - validPackages,
      totalDocumented,
      totalActual
    },
    packages: results,
    recommendations: []
  };
  
  // Agregar recomendaciones
  results.forEach(r => {
    if (r.onlyInDocs.length > 0) {
      report.recommendations.push({
        package: r.package,
        type: 'ERROR',
        message: `Remover del glosario o agregar al código: ${r.onlyInDocs.join(', ')}`
      });
    }
    if (r.onlyInCode.length > 0) {
      report.recommendations.push({
        package: r.package,
        type: 'WARNING',
        message: `Documentar en glosario: ${r.onlyInCode.join(', ')}`
      });
    }
  });
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`\n💾 Reporte guardado en: validation-report.json`, colors.green);
  
  return report;
}

/**
 * Script para CI/CD
 */
function validateForCI() {
  const results = PACKAGES_TO_VALIDATE.map(validatePackage);
  const report = generateReport(results);
  
  // Exit con código de error si hay paquetes inválidos
  if (report.summary.invalidPackages > 0) {
    log(`\n❌ Validación fallida: ${report.summary.invalidPackages} paquete(s) con errores`, colors.red);
    log(`   Ejecuta 'npm run fix:exports' para corregir automáticamente`, colors.yellow);
    process.exit(1);
  } else {
    log(`\n✅ Validación exitosa: Todos los exports están sincronizados!`, colors.green);
    process.exit(0);
  }
}

// Ejecutar validación
log(`🔍 Iniciando validación de exports de packages...`, colors.bright + colors.cyan);
log(`📍 Directorio raíz: ${rootDir}`, colors.blue);

try {
  validateForCI();
} catch (error) {
  log(`\n❌ Error durante la validación: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
}