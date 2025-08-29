#!/usr/bin/env node
/**
 * Agent Health Scanner
 * - Recorre el repositorio (excluye dirs grandes) y detecta patrones comunes de deuda:
 *   TODO, FIXME, HACK, ts-ignore, eslint-disable, any, console.log, imports relativos frágiles.
 * - Emite reportes en JSON y Markdown.
 */

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const IGNORE_DIRS = new Set([
  'node_modules', '.git', '.turbo', 'dist', 'build', '.next', 'out', 'coverage', '.cache',
  '.github', 'scripts', '.refactor-backups', 'e2e-tests'
]);
const IGNORE_FILES = new Set([
  'AGENT_HEALTH_REPORT.json', 'AGENT_HEALTH_REPORT.md'
]);
const FILE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.yml', '.yaml', '.cjs', '.mjs']);

const PATTERNS = [
  { key: 'TODO', regex: /\bTODO\b/i, severity: 'info' },
  { key: 'FIXME', regex: /\bFIXME\b/i, severity: 'warn' },
  { key: 'HACK', regex: /\bHACK\b/i, severity: 'warn' },
  { key: 'TS_IGNORE', regex: /@ts-ignore/i, severity: 'warn' },
  { key: 'ESLINT_DISABLE', regex: /eslint-disable/i, severity: 'warn' },
  { key: 'ANY_TYPE', regex: /:\s*any\b|\bas\s+any\b/, severity: 'warn' },
  { key: 'CONSOLE_LOG', regex: /console\.(log|debug|warn|error)\s*\(/, severity: 'info' },
  // Import relativo que sale del módulo varias veces (heurística):
  { key: 'RELATIVE_IMPORT_DEEP', regex: /from\s+['"](\.\.){2,}\//, severity: 'info' },
];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results = [];
  for (const e of entries) {
    if (IGNORE_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      results.push(...walk(full));
    } else if (e.isFile()) {
      if (IGNORE_FILES.has(e.name)) continue;
      const ext = path.extname(e.name);
      if (FILE_EXTS.has(ext)) results.push(full);
    }
  }
  return results;
}

function scanFile(file) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  const matches = [];
  lines.forEach((line, i) => {
    PATTERNS.forEach(p => {
      if (p.regex.test(line)) {
        matches.push({ pattern: p.key, severity: p.severity, line: i + 1, snippet: line.trim().slice(0, 240) });
      }
    });
  });
  return matches;
}

function scanRepo() {
  const files = walk(ROOT);
  const issues = [];
  for (const file of files) {
    // saltar archivos grandes (>1.5MB)
    try {
      const stat = fs.statSync(file);
      if (stat.size > 1_500_000) continue;
    } catch {}
    try {
      const ms = scanFile(file);
      if (ms.length) {
        issues.push({ file: path.relative(ROOT, file), matches: ms });
      }
    } catch {}
  }
  return issues;
}

function summarize(issues) {
  const totals = {};
  for (const p of PATTERNS) totals[p.key] = 0;
  let filesWithIssues = 0;
  const topFiles = [];
  issues.forEach(it => {
    filesWithIssues += 1;
    const count = it.matches.length;
    topFiles.push({ file: it.file, count });
    it.matches.forEach(m => { totals[m.pattern] = (totals[m.pattern] || 0) + 1; });
  });
  topFiles.sort((a, b) => b.count - a.count);

  // Duplicados de sincronización
  const syncDup = [
    fs.existsSync(path.join(ROOT, 'GEMINI-CLAUDE-SYNC.md')),
    fs.existsSync(path.join(ROOT, 'gemini-claude-sync.md'))
  ];

  return { totals, filesWithIssues, topFiles: topFiles.slice(0, 25), duplicates: { geminiClaudeSync: syncDup } };
}

function toMarkdown(summary, issues) {
  const lines = [];
  lines.push('# Agent Health Report');
  lines.push('');
  lines.push('## Totales por patrón');
  Object.entries(summary.totals).forEach(([k, v]) => lines.push(`- ${k}: ${v}`));
  lines.push('');
  lines.push(`## Archivos con issues: ${summary.filesWithIssues}`);
  lines.push('');
  lines.push('## Top 25 archivos por ocurrencias');
  summary.topFiles.forEach(t => lines.push(`- ${t.file}: ${t.count}`));
  lines.push('');
  lines.push('## Duplicados de sincronización');
  lines.push(`- GEMINI-CLAUDE-SYNC.md: ${summary.duplicates.geminiClaudeSync[0] ? 'sí' : 'no'}`);
  lines.push(`- gemini-claude-sync.md: ${summary.duplicates.geminiClaudeSync[1] ? 'sí' : 'no'}`);
  lines.push('');
  lines.push('## Muestras (máx. 100)');
  issues.slice(0, 100).forEach(it => {
    lines.push(`- ${it.file}`);
    it.matches.slice(0, 5).forEach(m => lines.push(`  - [${m.severity}] ${m.pattern} @${m.line} → ${m.snippet}`));
  });
  return lines.join('\n');
}

function main() {
  const issues = scanRepo();
  const summary = summarize(issues);
  const jsonPath = path.join(ROOT, 'AGENT_HEALTH_REPORT.json');
  const mdPath = path.join(ROOT, 'AGENT_HEALTH_REPORT.md');
  fs.writeFileSync(jsonPath, JSON.stringify({ summary, issues }, null, 2));
  fs.writeFileSync(mdPath, toMarkdown(summary, issues));
  console.log(`✔ Reportes generados:\n- ${path.relative(ROOT, jsonPath)}\n- ${path.relative(ROOT, mdPath)}`);
}

main();
