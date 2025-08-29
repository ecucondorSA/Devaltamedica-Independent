#!/usr/bin/env node

/**
 * 🔍 AI Audit Trail - SOLO PARA EDUARDO
 * Rastrea y audita todo el trabajo realizado por las IAs
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

function getAIWorkFromLog() {
  const logPath = path.join(rootDir, 'AI_WORK_LOG.md');
  if (!fs.existsSync(logPath)) {
    return { sessions: [], stats: {} };
  }
  
  const content = fs.readFileSync(logPath, 'utf8');
  const sessions = [];
  const stats = {
    claude: { sessions: 0, files: 0, tasks: 0 },
    chatgpt: { sessions: 0, files: 0, tasks: 0 },
    gemini: { sessions: 0, files: 0, tasks: 0 }
  };
  
  const sessionRegex = /## (\d{4}-\d{2}-\d{2}) - (\w+) - (.+)/g;
  const fileRegex = /- `(.+?)` - (.+)/g;
  const taskRegex = /- \[x\] (.+)/g;
  
  let match;
  while ((match = sessionRegex.exec(content)) !== null) {
    const [, date, ai, sessionType] = match;
    sessions.push({ date, ai: ai.toLowerCase(), sessionType });
    
    if (stats[ai.toLowerCase()]) {
      stats[ai.toLowerCase()].sessions++;
    }
  }
  
  while ((match = fileRegex.exec(content)) !== null) {
    Object.values(stats).forEach(stat => stat.files++);
  }
  
  while ((match = taskRegex.exec(content)) !== null) {
    Object.values(stats).forEach(stat => stat.tasks++);
  }
  
  return { sessions, stats };
}

function getGitActivity(days = 7) {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().split('T')[0];
    
    const gitLog = execSync(
      `git log --since="${sinceStr}" --pretty=format:"%h|%an|%ad|%s" --date=short`,
      { cwd: rootDir, encoding: 'utf8' }
    );
    
    const commits = gitLog.split('\n').filter(Boolean).map(line => {
      const [hash, author, date, message] = line.split('|');
      return { hash, author, date, message };
    });
    
    const aiCommits = commits.filter(c => 
      c.message.includes('🤖') || 
      c.message.toLowerCase().includes('ai:') ||
      c.message.toLowerCase().includes('claude') ||
      c.message.toLowerCase().includes('chatgpt') ||
      c.message.toLowerCase().includes('gemini')
    );
    
    return { total: commits.length, aiCommits: aiCommits.length, commits: aiCommits };
  } catch (error) {
    return { total: 0, aiCommits: 0, commits: [] };
  }
}

function getFileChanges(days = 7) {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().split('T')[0];
    
    const diffStat = execSync(
      `git diff --stat $(git rev-list -n 1 --before="${sinceStr}" HEAD) HEAD`,
      { cwd: rootDir, encoding: 'utf8' }
    );
    
    const lines = diffStat.split('\n').filter(Boolean);
    const summary = lines[lines.length - 1];
    const fileChanges = lines.slice(0, -1).map(line => {
      const parts = line.split('|');
      if (parts.length >= 2) {
        const file = parts[0].trim();
        const changes = parts[1].trim();
        return { file, changes };
      }
      return null;
    }).filter(Boolean);
    
    return { summary, fileChanges, totalFiles: fileChanges.length };
  } catch (error) {
    return { summary: 'No changes', fileChanges: [], totalFiles: 0 };
  }
}

function analyzeCodeQuality() {
  const metrics = {
    typescript: { errors: 0, warnings: 0 },
    eslint: { errors: 0, warnings: 0 },
    tests: { total: 0, passing: 0, failing: 0 },
    coverage: 0
  };
  
  try {
    const tscOutput = execSync('npx tsc --noEmit 2>&1', { cwd: rootDir, encoding: 'utf8' });
    const tsErrors = (tscOutput.match(/error TS/g) || []).length;
    metrics.typescript.errors = tsErrors;
  } catch (error) {
    const output = error.stdout || error.toString();
    const tsErrors = (output.match(/error TS/g) || []).length;
    metrics.typescript.errors = tsErrors;
  }
  
  return metrics;
}

function generateAuditReport() {
  log('\n🔍 AI AUDIT TRAIL REPORT', colors.bright + colors.cyan);
  log('=' .repeat(60), colors.cyan);
  
  const timestamp = new Date().toISOString();
  log(`📅 Generated: ${timestamp}`, colors.blue);
  
  log('\n📊 AI WORK SUMMARY', colors.bright + colors.yellow);
  log('-'.repeat(40), colors.yellow);
  
  const { sessions, stats } = getAIWorkFromLog();
  
  Object.entries(stats).forEach(([ai, data]) => {
    log(`\n${ai.toUpperCase()}:`, colors.bright);
    log(`  Sessions: ${data.sessions}`, colors.green);
    log(`  Files Modified: ${data.files}`, colors.green);
    log(`  Tasks Completed: ${data.tasks}`, colors.green);
  });
  
  log('\n📝 GIT ACTIVITY (Last 7 days)', colors.bright + colors.yellow);
  log('-'.repeat(40), colors.yellow);
  
  const gitActivity = getGitActivity(7);
  log(`Total Commits: ${gitActivity.total}`, colors.blue);
  log(`AI-Related Commits: ${gitActivity.aiCommits}`, colors.green);
  
  if (gitActivity.commits.length > 0) {
    log('\nRecent AI Commits:', colors.bright);
    gitActivity.commits.slice(0, 5).forEach(commit => {
      log(`  ${commit.date} - ${commit.hash} - ${commit.message}`, colors.cyan);
    });
  }
  
  log('\n📂 FILE CHANGES (Last 7 days)', colors.bright + colors.yellow);
  log('-'.repeat(40), colors.yellow);
  
  const fileChanges = getFileChanges(7);
  log(`Total Files Changed: ${fileChanges.totalFiles}`, colors.blue);
  if (fileChanges.summary) {
    log(`Summary: ${fileChanges.summary}`, colors.green);
  }
  
  log('\n⚠️ CODE QUALITY METRICS', colors.bright + colors.yellow);
  log('-'.repeat(40), colors.yellow);
  
  const quality = analyzeCodeQuality();
  log(`TypeScript Errors: ${quality.typescript.errors}`, 
    quality.typescript.errors > 0 ? colors.red : colors.green);
  
  log('\n🚨 RISK ASSESSMENT', colors.bright + colors.red);
  log('-'.repeat(40), colors.red);
  
  const risks = [];
  
  if (quality.typescript.errors > 10) {
    risks.push('HIGH: Muchos errores de TypeScript detectados');
  }
  
  if (fileChanges.totalFiles > 50) {
    risks.push('MEDIUM: Muchos archivos modificados en poco tiempo');
  }
  
  if (gitActivity.aiCommits > gitActivity.total * 0.8) {
    risks.push('LOW: La mayoría de commits son de IAs, considera revisar manualmente');
  }
  
  if (risks.length === 0) {
    log('✅ No se detectaron riesgos significativos', colors.green);
  } else {
    risks.forEach(risk => log(`  ⚠️ ${risk}`, colors.yellow));
  }
  
  log('\n💡 RECOMENDACIONES', colors.bright + colors.cyan);
  log('-'.repeat(40), colors.cyan);
  
  const recommendations = [];
  
  if (quality.typescript.errors > 0) {
    recommendations.push('Ejecuta "pnpm type-check" y corrige errores TypeScript');
  }
  
  if (sessions.length === 0) {
    recommendations.push('Las IAs no están reportando en AI_WORK_LOG.md - recordarles');
  }
  
  if (fileChanges.totalFiles > 100) {
    recommendations.push('Considera hacer un backup completo del proyecto');
  }
  
  if (recommendations.length === 0) {
    log('✅ Todo está bajo control', colors.green);
  } else {
    recommendations.forEach((rec, i) => {
      log(`  ${i + 1}. ${rec}`, colors.blue);
    });
  }
  
  const reportPath = path.join(rootDir, `AI_AUDIT_${new Date().toISOString().split('T')[0]}.json`);
  const reportData = {
    timestamp,
    sessions,
    stats,
    gitActivity: {
      total: gitActivity.total,
      aiCommits: gitActivity.aiCommits,
      recentCommits: gitActivity.commits.slice(0, 10)
    },
    fileChanges: {
      total: fileChanges.totalFiles,
      summary: fileChanges.summary
    },
    codeQuality: quality,
    risks,
    recommendations
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  
  log('\n✅ Reporte completo guardado en:', colors.green);
  log(`   ${reportPath}`, colors.bright + colors.green);
  
  log('\n' + '='.repeat(60), colors.cyan);
  log('📊 FIN DEL REPORTE DE AUDITORÍA', colors.bright + colors.cyan);
}

if (process.argv.includes('--help')) {
  log('🔍 AI Audit Trail - Uso:', colors.bright);
  log('  node ai-audit-trail.mjs       - Generar reporte completo');
  log('  node ai-audit-trail.mjs --json - Exportar solo JSON');
  log('  node ai-audit-trail.mjs --help - Mostrar esta ayuda');
} else {
  generateAuditReport();
}