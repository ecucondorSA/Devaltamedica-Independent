#!/usr/bin/env node
/**
 * Repair Orchestrator (Windows-safe)
 * - Descubre paquetes en ./packages y ./apps
 * - Aplica fixes seguros e idempotentes:
 *   - tsconfig.json: include:["src"], añade types:["node"] si falta
 *   - @altamedica/shared: asegura subpath exports y entradas en tsup
 *   - @altamedica/e2e-tests: evita que bloquee la build (script build de eco)
 * - Flags:
 *   --dry                Solo mostrar cambios (por defecto)
 *   --write              Escribir cambios
 *   --fix-tsconfig       Arreglos de tsconfig (por defecto true)
 *   --fix-shared-exports Arreglos en shared exports/tsup (por defecto true)
 *   --fix-e2e            Desactivar build de e2e-tests (por defecto true)
 *   --fix-dts            Desactivar dts en tsup.config.ts (seguro=false, requiere flag)
 *   --fix-logger         Sugerir fixes de logger (solo reporta; experimental)
 */

import fs from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();
const argv = new Set(process.argv.slice(2));
const isWrite = argv.has('--write');
const optFixTsconfig = argv.has('--fix-tsconfig') || !argv.has('--no-fix-tsconfig');
const optFixShared = argv.has('--fix-shared-exports') || !argv.has('--no-fix-shared-exports');
const optFixE2E = argv.has('--fix-e2e') || !argv.has('--no-fix-e2e');
const optFixDts = argv.has('--fix-dts'); // agresivo, requiere flag explícito
const optFixLogger = argv.has('--fix-logger'); // solo reporta por defecto

const rootDirs = ['packages', 'apps'];
const changes = [];

function readJsonSafe(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const text = fs.readFileSync(filePath, 'utf8');
  try {
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

function writeJsonPretty(filePath, obj) {
  const json = JSON.stringify(obj, null, 2) + '\n';
  if (isWrite) fs.writeFileSync(filePath, json, 'utf8');
}

function listPackages() {
  const results = [];
  for (const dir of rootDirs) {
    const base = path.join(cwd, dir);
    if (!fs.existsSync(base)) continue;
    for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const full = path.join(base, entry.name);
      const pkgFile = path.join(full, 'package.json');
      if (fs.existsSync(pkgFile)) {
        const pkg = readJsonSafe(pkgFile);
        if (pkg) results.push({ name: pkg.name || entry.name, dir: full, pkg });
      }
    }
  }
  return results;
}

function ensureTsconfig(dir) {
  const file = path.join(dir, 'tsconfig.json');
  if (!fs.existsSync(file)) return;
  const data = readJsonSafe(file);
  if (!data || !data.compilerOptions) return;
  let mutated = false;

  // include: ["src"]
  if (Array.isArray(data.include)) {
    if (!data.include.includes('src')) {
      data.include = ['src'];
      mutated = true;
    }
  } else {
    data.include = ['src'];
    mutated = true;
  }

  // types: ["node"] si no existe
  if (!Array.isArray(data.compilerOptions.types)) {
    data.compilerOptions.types = ['node'];
    mutated = true;
  } else if (!data.compilerOptions.types.includes('node')) {
    data.compilerOptions.types = [...data.compilerOptions.types, 'node'];
    mutated = true;
  }

  if (mutated) {
    changes.push({ file, action: 'update:tsconfig' });
    writeJsonPretty(file, data);
  }
}

function ensureSharedExports(pkgDir) {
  const pkgFile = path.join(pkgDir, 'package.json');
  const pkg = readJsonSafe(pkgFile);
  if (!pkg) return;
  let mutated = false;
  pkg.exports = pkg.exports || {};
  pkg.exports['.'] = pkg.exports['.'] || {
    types: './dist/index.d.ts',
    import: './dist/index.mjs',
    require: './dist/index.js',
  };
  const sub = pkg.exports['./services/logger.service'];
  const desired = {
    types: './dist/services/logger.service.d.ts',
    import: './dist/services/logger.service.mjs',
    require: './dist/services/logger.service.js',
  };
  const needSub = !sub || sub.types !== desired.types || sub.import !== desired.import || sub.require !== desired.require;
  if (needSub) {
    pkg.exports['./services/logger.service'] = desired;
    mutated = true;
  }
  if (mutated) {
    changes.push({ file: pkgFile, action: 'update:shared-exports' });
    writeJsonPretty(pkgFile, pkg);
  }

  // tsup entry mapping
  const tsupFile = path.join(pkgDir, 'tsup.config.ts');
  if (fs.existsSync(tsupFile)) {
    let content = fs.readFileSync(tsupFile, 'utf8');
    const hasEntryObject = /entry:\s*\{[\s\S]*?\}/m.test(content);
    const hasLoggerEntry = /['"]services\/logger\.service['"]\s*:\s*['"]src\/services\/logger\.service\.ts['"]/m.test(content);
    if (!hasLoggerEntry) {
      if (hasEntryObject) {
        content = content.replace(/entry:\s*\{/, (m) => `${m}\n    'services/logger.service': 'src/services/logger.service.ts',`);
      } else {
        // replace array form: entry: ['src/index.ts']
        content = content.replace(/entry:\s*\[[^\]]*\]/m, "entry: {\n    index: 'src/index.ts',\n    'services/logger.service': 'src/services/logger.service.ts',\n  }");
      }
      changes.push({ file: tsupFile, action: 'update:shared-tsup-entry' });
      if (isWrite) fs.writeFileSync(tsupFile, content, 'utf8');
    }
  }
}

function ensureE2ESkipBuild(dir) {
  const pkgFile = path.join(dir, 'package.json');
  const pkg = readJsonSafe(pkgFile);
  if (!pkg || !pkg.scripts) return;
  const name = pkg.name || '';
  if (!name.includes('e2e-tests')) return;
  const desired = "echo 'Skipping e2e build (no publish needed)'";
  if (pkg.scripts.build !== desired) {
    pkg.scripts.build = desired;
    changes.push({ file: pkgFile, action: 'update:e2e-build-script' });
    writeJsonPretty(pkgFile, pkg);
  }
}

function maybeDisableDts(dir) {
  if (!optFixDts) return;
  const tsupFile = path.join(dir, 'tsup.config.ts');
  if (!fs.existsSync(tsupFile)) return;
  const content = fs.readFileSync(tsupFile, 'utf8');
  if (/dts:\s*true/.test(content)) {
    const next = content.replace(/dts:\s*true/g, 'dts: false');
    if (next !== content) {
      changes.push({ file: tsupFile, action: 'update:tsup-dts-false' });
      if (isWrite) fs.writeFileSync(tsupFile, next, 'utf8');
    }
  }
}

function reportLoggerIssues(dir) {
  if (!optFixLogger) return;
  // Solo reporta posibles patrones a corregir; no edita código por defecto
  // Heurística simple: logger.error('...', error) con 2 argumentos dentro de catch (error)
  const src = path.join(dir, 'src');
  if (!fs.existsSync(src)) return;
  const stack = [src];
  let count = 0;
  while (stack.length) {
    const d = stack.pop();
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, ent.name);
      if (ent.isDirectory()) {
        stack.push(p);
      } else if (ent.isFile() && p.endsWith('.ts')) {
        const text = fs.readFileSync(p, 'utf8');
        const m = text.match(/catch\s*\(error\)\s*\{[\s\S]*?logger\.(error|warn)\([^,]+,\s*error\s*\)/m);
        if (m) count += 1;
      }
    }
  }
  if (count > 0) {
    changes.push({ file: path.join(dir, 'src/**/*'), action: `suggest:logger-args(${count})` });
  }
}

function main() {
  const pkgs = listPackages();
  for (const { name, dir } of pkgs) {
    if (optFixTsconfig) ensureTsconfig(dir);
    if (optFixShared && name === '@altamedica/shared') ensureSharedExports(dir);
    if (optFixE2E) ensureE2ESkipBuild(dir);
    maybeDisableDts(dir);
    reportLoggerIssues(dir);
  }

  const summary = changes.map((c) => `- ${c.action}: ${path.relative(cwd, c.file)}`).join('\n');
  const header = isWrite ? 'Applied changes:' : 'Planned changes (dry-run):';
  console.log('\n' + header + (summary ? '\n' + summary : '\n(none)'));
}

main();



