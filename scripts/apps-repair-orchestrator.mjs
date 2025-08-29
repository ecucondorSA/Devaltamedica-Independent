#!/usr/bin/env node
// Apps Repair Orchestrator (Windows-safe)
// - Escanea ./apps/*
// - Arregla tsconfig (types:["node"], include:["src"], desactiva declarationMap en tsconfig.build)
// - Normaliza uso de logger: logger.error|warn('msg', error) -> logger.error|warn('msg', undefined, error)
// Flags:
//   --write: aplica cambios (por defecto dry-run)
//   --app <name>: limitar a una app (p.ej. api-server)

import fs from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();
const args = process.argv.slice(2);
const isWrite = args.includes('--write');
const appIdx = args.indexOf('--app');
const onlyApp = appIdx !== -1 ? args[appIdx + 1] : null;

const changes = [];

function readJsonSafe(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch { return null; }
}

function writeJson(filePath, obj) {
  const text = JSON.stringify(obj, null, 2) + '\n';
  if (isWrite) fs.writeFileSync(filePath, text, 'utf8');
}

function listApps() {
  const dir = path.join(cwd, 'apps');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => ({ name: d.name, dir: path.join(dir, d.name) }))
    .filter(a => !onlyApp || a.name === onlyApp);
}

function ensureTsconfig(appDir) {
  const tsFile = path.join(appDir, 'tsconfig.json');
  if (fs.existsSync(tsFile)) {
    const data = readJsonSafe(tsFile);
    if (data && data.compilerOptions) {
      let mutated = false;
      if (!Array.isArray(data.include) || data.include.join(',') !== 'src') { data.include = ['src']; mutated = true; }
      if (!Array.isArray(data.compilerOptions.types)) { data.compilerOptions.types = ['node']; mutated = true; }
      else if (!data.compilerOptions.types.includes('node')) { data.compilerOptions.types.push('node'); mutated = true; }
      if (mutated) { changes.push({ file: tsFile, action: 'update:tsconfig' }); writeJson(tsFile, data); }
    }
  }

  const tsBuild = path.join(appDir, 'tsconfig.build.json');
  if (fs.existsSync(tsBuild)) {
    const data = readJsonSafe(tsBuild);
    if (data && data.compilerOptions) {
      let mutated = false;
      if (data.compilerOptions.declarationMap !== false) { data.compilerOptions.declarationMap = false; mutated = true; }
      // garantizar no emita mapas si no hay declaraciones
      if (data.compilerOptions.declaration === false && data.compilerOptions.sourceMap) { data.compilerOptions.sourceMap = false; mutated = true; }
      if (mutated) { changes.push({ file: tsBuild, action: 'update:tsconfig.build' }); writeJson(tsBuild, data); }
    }
  }
}

function normalizeLoggerCalls(appDir) {
  const src = path.join(appDir, 'src');
  if (!fs.existsSync(src)) return;
  const stack = [src];
  while (stack.length) {
    const d = stack.pop();
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, ent.name);
      if (ent.isDirectory()) { stack.push(p); continue; }
      if (!ent.isFile() || !p.endsWith('.ts')) continue;
      const text = fs.readFileSync(p, 'utf8');
      let next = text;
      // logger.error('msg', error) o logger.error("msg", error)
      next = next.replace(/logger\.(error|warn)\(([^,\n]+),(\s*)error\s*\)/g, 'logger.$1($2,$3undefined, error)');
      // catch (error) { logger.error('msg', error); }
      next = next.replace(/catch\s*\(error\)\s*\{([\s\S]*?)logger\.(error|warn)\(([^\)]*?)\)\s*;?/g, (m) => m.replace(/logger\.(error|warn)\(([^,\n]+),(\s*)error\s*\)/g, 'logger.$1($2,$3undefined, error)'));
      if (next !== text) {
        changes.push({ file: p, action: 'update:logger-calls' });
        if (isWrite) fs.writeFileSync(p, next, 'utf8');
      }
    }
  }
}

function main() {
  const apps = listApps();
  for (const app of apps) {
    ensureTsconfig(app.dir);
    normalizeLoggerCalls(app.dir);
  }
  const header = isWrite ? 'Applied changes:' : 'Planned changes (dry-run):';
  const summary = changes.map(c => `- ${c.action}: ${path.relative(cwd, c.file)}`).join('\n');
  console.log('\n' + header + (summary ? '\n' + summary : '\n(none)'));
}

main();



