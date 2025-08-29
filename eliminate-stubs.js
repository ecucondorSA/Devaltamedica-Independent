#!/usr/bin/env node

/**
 * ELIMINACIÓN SISTEMÁTICA DE STUBS
 * Este script reemplaza TODOS los imports de stubs con imports reales
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Mapeo de stubs a paquetes reales
const STUB_REPLACEMENTS = {
  // Patients app stubs
  "from '../../auth-stub'": "from '@altamedica/auth'",
  "from '../../../auth-stub'": "from '@altamedica/auth'",
  "from '../../types-stub'": "from '@altamedica/types'",
  "from '../../../types-stub'": "from '@altamedica/types'",
  "from '../../ui-stub'": "from '@altamedica/ui'",
  "from '../../../ui-stub'": "from '@altamedica/ui'",
  "from '../../shared-stub'": "from '@altamedica/shared'",
  "from '../../../shared-stub'": "from '@altamedica/shared'",
  
  // Doctors app stubs
  "from '../../lib/auth-stub'": "from '@altamedica/auth'",
  "from '../../lib/firestore-stub'": "from '@altamedica/firebase'",
  "from '../../../lib/firestore-stub'": "from '@altamedica/firebase'",
  "from '../ui-stub'": "from '@altamedica/ui'",
  "from './ui-stub'": "from '@altamedica/ui'",
  "from './firebase-stub'": "from '@altamedica/firebase'",
  "from './api-client-stub'": "from '@altamedica/api-client'",
  "from './hooks-stub'": "from '@altamedica/hooks'",
  "from './marketplace-hooks-stub'": "from '@altamedica/marketplace-hooks'",
  "from './medical-stub'": "from '@altamedica/medical'",
  "from './telemedicine-core-stub'": "from '@altamedica/telemedicine-core'",
  "from './types-stub'": "from '@altamedica/types'",
  "from './utils-stub'": "from '@altamedica/utils'",
  
  // Hook stubs
  "from '../hooks/ai/useDiagnosisQuickAnalysis.stub'": "from '@altamedica/hooks/medical'",
  "from '../hooks/ai/useDiagnosisRestrictions.stub'": "from '@altamedica/hooks/medical'",
  "from './hooks/ai/useDiagnosisQuickAnalysis.stub'": "from '@altamedica/hooks/medical'",
  "from './hooks/ai/useDiagnosisRestrictions.stub'": "from '@altamedica/hooks/medical'",
};

let totalReplacements = 0;
let filesModified = 0;

function replaceStubsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  for (const [stub, real] of Object.entries(STUB_REPLACEMENTS)) {
    if (content.includes(stub)) {
      const regex = new RegExp(stub.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const newContent = content.replace(regex, real);
      const replacements = (content.match(regex) || []).length;
      
      if (replacements > 0) {
        content = newContent;
        modified = true;
        totalReplacements += replacements;
        console.log(`  ✅ Replaced ${replacements} occurrence(s) of "${stub}"`);
      }
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    filesModified++;
    return true;
  }
  
  return false;
}

function processDirectory(dir) {
  const pattern = path.join(dir, '**/*.{ts,tsx,js,jsx}');
  const files = glob.sync(pattern, { 
    ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/*-stub.{ts,tsx}']
  });
  
  console.log(`\n📁 Processing ${files.length} files in ${dir}...\n`);
  
  files.forEach(file => {
    const relativePath = path.relative(process.cwd(), file);
    
    // Check if file contains any stub imports
    const content = fs.readFileSync(file, 'utf8');
    const hasStubs = Object.keys(STUB_REPLACEMENTS).some(stub => content.includes(stub));
    
    if (hasStubs) {
      console.log(`\n📄 Processing: ${relativePath}`);
      replaceStubsInFile(file);
    }
  });
}

// Main execution
console.log('🚀 STUB ELIMINATION SCRIPT');
console.log('=========================\n');

// Process apps directory
processDirectory('apps');

// Process any other directories that might have stub imports
processDirectory('packages');

console.log('\n=========================');
console.log('✨ SUMMARY:');
console.log(`  Files modified: ${filesModified}`);
console.log(`  Total replacements: ${totalReplacements}`);
console.log('\n✅ Stub elimination complete!');

// List remaining stub files to be deleted
console.log('\n🗑️  Stub files that can now be deleted:');
const stubFiles = glob.sync('**/*stub*.{ts,tsx}', {
  ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**', 'eliminate-stubs.js']
});

stubFiles.forEach(file => {
  console.log(`  rm ${file}`);
});

console.log('\n💡 Run the following command to delete all stub files:');
console.log('  ' + stubFiles.map(f => `rm ${f}`).join(' && '));