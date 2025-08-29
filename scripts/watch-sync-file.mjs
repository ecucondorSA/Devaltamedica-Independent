#!/usr/bin/env node
/**
 * Watcher: Monitorea cambios en gemini-claude-sync.md y muestra deltas.
 * Uso:
 *   node scripts/watch-sync-file.mjs [--file path] [--log path]
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const args = process.argv.slice(2);
const getArg = (name, def) => {
  const idx = args.indexOf(name);
  return idx >= 0 ? args[idx + 1] : def;
};

const defaultCandidates = [
  'gemini-claude-sync.md',
  'GEMINI-CLAUDE-SYNC.md',
];

const fileArg = getArg('--file', null);
const logArg = getArg('--log', 'sync-monitor.log');

function resolveTarget() {
  if (fileArg) return path.resolve(process.cwd(), fileArg);
  for (const f of defaultCandidates) {
    const p = path.resolve(process.cwd(), f);
    if (fs.existsSync(p)) return p;
  }
  console.error('No se encontró gemini-claude-sync.md. Usa --file <ruta>.');
  process.exit(1);
}

const target = resolveTarget();
const logPath = path.resolve(process.cwd(), logArg);

function hash(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

function readFileSafe(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return '';
  }
}

function diffSegment(oldStr, newStr) {
  const oldLines = oldStr.split(/\r?\n/);
  const newLines = newStr.split(/\r?\n/);
  let start = 0;
  while (start < oldLines.length && start < newLines.length && oldLines[start] === newLines[start]) start++;
  let endOld = oldLines.length - 1;
  let endNew = newLines.length - 1;
  while (endOld >= start && endNew >= start && oldLines[endOld] === newLines[endNew]) { endOld--; endNew--; }
  const removed = oldLines.slice(start, endOld + 1);
  const added = newLines.slice(start, endNew + 1);
  return { start, removed, added };
}

function ts() {
  return new Date().toISOString();
}

function writeLog(lines) {
  try {
    fs.appendFileSync(logPath, lines.join('\n') + '\n');
  } catch {}
}

function printUpdate({ start, removed, added }) {
  const head = `\n[${ts()}] Cambio detectado en ${path.basename(target)} (desde línea ${start + 1})`;
  const removedBlock = removed.length ? ['--- Removido ---', ...removed.slice(0, 80)] : ['--- Removido --- (sin cambios)'];
  const addedBlock = added.length ? ['+++ Agregado +++', ...added.slice(0, 80)] : ['+++ Agregado +++ (sin cambios)'];
  const lines = [head, ...removedBlock, ...addedBlock, '----------------'];
  console.log(lines.join('\n'));
  writeLog(lines);
}

let prev = readFileSafe(target);
let prevHash = hash(prev);
console.log(`[watch-sync] Monitoreando: ${target}`);
console.log(`[watch-sync] Log: ${logPath}`);

let timer = null;
function onChange() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    const cur = readFileSafe(target);
    const curHash = hash(cur);
    if (curHash !== prevHash) {
      const seg = diffSegment(prev, cur);
      printUpdate(seg);
      prev = cur;
      prevHash = curHash;
    }
  }, 200);
}

try {
  fs.watch(target, { persistent: true }, onChange);
} catch (e) {
  console.error('Error iniciando watcher:', e.message);
  process.exit(1);
}

// Impresión inicial: últimas líneas relevantes (consultas y estado)
const preview = prev.split(/\r?\n/).slice(-40);
console.log(['\n[Inicial] Últimas 40 líneas:', ...preview].join('\n'));

