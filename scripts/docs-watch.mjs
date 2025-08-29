#!/usr/bin/env node

/**
 * 🔄 Documentation Watcher
 * Se ejecuta junto con tsc --watch para mantener docs sincronizados
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chokidar from 'chokidar';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Colores
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function log(message, color = colors.reset) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

// Archivos y directorios a monitorear
const WATCH_PATTERNS = [
  'packages/*/src/**/*.ts',
  'packages/*/src/**/*.tsx',
  'apps/*/src/**/*.ts',
  'apps/*/src/**/*.tsx'
];

// Debounce para evitar múltiples actualizaciones
let updateTimeout;
const DEBOUNCE_DELAY = 5000; // 5 segundos

/**
 * Ejecuta actualización de documentación
 */
function updateDocs(trigger) {
  clearTimeout(updateTimeout);
  
  updateTimeout = setTimeout(() => {
    log('📝 Actualizando documentación...', colors.blue);
    
    const docsUpdate = spawn('node', [
      path.join(__dirname, 'docs-auto-update.mjs'),
      trigger
    ], {
      cwd: rootDir,
      stdio: 'inherit'
    });
    
    docsUpdate.on('close', (code) => {
      if (code === 0) {
        log('✅ Documentación actualizada', colors.green);
      } else {
        log('❌ Error actualizando documentación', colors.yellow);
      }
    });
  }, DEBOUNCE_DELAY);
}

/**
 * Inicia el watcher
 */
function startWatcher() {
  log('👁️  Iniciando Documentation Watcher...', colors.magenta);
  
  // Crear watcher para archivos TypeScript
  const watcher = chokidar.watch(WATCH_PATTERNS, {
    persistent: true,
    ignored: [
      '**/node_modules/**',
      '**/.git/**',
      '**/dist/**',
      '**/.next/**',
      '**/coverage/**'
    ],
    ignoreInitial: true,
    cwd: rootDir
  });
  
  // Eventos del watcher
  watcher
    .on('add', (filePath) => {
      log(`➕ Archivo añadido: ${filePath}`, colors.green);
      
      // Si es un nuevo tipo o export, actualizar
      if (filePath.includes('/types/') || filePath.includes('index.ts')) {
        updateDocs('add');
      }
    })
    .on('change', (filePath) => {
      log(`📝 Archivo modificado: ${filePath}`, colors.blue);
      
      // Actualizar según el tipo de archivo
      if (filePath.includes('/types/')) {
        updateDocs('type-change');
      } else if (filePath.includes('index.ts')) {
        updateDocs('export-change');
      } else if (filePath.includes('.service.ts')) {
        updateDocs('service-change');
      }
    })
    .on('unlink', (filePath) => {
      log(`🗑️  Archivo eliminado: ${filePath}`, colors.yellow);
      
      // Si se elimina un export, actualizar
      if (filePath.includes('index.ts') || filePath.includes('/types/')) {
        updateDocs('remove');
      }
    })
    .on('error', (error) => {
      log(`❌ Error en watcher: ${error}`, colors.yellow);
    })
    .on('ready', () => {
      log('✅ Watcher listo - Monitoreando cambios...', colors.green);
      log('📁 Patrones monitoreados:', colors.blue);
      WATCH_PATTERNS.forEach(pattern => {
        log(`   - ${pattern}`, colors.blue);
      });
    });
  
  // También ejecutar tsc --watch en paralelo si se solicita
  if (process.argv.includes('--with-tsc')) {
    log('🔨 Iniciando tsc --watch en paralelo...', colors.magenta);
    
    const tscWatch = spawn('npx', ['tsc', '--watch', '--noEmit'], {
      cwd: rootDir,
      stdio: 'pipe'
    });
    
    // Capturar output de tsc
    tscWatch.stdout.on('data', (data) => {
      const output = data.toString();
      
      // Detectar cuando tsc termina una compilación
      if (output.includes('Found') && output.includes('error')) {
        log('❌ TypeScript encontró errores', colors.yellow);
        updateDocs('tsc-error');
      } else if (output.includes('Watching for file changes')) {
        log('👀 TypeScript watching...', colors.blue);
      } else if (output.includes('0 errors')) {
        log('✅ TypeScript sin errores', colors.green);
        updateDocs('tsc-success');
      }
    });
    
    tscWatch.stderr.on('data', (data) => {
      console.error(data.toString());
    });
  }
  
  // Manejar cierre graceful
  process.on('SIGINT', () => {
    log('\n👋 Cerrando Documentation Watcher...', colors.yellow);
    watcher.close();
    process.exit(0);
  });
}

// Verificar si chokidar está instalado
try {
  require.resolve('chokidar');
} catch (e) {
  log('📦 Instalando dependencias necesarias...', colors.yellow);
  spawn('npm', ['install', '--no-save', 'chokidar'], {
    cwd: rootDir,
    stdio: 'inherit'
  }).on('close', () => {
    startWatcher();
  });
} 

// Iniciar watcher
startWatcher();