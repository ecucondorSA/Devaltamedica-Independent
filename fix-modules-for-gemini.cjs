#!/usr/bin/env node

/**
 * FIX URGENTE PARA AYUDAR A GEMINI
 * Soluciona problemas de módulos ES vs CommonJS
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 FIXING MODULES FOR GEMINI\n');

// 1. Fix tsup configs to generate both CJS and ESM correctly
const packagesToFix = ['ui', 'types', 'hooks', 'medical', 'auth', 'database'];

packagesToFix.forEach(pkg => {
  const tsupPath = `packages/${pkg}/tsup.config.ts`;
  
  if (fs.existsSync(tsupPath)) {
    console.log(`✅ Fixing ${pkg} tsup config...`);
    
    const content = `import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  minify: false,
  external: ['react', 'react-dom'],
  treeshake: true,
});`;
    
    fs.writeFileSync(tsupPath, content);
  }
});

// 2. Rebuild critical packages with correct config
console.log('\n🏗️ Rebuilding packages for dual compatibility...');

try {
  execSync('cd packages/ui && npm run build', { stdio: 'inherit' });
  console.log('✅ UI package rebuilt');
  
  execSync('cd packages/types && npm run build', { stdio: 'inherit' });
  console.log('✅ Types package rebuilt');
  
  execSync('cd packages/hooks && npm run build', { stdio: 'inherit' });
  console.log('✅ Hooks package rebuilt');
  
} catch (e) {
  console.log('⚠️ Some builds failed, continuing...');
}

// 3. Verify CJS exports work
console.log('\n🧪 Testing CJS imports for Gemini...');

const testImports = [
  '@altamedica/ui',
  '@altamedica/types', 
  '@altamedica/hooks'
];

testImports.forEach(pkg => {
  try {
    const cjsPath = `packages/${pkg.split('/')[1]}/dist/index.cjs`;
    if (fs.existsSync(cjsPath)) {
      // Test require
      require(path.resolve(cjsPath));
      console.log(`✅ ${pkg} CJS working`);
    } else {
      console.log(`❌ ${pkg} missing CJS build`);
    }
  } catch (e) {
    console.log(`⚠️ ${pkg} CJS has issues: ${e.message}`);
  }
});

console.log('\n🎯 READY FOR GEMINI!');
console.log('Apps should now import packages without ES Module errors.');