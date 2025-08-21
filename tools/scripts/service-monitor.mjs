#!/usr/bin/env node
// Monitor ligero de servicios: consulta endpoints y guarda estado en logs/status.json y logs/status-history.ndjson
// Uso:
//   node tools/scripts/service-monitor.mjs            # una sola vez
//   node tools/scripts/service-monitor.mjs --watch    # bucle con intervalo por defecto (5s)
//   node tools/scripts/service-monitor.mjs --interval 10000 --apps api-server,patients

import { PORTS } from '../../config/ports.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const isWatch = args.includes('--watch');
const intervalArgIndex = args.indexOf('--interval');
const intervalMs = intervalArgIndex !== -1 ? Number(args[intervalArgIndex + 1]) : 5000;
const appsArgIndex = args.indexOf('--apps');
const appsFilter = appsArgIndex !== -1 ? args[appsArgIndex + 1].split(',').map(s => s.trim()).filter(Boolean) : null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');
const logsDir = path.join(rootDir, 'logs');
const statusFile = path.join(logsDir, 'status.json');
const historyFile = path.join(logsDir, 'status-history.ndjson');

function ensureLogsDir() {
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
}

function nowIso() {
  return new Date().toISOString();
}

function appUrls(appName) {
  const port = PORTS[appName];
  if (!port) return [];
  // Para api-server probamos puerto base y el siguiente (fallback dinámico 3001->3002)
  if (appName === 'api-server') {
    return [`http://localhost:${port}`, `http://localhost:${port + 1}`];
  }
  return [`http://localhost:${port}`];
}

async function probeAny(urls, endpoints) {
  for (const url of urls) {
    for (const endpoint of endpoints) {
      const target = `${url}${endpoint}`;
      const start = Date.now();
      try {
        const res = await fetch(target, { method: 'GET' });
        const durationMs = Date.now() - start;
        if (res.ok) return { ok: true, url, endpoint, status: res.status, durationMs };
      } catch (err) {
        // continuar
      }
    }
  }
  return { ok: false };
}

function endpointsFor(appName) {
  if (appName === 'api-server') {
    return ['/api/v1/health', '/live', '/ready', '/'];
  }
  // Para apps Next, intentamos primero health si existiera, luego root
  return ['/api/health', '/', '/_next/static/chunks'];
}

async function sampleOnce() {
  const timestamp = nowIso();
  const services = {};
  const appNames = Object.keys(PORTS).filter(name => !appsFilter || appsFilter.includes(name));

  for (const name of appNames) {
    const urls = appUrls(name);
    if (!urls.length) continue;
    const eps = endpointsFor(name);
    const res = await probeAny(urls, eps);
    if (res.ok) {
      services[name] = { ok: true, url: res.url, endpoint: res.endpoint, status: res.status };
    } else {
      services[name] = { ok: false, url: urls[0], endpoint: null, status: 0 };
    }
  }

  return { timestamp, services };
}

function writeStatusFiles(snapshot) {
  ensureLogsDir();
  try {
    fs.writeFileSync(statusFile, JSON.stringify(snapshot, null, 2));
  } catch (e) {
    console.error('No se pudo escribir status.json:', e);
  }
  try {
    fs.appendFileSync(historyFile, JSON.stringify(snapshot) + '\n');
  } catch (e) {
    console.error('No se pudo escribir status-history.ndjson:', e);
  }
}

async function main() {
  if (!globalThis.fetch) {
    console.error('Node >=18 requerido (fetch global no disponible).');
    process.exit(1);
  }

  if (!PORTS || typeof PORTS !== 'object') {
    console.error('No se pudo cargar PORTS desde config/ports.js');
    process.exit(1);
  }

  if (!isWatch) {
    const snapshot = await sampleOnce();
    writeStatusFiles(snapshot);
    console.log(`[service-monitor] ${snapshot.timestamp}`);
    for (const [name, s] of Object.entries(snapshot.services)) {
      console.log(` - ${name.padEnd(16)} ${s.ok ? 'OK' : 'DOWN'} -> ${s.url}${s.endpoint ?? ''}`);
    }
    return;
  }

  console.log(`[service-monitor] Modo watch cada ${intervalMs} ms. Apps: ${appsFilter ? appsFilter.join(',') : 'todas'}`);
  // Bucle simple
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const snapshot = await sampleOnce();
    writeStatusFiles(snapshot);
    const okCount = Object.values(snapshot.services).filter(s => s.ok).length;
    process.stdout.write(`\r${snapshot.timestamp} Servicios OK: ${okCount}/${Object.keys(snapshot.services).length}       `);
    await new Promise(r => setTimeout(r, intervalMs));
  }
}

main().catch(err => {
  console.error('Error en service-monitor:', err);
  process.exit(1);
});
