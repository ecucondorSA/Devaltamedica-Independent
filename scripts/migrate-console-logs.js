/**
 * Script para migrar console.logs a sistema de logging profesional
 * Ejecutar: node scripts/migrate-console-logs.js
 */

const fs = require('fs');
const path = require('path');

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const IGNORE_DIRS = ['node_modules', '.next', 'dist', '.git', 'coverage'];

// Mapeo de console methods a logger methods
const CONSOLE_TO_LOGGER = {
  'console.log': 'logger.info',
  'console.error': 'logger.error',
  'console.warn': 'logger.warn',
  'console.debug': 'logger.debug',
  'console.info': 'logger.info'
};

let filesProcessed = 0;
let logsReplaced = 0;

function shouldProcessFile(filePath) {
  const ext = path.extname(filePath);
  return EXTENSIONS.includes(ext);
}

function shouldIgnoreDir(dirName) {
  return IGNORE_DIRS.includes(dirName);
}

function processFile(filePath) {
  if (!shouldProcessFile(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let fileLogsReplaced = 0;
  
  // Verificar si ya tiene logger importado
  const hasLoggerImport = content.includes("from '@altamedica/shared/services/logger.service'");
  
  // Reemplazar console.* con logger.*
  Object.entries(CONSOLE_TO_LOGGER).forEach(([consoleMethod, loggerMethod]) => {
    const regex = new RegExp(`${consoleMethod.replace('.', '\\.')}\\(`, 'g');
    const matches = content.match(regex);
    
    if (matches) {
      const count = matches.length;
      content = content.replace(regex, `${loggerMethod}(`);
      modified = true;
      fileLogsReplaced += count;
      logsReplaced += count;
    }
  });
  
  // Si se modificó y no tiene import de logger, agregarlo
  if (modified && !hasLoggerImport) {
    // Buscar el último import
    const importRegex = /^import .* from .*;?\s*$/gm;
    const imports = content.match(importRegex);
    
    if (imports) {
      const lastImport = imports[imports.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);
      const insertPosition = lastImportIndex + lastImport.length;
      
      const loggerImport = "\nimport { logger } from '@altamedica/shared/services/logger.service';";
      content = content.slice(0, insertPosition) + loggerImport + content.slice(insertPosition);
    } else {
      // Si no hay imports, agregar al principio después de comentarios
      const firstNonComment = content.search(/^(?!\/\/|\/\*|\s*$)/m);
      content = content.slice(0, firstNonComment) + 
                "import { logger } from '@altamedica/shared/services/logger.service';\n\n" + 
                content.slice(firstNonComment);
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    filesProcessed++;
    console.log(`✅ Procesado: ${filePath} (${fileLogsReplaced} logs reemplazados)`);
  }
}

function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  
  items.forEach(item => {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !shouldIgnoreDir(item)) {
      processDirectory(fullPath);
    } else if (stat.isFile()) {
      try {
        processFile(fullPath);
      } catch (error) {
        console.error(`❌ Error procesando ${fullPath}:`, error.message);
      }
    }
  });
}

// Función principal
function main() {
  console.log('🚀 Iniciando migración de console.logs a logger profesional...\n');
  
  const startTime = Date.now();
  
  // Procesar directorios principales
  const dirsToProcess = [
    'apps',
    'packages'
  ];
  
  dirsToProcess.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
      console.log(`📁 Procesando directorio: ${dir}`);
      processDirectory(fullPath);
    }
  });
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('\n' + '='.repeat(50));
  console.log('✨ Migración completada!');
  console.log(`📊 Archivos procesados: ${filesProcessed}`);
  console.log(`🔄 Console.logs reemplazados: ${logsReplaced}`);
  console.log(`⏱️ Tiempo total: ${duration}s`);
  console.log('='.repeat(50));
  
  // Crear reporte
  const report = {
    date: new Date().toISOString(),
    filesProcessed,
    logsReplaced,
    duration: `${duration}s`,
    dirsProcessed: dirsToProcess
  };
  
  fs.writeFileSync(
    path.join(process.cwd(), 'migration-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n📄 Reporte guardado en: migration-report.json');
}

// Ejecutar
if (require.main === module) {
  main();
}