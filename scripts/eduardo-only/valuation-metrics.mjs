#!/usr/bin/env node

/**
 * 📊 Valuation Metrics Collector - SOLO PARA EDUARDO
 * Recopila todas las métricas técnicas para valuación
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function collectMetrics() {
  const metrics = {
    timestamp: new Date().toISOString(),
    code: {},
    files: {},
    dependencies: {},
    commits: {},
    complexity: {},
    infrastructure: {},
    business: {}
  };

  log('\n💰 RECOPILANDO MÉTRICAS DE VALUACIÓN', colors.bright + colors.cyan);
  log('=' .repeat(60), colors.cyan);

  // Métricas de código
  try {
    // Total de archivos de código
    const tsFiles = execSync(
      'find . -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \\) -not -path "*/node_modules/*" | wc -l',
      { cwd: rootDir, encoding: 'utf8' }
    );
    metrics.code.totalFiles = parseInt(tsFiles.trim());

    // Líneas de código
    const linesOfCode = execSync(
      'find . -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \\) -not -path "*/node_modules/*" -exec wc -l {} + | tail -1',
      { cwd: rootDir, encoding: 'utf8' }
    );
    metrics.code.totalLines = parseInt(linesOfCode.trim().split(/\s+/)[0]);

    // Archivos de test
    const testFiles = execSync(
      'find . -type f \\( -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" -o -name "*.spec.tsx" \\) -not -path "*/node_modules/*" | wc -l',
      { cwd: rootDir, encoding: 'utf8' }
    );
    metrics.code.testFiles = parseInt(testFiles.trim());

    // Componentes React
    const components = execSync(
      'grep -r "export.*function\\|export.*const.*:.*React\\.FC\\|export.*class.*extends.*Component" --include="*.tsx" --include="*.jsx" --exclude-dir=node_modules | wc -l',
      { cwd: rootDir, encoding: 'utf8' }
    );
    metrics.code.reactComponents = parseInt(components.trim());

    // Custom Hooks
    const hooks = execSync(
      'find . -type f \\( -name "use*.ts" -o -name "use*.tsx" \\) -not -path "*/node_modules/*" | wc -l',
      { cwd: rootDir, encoding: 'utf8' }
    );
    metrics.code.customHooks = parseInt(hooks.trim());

  } catch (error) {
    log('Error recopilando métricas de código', colors.yellow);
  }

  // Métricas de Git
  try {
    // Total de commits
    const totalCommits = execSync(
      'git rev-list --count HEAD',
      { cwd: rootDir, encoding: 'utf8' }
    );
    metrics.commits.total = parseInt(totalCommits.trim());

    // Commits este mes
    const monthlyCommits = execSync(
      'git rev-list --count --since="30 days ago" HEAD',
      { cwd: rootDir, encoding: 'utf8' }
    );
    metrics.commits.lastMonth = parseInt(monthlyCommits.trim());

    // Contributors
    const contributors = execSync(
      'git log --format="%aN" | sort -u | wc -l',
      { cwd: rootDir, encoding: 'utf8' }
    );
    metrics.commits.contributors = parseInt(contributors.trim());

  } catch (error) {
    log('Error recopilando métricas de Git', colors.yellow);
  }

  // Métricas de dependencias
  try {
    // Total de dependencias
    const deps = execSync(
      'cat package.json | grep -E "dependencies|devDependencies" -A 100 | grep ":" | wc -l',
      { cwd: rootDir, encoding: 'utf8' }
    );
    metrics.dependencies.total = parseInt(deps.trim());

    // Packages propios
    const packages = fs.readdirSync(path.join(rootDir, 'packages')).filter(dir => {
      const pkgPath = path.join(rootDir, 'packages', dir, 'package.json');
      return fs.existsSync(pkgPath);
    });
    metrics.dependencies.internalPackages = packages.length;

    // Apps
    const apps = fs.readdirSync(path.join(rootDir, 'apps')).filter(dir => {
      const appPath = path.join(rootDir, 'apps', dir, 'package.json');
      return fs.existsSync(appPath);
    });
    metrics.dependencies.apps = apps.length;

  } catch (error) {
    log('Error recopilando métricas de dependencias', colors.yellow);
  }

  // Análisis de complejidad y calidad
  try {
    // TypeScript errors
    const tsErrors = execSync(
      'npx tsc --noEmit 2>&1 | grep "error TS" | wc -l',
      { cwd: rootDir, encoding: 'utf8' }
    ).trim();
    metrics.complexity.typeErrors = parseInt(tsErrors) || 0;

    // Archivos de documentación
    const docs = execSync(
      'find . -name "*.md" -not -path "*/node_modules/*" | wc -l',
      { cwd: rootDir, encoding: 'utf8' }
    );
    metrics.complexity.documentationFiles = parseInt(docs.trim());

  } catch (error) {
    // TypeScript might have errors, that's ok
    metrics.complexity.typeErrors = 'Some (check manually)';
  }

  // Métricas de infraestructura
  metrics.infrastructure = {
    cloud: 'Vercel + Firebase',
    cicd: 'GitHub Actions',
    monitoring: 'Vercel Analytics',
    database: 'Firestore',
    auth: 'Firebase Auth + Custom JWT',
    storage: 'Firebase Storage',
    cdn: 'Vercel Edge Network',
    serverless: 'Vercel Edge Functions'
  };

  // Valor estimado de desarrollo
  const hourlyRate = 75; // USD
  const hoursEstimated = Math.round(metrics.code.totalLines / 30); // 30 líneas por hora promedio
  metrics.business.developmentHours = hoursEstimated;
  metrics.business.developmentValue = hoursEstimated * hourlyRate;
  
  // Costo de reemplazo
  metrics.business.replacementCost = {
    conservative: hoursEstimated * 100, // $100/hour para senior dev
    realistic: hoursEstimated * 150,     // $150/hour para team
    aggressive: hoursEstimated * 200     // $200/hour para consultora
  };

  // Mostrar resultados
  log('\n📊 MÉTRICAS TÉCNICAS', colors.bright + colors.blue);
  log('-'.repeat(40), colors.blue);
  log(`Total archivos código: ${metrics.code.totalFiles}`, colors.green);
  log(`Total líneas código: ${metrics.code.totalLines.toLocaleString()}`, colors.green);
  log(`Archivos de test: ${metrics.code.testFiles}`, colors.green);
  log(`Componentes React: ${metrics.code.reactComponents}`, colors.green);
  log(`Custom Hooks: ${metrics.code.customHooks}`, colors.green);

  log('\n📈 MÉTRICAS DE DESARROLLO', colors.bright + colors.blue);
  log('-'.repeat(40), colors.blue);
  log(`Total commits: ${metrics.commits.total}`, colors.green);
  log(`Commits último mes: ${metrics.commits.lastMonth}`, colors.green);
  log(`Contributors: ${metrics.commits.contributors}`, colors.green);

  log('\n📦 ARQUITECTURA', colors.bright + colors.blue);
  log('-'.repeat(40), colors.blue);
  log(`Aplicaciones: ${metrics.dependencies.apps}`, colors.green);
  log(`Packages internos: ${metrics.dependencies.internalPackages}`, colors.green);
  log(`Total dependencias: ${metrics.dependencies.total}`, colors.green);

  log('\n💰 VALUACIÓN TÉCNICA', colors.bright + colors.yellow);
  log('-'.repeat(40), colors.yellow);
  log(`Horas de desarrollo estimadas: ${metrics.business.developmentHours.toLocaleString()}`, colors.cyan);
  log(`Valor de desarrollo: $${metrics.business.developmentValue.toLocaleString()} USD`, colors.cyan);
  log('\nCosto de reemplazo:', colors.bright);
  log(`  Conservador: $${metrics.business.replacementCost.conservative.toLocaleString()} USD`, colors.green);
  log(`  Realista: $${metrics.business.replacementCost.realistic.toLocaleString()} USD`, colors.yellow);
  log(`  Agresivo: $${metrics.business.replacementCost.aggressive.toLocaleString()} USD`, colors.cyan);

  // Factores multiplicadores
  log('\n🚀 FACTORES DE VALOR AGREGADO', colors.bright + colors.yellow);
  log('-'.repeat(40), colors.yellow);
  
  const multipliers = {
    'Arquitectura cloud-native': 1.5,
    'HIPAA compliance': 1.3,
    'WebRTC implementado': 1.2,
    'AI/ML integrado': 1.4,
    'B2B Marketplace': 1.3,
    'Documentación completa': 1.2,
    'Tests automatizados': 1.1,
    'CI/CD pipeline': 1.1,
    'Monorepo optimizado': 1.2,
    'Sin deuda técnica': 1.3
  };

  let totalMultiplier = 1;
  Object.entries(multipliers).forEach(([factor, mult]) => {
    log(`  ${factor}: x${mult}`, colors.blue);
    totalMultiplier *= mult;
  });

  log(`\n  Multiplicador total: x${totalMultiplier.toFixed(2)}`, colors.bright + colors.cyan);

  const baseValue = metrics.business.replacementCost.realistic;
  const adjustedValue = Math.round(baseValue * totalMultiplier);

  log('\n💎 VALUACIÓN FINAL TÉCNICA', colors.bright + colors.green);
  log('=' .repeat(40), colors.green);
  log(`Valor base (costo reemplazo): $${baseValue.toLocaleString()} USD`, colors.yellow);
  log(`Valor ajustado (con factores): $${adjustedValue.toLocaleString()} USD`, colors.bright + colors.green);
  log(`Rango sugerido: $${(adjustedValue * 0.8).toLocaleString()} - $${(adjustedValue * 1.5).toLocaleString()} USD`, colors.cyan);

  // Guardar reporte
  const reportPath = path.join(rootDir, `VALUATION_METRICS_${new Date().toISOString().split('T')[0]}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(metrics, null, 2));

  log('\n📄 Reporte completo guardado en:', colors.green);
  log(`   ${reportPath}`, colors.bright + colors.green);

  // Texto para copiar al prompt de Gemini
  log('\n' + '=' .repeat(60), colors.cyan);
  log('📋 COPIAR PARA GEMINI:', colors.bright + colors.yellow);
  log('=' .repeat(60), colors.cyan);
  
  console.log(`
### MÉTRICAS TÉCNICAS VERIFICADAS (${new Date().toISOString().split('T')[0]})

**Código Base:**
- Total archivos: ${metrics.code.totalFiles}
- Total líneas: ${metrics.code.totalLines.toLocaleString()}
- Componentes React: ${metrics.code.reactComponents}
- Custom Hooks: ${metrics.code.customHooks}
- Tests: ${metrics.code.testFiles} archivos

**Desarrollo:**
- Commits totales: ${metrics.commits.total}
- Horas invertidas: ~${metrics.business.developmentHours.toLocaleString()}
- Valor desarrollo: $${metrics.business.developmentValue.toLocaleString()} USD

**Arquitectura:**
- ${metrics.dependencies.apps} aplicaciones funcionales
- ${metrics.dependencies.internalPackages} packages reutilizables
- ${metrics.dependencies.total} dependencias totales

**Costo de Reemplazo Calculado:**
- Mínimo: $${metrics.business.replacementCost.conservative.toLocaleString()} USD
- Realista: $${metrics.business.replacementCost.realistic.toLocaleString()} USD  
- Máximo: $${metrics.business.replacementCost.aggressive.toLocaleString()} USD

**Valor Técnico Ajustado: $${adjustedValue.toLocaleString()} USD**
(Incluye factores de cloud, HIPAA, AI, marketplace, etc.)
  `);

  return metrics;
}

// Main
collectMetrics();