#!/usr/bin/env node

/**
 * 🔄 Script de Sincronización Automática de Glosarios
 * Detecta nuevos exports y los añade a los glosarios
 * Se ejecuta automáticamente con build y manualmente con pnpm docs:sync
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Colores
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

/**
 * Analiza un archivo TypeScript y extrae exports
 */
function extractExportsFromFile(filePath) {
  const exports = new Map();
  
  if (!fs.existsSync(filePath)) {
    return exports;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Patterns para detectar diferentes tipos de exports
  const patterns = [
    // export const/let/var
    /export\s+(const|let|var)\s+(\w+)/g,
    // export function/class
    /export\s+(function|class)\s+(\w+)/g,
    // export interface/type/enum
    /export\s+(interface|type|enum)\s+(\w+)/g,
    // export { Name }
    /export\s*{\s*([^}]+)\s*}/g,
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      if (match[2]) {
        // export const/function/class/etc Name
        exports.set(match[2], {
          name: match[2],
          type: match[1],
          line: content.substring(0, match.index).split('\n').length
        });
      } else if (match[1]) {
        // export { Name1, Name2 }
        const items = match[1].split(',').map(item => {
          const cleaned = item.trim();
          // Handle "Name as Alias"
          if (cleaned.includes(' as ')) {
            return cleaned.split(' as ')[1].trim();
          }
          // Handle "type Name"
          return cleaned.replace(/^type\s+/, '');
        });
        
        items.forEach(item => {
          exports.set(item, {
            name: item,
            type: 'export',
            line: content.substring(0, match.index).split('\n').length
          });
        });
      }
    }
  });
  
  return exports;
}

/**
 * Analiza un package completo
 */
function analyzePackage(packageName) {
  const packagePath = path.join(rootDir, 'packages', packageName);
  const srcPath = path.join(packagePath, 'src');
  const indexPath = path.join(srcPath, 'index.ts');
  
  const packageExports = {
    name: packageName,
    exports: new Map(),
    files: new Map()
  };
  
  // Analizar index.ts principal
  if (fs.existsSync(indexPath)) {
    const indexExports = extractExportsFromFile(indexPath);
    indexExports.forEach((value, key) => {
      packageExports.exports.set(key, value);
    });
  }
  
  // Analizar todos los archivos .ts en src
  function scanDirectory(dir, relativePath = '') {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    files.forEach(file => {
      const fullPath = path.join(dir, file.name);
      const relPath = path.join(relativePath, file.name);
      
      if (file.isDirectory() && !file.name.startsWith('.')) {
        scanDirectory(fullPath, relPath);
      } else if (file.name.endsWith('.ts') && !file.name.endsWith('.test.ts')) {
        const fileExports = extractExportsFromFile(fullPath);
        if (fileExports.size > 0) {
          packageExports.files.set(relPath, fileExports);
        }
      }
    });
  }
  
  scanDirectory(srcPath);
  
  return packageExports;
}

/**
 * Lee el glosario existente y extrae los exports documentados
 */
function readGlosario(glosarioPath) {
  const documented = new Set();
  
  if (!fs.existsSync(glosarioPath)) {
    return documented;
  }
  
  const content = fs.readFileSync(glosarioPath, 'utf8');
  
  // Buscar pattern: - **@ExportName**
  const pattern = /^\s*-\s*\*\*@(\w+)\*\*/gm;
  let match;
  
  while ((match = pattern.exec(content)) !== null) {
    documented.add(match[1]);
  }
  
  return documented;
}

/**
 * Determina el tipo de badge basado en el nombre y tipo
 */
function determineBadges(exportName, exportType, packageName) {
  const badges = [];
  
  // Runtime compatibility
  if (exportType === 'type' || exportType === 'interface') {
    badges.push('🏷️ **Edge-safe**');
  } else if (exportName.toLowerCase().includes('service') || 
             exportName.toLowerCase().includes('repository')) {
    badges.push('🔒 **Server-only**');
  } else if (exportName.startsWith('use') || 
             exportName.toLowerCase().includes('component')) {
    badges.push('💻 **Client-only**');
  } else {
    badges.push('🏷️ **Edge-safe**');
  }
  
  // Stability (default to Beta for new exports)
  badges.push('🔄 **Beta**');
  
  // Type
  if (exportType === 'type' || exportType === 'interface') {
    badges.push('📝 **Type**');
  } else if (exportType === 'enum') {
    badges.push('📦 **Enum**');
  } else if (exportType === 'class' && exportName.includes('Service')) {
    badges.push('🔧 **Service**');
  } else if (exportName.startsWith('use')) {
    badges.push('🪝 **Hook**');
  } else if (exportType === 'const') {
    badges.push('📦 **Constants**');
  } else if (exportType === 'function') {
    badges.push('🔧 **Function**');
  }
  
  return badges.join(' | ');
}

/**
 * Actualiza el glosario con nuevos exports
 */
function updateGlosario(packageName, newExports) {
  const glosarioPath = path.join(rootDir, 'packages', packageName, 'GLOSARIO.md');
  let content = '';
  
  if (fs.existsSync(glosarioPath)) {
    content = fs.readFileSync(glosarioPath, 'utf8');
  } else {
    // Crear nuevo glosario
    content = `# @AltaMedica/${packageName.charAt(0).toUpperCase() + packageName.slice(1)} - Glosario Alfabético

## 🏷️ Leyenda de Badges

### Runtime Compatibility
- 🏷️ **Edge-safe** - Compatible con Edge Runtime
- 🔒 **Server-only** - Solo Node.js server
- 💻 **Client-only** - Solo browser/cliente

### Estabilidad
- 📊 **Stable** - API estable
- 🔄 **Beta** - Puede cambiar
- 🚧 **Experimental** - Cambios frecuentes

## 📚 Referencia Rápida de Exports

`;
  }
  
  // Agrupar exports por letra inicial
  const exportsByLetter = new Map();
  
  newExports.forEach((exportInfo, exportName) => {
    const firstLetter = exportName[0].toUpperCase();
    if (!exportsByLetter.has(firstLetter)) {
      exportsByLetter.set(firstLetter, []);
    }
    exportsByLetter.get(firstLetter).push({ name: exportName, ...exportInfo });
  });
  
  // Generar secciones por letra
  const sortedLetters = Array.from(exportsByLetter.keys()).sort();
  let newSections = '';
  
  sortedLetters.forEach(letter => {
    newSections += `\n### ${letter}\n`;
    
    const exports = exportsByLetter.get(letter).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
    
    exports.forEach(exp => {
      const badges = determineBadges(exp.name, exp.type, packageName);
      newSections += `- **@${exp.name}** - \`import { ${exp.name} } from '@altamedica/${packageName}'\`
  - ${badges}
  - [Descripción pendiente]
  - Ruta: \`src/${exp.file || 'index.ts'}\`\n\n`;
    });
  });
  
  // Si no hay secciones alfabéticas existentes, añadir al final
  if (!content.includes('### A') && !content.includes('### B')) {
    content += newSections;
  } else {
    // Insertar en la posición correcta (esto es más complejo)
    log('⚠️  Glosario existente detectado, añadiendo exports manualmente puede ser necesario', colors.yellow);
  }
  
  // Añadir timestamp
  const timestamp = new Date().toISOString();
  if (!content.includes('Última sincronización')) {
    content += `\n---\n**Última sincronización automática**: ${timestamp}\n`;
  } else {
    content = content.replace(
      /\*\*Última sincronización automática\*\*: .*/,
      `**Última sincronización automática**: ${timestamp}`
    );
  }
  
  fs.writeFileSync(glosarioPath, content);
  
  return true;
}

/**
 * Sincroniza todos los glosarios
 */
function syncAllGlosarios() {
  const packages = ['auth', 'types', 'shared', 'hooks'];
  const summary = {
    total: 0,
    new: 0,
    updated: [],
    errors: []
  };
  
  log('\n🔄 Sincronización de Glosarios', colors.bright + colors.cyan);
  log('=' .repeat(50), colors.cyan);
  
  packages.forEach(packageName => {
    log(`\n📦 Analizando @altamedica/${packageName}...`, colors.blue);
    
    try {
      // Analizar package
      const packageData = analyzePackage(packageName);
      summary.total += packageData.exports.size;
      
      // Leer glosario existente
      const glosarioPath = path.join(rootDir, 'packages', packageName, 'GLOSARIO.md');
      const documented = readGlosario(glosarioPath);
      
      // Encontrar nuevos exports
      const newExports = new Map();
      packageData.exports.forEach((value, key) => {
        if (!documented.has(key)) {
          newExports.set(key, value);
        }
      });
      
      if (newExports.size > 0) {
        log(`  ✨ ${newExports.size} nuevos exports encontrados:`, colors.green);
        newExports.forEach((value, key) => {
          log(`     - ${key}`, colors.green);
        });
        
        summary.new += newExports.size;
        summary.updated.push(packageName);
        
        // Preguntar si actualizar (en modo interactivo)
        if (process.argv.includes('--interactive')) {
          // TODO: Implementar modo interactivo
        } else if (!process.argv.includes('--dry-run')) {
          // Actualizar glosario
          updateGlosario(packageName, newExports);
          log(`  ✅ Glosario actualizado`, colors.green);
        }
      } else {
        log(`  ✅ Glosario al día (${packageData.exports.size} exports)`, colors.green);
      }
      
      // Verificar exports obsoletos (documentados pero no existen)
      const obsolete = [];
      documented.forEach(name => {
        if (!packageData.exports.has(name)) {
          obsolete.push(name);
        }
      });
      
      if (obsolete.length > 0) {
        log(`  ⚠️  ${obsolete.length} exports obsoletos en glosario:`, colors.yellow);
        obsolete.forEach(name => {
          log(`     - ${name}`, colors.yellow);
        });
      }
      
    } catch (error) {
      log(`  ❌ Error: ${error.message}`, colors.red);
      summary.errors.push({ package: packageName, error: error.message });
    }
  });
  
  // Actualizar GLOSARIO_MAESTRO con estadísticas
  updateMasterGlosario(summary);
  
  // Mostrar resumen
  log('\n' + '=' .repeat(50), colors.cyan);
  log('📊 Resumen de Sincronización', colors.bright + colors.cyan);
  log(`  Total exports: ${summary.total}`, colors.blue);
  log(`  Nuevos documentados: ${summary.new}`, colors.green);
  
  if (summary.updated.length > 0) {
    log(`  Packages actualizados: ${summary.updated.join(', ')}`, colors.green);
  }
  
  if (summary.errors.length > 0) {
    log(`  Errores: ${summary.errors.length}`, colors.red);
  }
  
  if (process.argv.includes('--dry-run')) {
    log('\n⚠️  Modo dry-run: No se realizaron cambios', colors.yellow);
  }
  
  return summary;
}

/**
 * Actualiza el glosario maestro con estadísticas
 */
function updateMasterGlosario(summary) {
  const masterPath = path.join(rootDir, 'packages', 'GLOSARIO_MAESTRO.md');
  
  if (!fs.existsSync(masterPath)) {
    log('⚠️  GLOSARIO_MAESTRO.md no encontrado', colors.yellow);
    return;
  }
  
  let content = fs.readFileSync(masterPath, 'utf8');
  const timestamp = new Date().toISOString();
  
  // Actualizar sección de estadísticas
  const statsSection = `
## 📊 Estadísticas de Sincronización (${timestamp})

- **Total exports analizados**: ${summary.total}
- **Nuevos exports documentados**: ${summary.new}
- **Packages actualizados**: ${summary.updated.length > 0 ? summary.updated.join(', ') : 'Ninguno'}
- **Estado**: ${summary.new === 0 ? '✅ Todos los glosarios al día' : '🔄 Glosarios actualizados'}
`;
  
  // Buscar y reemplazar sección de estadísticas
  const statsRegex = /## 📊 Estadísticas de Sincronización[\s\S]*?(?=##|$)/;
  
  if (statsRegex.test(content)) {
    content = content.replace(statsRegex, statsSection);
  } else {
    // Añadir antes del final
    const lastSection = content.lastIndexOf('---');
    if (lastSection > -1) {
      content = content.substring(0, lastSection) + statsSection + '\n' + content.substring(lastSection);
    } else {
      content += '\n' + statsSection;
    }
  }
  
  fs.writeFileSync(masterPath, content);
  log('\n✅ GLOSARIO_MAESTRO actualizado con estadísticas', colors.green);
}

/**
 * Modo watch - monitorea cambios en exports
 */
function watchMode() {
  log('👁️  Modo watch activado - Monitoreando cambios en exports...', colors.magenta);
  
  // Sincronización inicial
  syncAllGlosarios();
  
  // Re-sincronizar cada 5 minutos
  setInterval(() => {
    log('\n🔄 Re-sincronizando...', colors.blue);
    syncAllGlosarios();
  }, 5 * 60 * 1000);
  
  log('\n✅ Watcher activo - Ctrl+C para salir', colors.green);
}

// Main
const mode = process.argv[2];

if (mode === '--watch') {
  watchMode();
} else {
  syncAllGlosarios();
  
  // Si hay nuevos exports, sugerir commit
  if (!process.argv.includes('--dry-run')) {
    log('\n💡 Sugerencia: Commitear cambios en glosarios', colors.cyan);
    log('   git add packages/*/GLOSARIO.md', colors.blue);
    log('   git commit -m "docs: sincronizar glosarios con nuevos exports"', colors.blue);
  }
}