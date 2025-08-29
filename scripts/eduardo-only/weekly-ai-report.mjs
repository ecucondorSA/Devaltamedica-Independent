#!/usr/bin/env node

/**
 * 📊 Weekly AI Performance Report - SOLO PARA EDUARDO
 * Genera reporte semanal de productividad y calidad de las IAs
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

function analyzeAIProductivity() {
  const workLog = path.join(rootDir, 'AI_WORK_LOG.md');
  const metrics = {
    claude: { 
      sessions: 0, 
      tasks: 0, 
      files: 0, 
      errors: 0,
      quality: 0,
      speed: 0
    },
    chatgpt: { 
      sessions: 0, 
      tasks: 0, 
      files: 0, 
      errors: 0,
      quality: 0,
      speed: 0
    },
    gemini: { 
      sessions: 0, 
      tasks: 0, 
      files: 0, 
      errors: 0,
      quality: 0,
      speed: 0
    }
  };
  
  if (!fs.existsSync(workLog)) {
    return metrics;
  }
  
  const content = fs.readFileSync(workLog, 'utf8');
  const lines = content.split('\n');
  
  let currentAI = null;
  let currentSession = null;
  
  lines.forEach(line => {
    // Detectar sesiones
    const sessionMatch = line.match(/## (\d{4}-\d{2}-\d{2}) - (\w+) - (.+)/);
    if (sessionMatch) {
      const [, date, ai, sessionType] = sessionMatch;
      currentAI = ai.toLowerCase();
      currentSession = { date, type: sessionType };
      
      if (metrics[currentAI]) {
        metrics[currentAI].sessions++;
      }
    }
    
    // Contar tareas completadas
    if (line.includes('[x]') && currentAI && metrics[currentAI]) {
      metrics[currentAI].tasks++;
    }
    
    // Contar archivos modificados
    if (line.match(/^- `(.+?)` -/) && currentAI && metrics[currentAI]) {
      metrics[currentAI].files++;
    }
    
    // Detectar errores reportados
    if (line.toLowerCase().includes('error') && currentAI && metrics[currentAI]) {
      metrics[currentAI].errors++;
    }
  });
  
  // Calcular métricas de calidad
  Object.keys(metrics).forEach(ai => {
    const m = metrics[ai];
    if (m.sessions > 0) {
      // Calidad basada en ratio tareas/errores
      m.quality = m.tasks > 0 ? 
        Math.min(100, Math.round((1 - m.errors / m.tasks) * 100)) : 0;
      
      // Velocidad basada en tareas por sesión
      m.speed = Math.round((m.tasks / m.sessions) * 10) / 10;
    }
  });
  
  return metrics;
}

function analyzeCodeQuality() {
  const results = {
    linesAdded: 0,
    linesRemoved: 0,
    filesChanged: 0,
    testsAdded: 0,
    coverage: 0,
    buildSuccess: false,
    typeErrors: 0,
    lintWarnings: 0
  };
  
  try {
    // Analizar cambios de la semana
    const gitStats = execSync(
      'git diff --stat $(git rev-list -n 1 --before="7 days ago" HEAD) HEAD',
      { cwd: rootDir, encoding: 'utf8' }
    );
    
    const lines = gitStats.split('\n');
    const summary = lines[lines.length - 1];
    const summaryMatch = summary.match(/(\d+) files? changed(?:, (\d+) insertions?\(\+\))?(?:, (\d+) deletions?\(-\))?/);
    
    if (summaryMatch) {
      results.filesChanged = parseInt(summaryMatch[1]) || 0;
      results.linesAdded = parseInt(summaryMatch[2]) || 0;
      results.linesRemoved = parseInt(summaryMatch[3]) || 0;
    }
  } catch (error) {
    // Silently continue
  }
  
  try {
    // Verificar TypeScript
    execSync('npx tsc --noEmit', { cwd: rootDir, encoding: 'utf8' });
    results.typeErrors = 0;
  } catch (error) {
    const output = error.stdout || error.toString();
    const errors = (output.match(/error TS/g) || []).length;
    results.typeErrors = errors;
  }
  
  try {
    // Verificar build
    execSync('pnpm type-check', { cwd: rootDir, encoding: 'utf8', timeout: 30000 });
    results.buildSuccess = true;
  } catch {
    results.buildSuccess = false;
  }
  
  // Buscar archivos de test nuevos
  try {
    const newTests = execSync(
      'git diff --name-only $(git rev-list -n 1 --before="7 days ago" HEAD) HEAD | grep -E "\\.(test|spec)\\.(ts|tsx|js|jsx)$" | wc -l',
      { cwd: rootDir, encoding: 'utf8' }
    );
    results.testsAdded = parseInt(newTests.trim()) || 0;
  } catch {
    results.testsAdded = 0;
  }
  
  return results;
}

function analyzeBugs() {
  const bugs = {
    introduced: 0,
    fixed: 0,
    critical: 0,
    pending: 0
  };
  
  try {
    // Analizar commits de la semana
    const commits = execSync(
      'git log --oneline --since="7 days ago"',
      { cwd: rootDir, encoding: 'utf8' }
    );
    
    const lines = commits.split('\n').filter(Boolean);
    
    lines.forEach(line => {
      const lower = line.toLowerCase();
      if (lower.includes('fix:') || lower.includes('bugfix') || lower.includes('fixed')) {
        bugs.fixed++;
      }
      if (lower.includes('breaking') || lower.includes('critical')) {
        bugs.critical++;
      }
    });
    
    // Contar issues/TODOs en código
    const todos = execSync(
      'grep -r "TODO\\|FIXME\\|BUG\\|HACK" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . | wc -l',
      { cwd: rootDir, encoding: 'utf8' }
    );
    bugs.pending = parseInt(todos.trim()) || 0;
    
  } catch {
    // Continue with defaults
  }
  
  return bugs;
}

function calculateKPIs(metrics, codeQuality, bugs) {
  const kpis = {};
  
  Object.keys(metrics).forEach(ai => {
    const m = metrics[ai];
    
    kpis[ai] = {
      productivity: m.speed, // Tareas por sesión
      quality: m.quality, // % sin errores
      contribution: m.files, // Archivos modificados
      reliability: m.sessions > 0 ? Math.round((1 - m.errors / Math.max(1, m.tasks)) * 100) : 0,
      score: 0 // Score general
    };
    
    // Calcular score general (0-100)
    const weights = {
      productivity: 0.25,
      quality: 0.35,
      contribution: 0.20,
      reliability: 0.20
    };
    
    kpis[ai].score = Math.round(
      kpis[ai].productivity * weights.productivity * 10 +
      kpis[ai].quality * weights.quality +
      (Math.min(kpis[ai].contribution, 10) * 10) * weights.contribution +
      kpis[ai].reliability * weights.reliability
    );
  });
  
  return kpis;
}

function generateWeeklyReport() {
  const reportDate = new Date().toISOString().split('T')[0];
  
  log('\n📊 WEEKLY AI PERFORMANCE REPORT', colors.bright + colors.cyan);
  log('=' .repeat(70), colors.cyan);
  log(`📅 Week ending: ${reportDate}`, colors.blue);
  
  // Productividad de IAs
  log('\n🤖 AI PRODUCTIVITY METRICS', colors.bright + colors.yellow);
  log('-'.repeat(50), colors.yellow);
  
  const metrics = analyzeAIProductivity();
  
  Object.entries(metrics).forEach(([ai, data]) => {
    log(`\n${ai.toUpperCase()}:`, colors.bright);
    log(`  Sessions: ${data.sessions}`, colors.blue);
    log(`  Tasks Completed: ${data.tasks}`, colors.green);
    log(`  Files Modified: ${data.files}`, colors.green);
    log(`  Errors Reported: ${data.errors}`, data.errors > 0 ? colors.yellow : colors.green);
    log(`  Quality Score: ${data.quality}%`, data.quality >= 80 ? colors.green : colors.yellow);
    log(`  Speed (tasks/session): ${data.speed}`, colors.blue);
  });
  
  // Calidad del código
  log('\n📈 CODE QUALITY METRICS', colors.bright + colors.yellow);
  log('-'.repeat(50), colors.yellow);
  
  const codeQuality = analyzeCodeQuality();
  
  log(`Lines Added: +${codeQuality.linesAdded}`, colors.green);
  log(`Lines Removed: -${codeQuality.linesRemoved}`, colors.red);
  log(`Files Changed: ${codeQuality.filesChanged}`, colors.blue);
  log(`Tests Added: ${codeQuality.testsAdded}`, codeQuality.testsAdded > 0 ? colors.green : colors.yellow);
  log(`TypeScript Errors: ${codeQuality.typeErrors}`, codeQuality.typeErrors > 0 ? colors.red : colors.green);
  log(`Build Status: ${codeQuality.buildSuccess ? '✅ PASSING' : '❌ FAILING'}`, 
    codeQuality.buildSuccess ? colors.green : colors.red);
  
  // Análisis de bugs
  log('\n🐛 BUG ANALYSIS', colors.bright + colors.yellow);
  log('-'.repeat(50), colors.yellow);
  
  const bugs = analyzeBugs();
  
  log(`Bugs Fixed: ${bugs.fixed}`, colors.green);
  log(`Critical Issues: ${bugs.critical}`, bugs.critical > 0 ? colors.red : colors.green);
  log(`Pending TODOs/FIXMEs: ${bugs.pending}`, colors.yellow);
  
  // KPIs
  log('\n🎯 KEY PERFORMANCE INDICATORS', colors.bright + colors.yellow);
  log('-'.repeat(50), colors.yellow);
  
  const kpis = calculateKPIs(metrics, codeQuality, bugs);
  
  // Tabla de KPIs
  log('\n┌─────────┬──────────────┬─────────┬──────────────┬────────────┬───────┐');
  log('│   AI    │ Productivity │ Quality │ Contribution │ Reliability│ Score │');
  log('├─────────┼──────────────┼─────────┼──────────────┼────────────┼───────┤');
  
  Object.entries(kpis).forEach(([ai, kpi]) => {
    const name = ai.toUpperCase().padEnd(7);
    const prod = kpi.productivity.toString().padEnd(12);
    const qual = `${kpi.quality}%`.padEnd(7);
    const cont = kpi.contribution.toString().padEnd(12);
    const rel = `${kpi.reliability}%`.padEnd(10);
    const score = kpi.score.toString().padEnd(5);
    
    const scoreColor = kpi.score >= 80 ? colors.green : 
                      kpi.score >= 60 ? colors.yellow : colors.red;
    
    log(`│ ${name} │ ${prod} │ ${qual} │ ${cont} │ ${rel} │ ${scoreColor}${score}${colors.reset} │`);
  });
  
  log('└─────────┴──────────────┴─────────┴──────────────┴────────────┴───────┘');
  
  // Mejor performer
  const bestAI = Object.entries(kpis).reduce((best, [ai, kpi]) => 
    kpi.score > best.score ? { ai, score: kpi.score } : best,
    { ai: 'none', score: 0 }
  );
  
  log(`\n🏆 Best Performer: ${bestAI.ai.toUpperCase()} (Score: ${bestAI.score})`, 
    colors.bright + colors.green);
  
  // Recomendaciones
  log('\n💡 RECOMMENDATIONS', colors.bright + colors.cyan);
  log('-'.repeat(50), colors.cyan);
  
  const recommendations = [];
  
  if (codeQuality.typeErrors > 10) {
    recommendations.push('🔴 URGENTE: Resolver errores de TypeScript antes de continuar desarrollo');
  }
  
  if (codeQuality.testsAdded === 0) {
    recommendations.push('⚠️ No se agregaron tests esta semana - considerar TDD');
  }
  
  if (bugs.critical > 0) {
    recommendations.push('🔴 Hay issues críticos pendientes - priorizar fixes');
  }
  
  Object.entries(kpis).forEach(([ai, kpi]) => {
    if (kpi.score < 60) {
      recommendations.push(`📉 ${ai.toUpperCase()} tiene bajo rendimiento - considerar re-entrenar o cambiar tareas`);
    }
  });
  
  if (recommendations.length === 0) {
    log('✅ Todo está funcionando bien, mantener el ritmo actual', colors.green);
  } else {
    recommendations.forEach((rec, i) => {
      log(`${i + 1}. ${rec}`, colors.blue);
    });
  }
  
  // Guardar reporte en JSON
  const reportData = {
    date: reportDate,
    metrics,
    codeQuality,
    bugs,
    kpis,
    bestPerformer: bestAI,
    recommendations
  };
  
  const reportPath = path.join(rootDir, `WEEKLY_AI_REPORT_${reportDate}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  
  log('\n📄 Reporte detallado guardado en:', colors.green);
  log(`   ${reportPath}`, colors.bright + colors.green);
  
  // Resumen ejecutivo
  log('\n📋 EXECUTIVE SUMMARY', colors.bright + colors.magenta);
  log('=' .repeat(70), colors.magenta);
  
  const totalTasks = Object.values(metrics).reduce((sum, m) => sum + m.tasks, 0);
  const totalFiles = Object.values(metrics).reduce((sum, m) => sum + m.files, 0);
  const avgQuality = Math.round(
    Object.values(metrics).reduce((sum, m) => sum + m.quality, 0) / 3
  );
  
  log(`Total Tasks Completed: ${totalTasks}`, colors.bright);
  log(`Total Files Modified: ${totalFiles}`, colors.bright);
  log(`Average Quality Score: ${avgQuality}%`, colors.bright);
  log(`Code Health: ${codeQuality.buildSuccess ? '✅ HEALTHY' : '⚠️ NEEDS ATTENTION'}`, colors.bright);
  
  log('\n' + '=' .repeat(70), colors.cyan);
  log('📊 END OF WEEKLY REPORT', colors.bright + colors.cyan);
}

// Main
if (process.argv.includes('--help')) {
  log('📊 Weekly AI Report - Uso:', colors.bright);
  log('  node weekly-ai-report.mjs       - Generar reporte semanal');
  log('  node weekly-ai-report.mjs --json - Solo exportar JSON');
  log('  node weekly-ai-report.mjs --help - Mostrar esta ayuda');
} else {
  generateWeeklyReport();
}