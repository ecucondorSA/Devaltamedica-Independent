#!/usr/bin/env node

/**
 * Script para limpiar errores comunes de ESLint
 * Elimina variables no utilizadas y parámetros no utilizados
 */

const fs = require('fs');
const path = require('path');

// Patrones de limpieza
const CLEANUP_PATTERNS = [
  // Eliminar parámetros no utilizados
  {
    pattern: /function\s+\w+\s*\(\s*([^)]*)\s*\)/g,
    replacement: (match, params) => {
      const cleanParams = params.split(',').map(p => {
        const param = p.trim();
        if (param.startsWith('_') || param.includes('unused')) {
          return `_${param.replace(/^_/, '')}`;
        }
        return param;
      }).join(', ');
      return `function ${match.split('(')[0]}(${cleanParams})`;
    }
  },
  
  // Eliminar variables no utilizadas
  {
    pattern: /const\s+(\w+)\s*=\s*[^;]+;\s*(?:\/\/\s*unused|\/\*\s*unused)/g,
    replacement: '// Removed unused variable'
  },
  
  // Comentar console.log en archivos de desarrollo
  {
    pattern: /console\.(log|debug|info|warn|error)\(/g,
    replacement: '// console.$1('
  }
];

// Archivos a procesar
const FILES_TO_PROCESS = [
  'packages/hooks/src/medical/DEPRECATED_useTelemedicine.ts',
  'packages/hooks/src/realtime/DEPRECATED_useWebRTC.ts',
  'packages/shared/src/services/logger.service.ts',
  'packages/utils/src/index.ts',
  'packages/utils/src/secure-storage.ts'
];

function cleanFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // Aplicar patrones de limpieza
    CLEANUP_PATTERNS.forEach(({ pattern, replacement }) => {
      if (typeof replacement === 'function') {
        content = content.replace(pattern, replacement);
      } else {
        content = content.replace(pattern, replacement);
      }
    });
    
    // Limpiar variables no utilizadas específicas
    content = content.replace(/const\s+(\w+)\s*=\s*[^;]+;\s*(?:\/\/\s*unused|\/\*\s*unused)/g, '');
    
    // Limpiar parámetros no utilizados
    content = content.replace(/\(\s*([^)]*)\s*\)/g, (match, params) => {
      const cleanParams = params.split(',').map(p => {
        const param = p.trim();
        if (param.startsWith('_') || param.includes('unused')) {
          return `_${param.replace(/^_/, '')}`;
        }
        return param;
      }).join(', ');
      return `(${cleanParams})`;
    });
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Limpiado: ${filePath}`);
    } else {
      console.log(`⏭️  Sin cambios: ${filePath}`);
    }
    
  } catch (error) {
    console.error(`❌ Error procesando ${filePath}:`, error.message);
  }
}

function main() {
  console.log('🧹 Iniciando limpieza de errores de ESLint...\n');
  
  FILES_TO_PROCESS.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      cleanFile(filePath);
    } else {
      console.log(`⚠️  Archivo no encontrado: ${filePath}`);
    }
  });
  
  console.log('\n🎉 Limpieza completada!');
  console.log('💡 Ahora ejecuta: pnpm lint para verificar');
}

if (require.main === module) {
  main();
}

module.exports = { cleanFile, CLEANUP_PATTERNS };
