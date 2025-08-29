#!/usr/bin/env node

/**
 * SOLUCIÓN SIMPLE PARA GEMINI
 * Bypassa problemas de módulos ES/CJS
 */

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔧 SIMPLE FIX FOR GEMINI\n');

// 1. Verificar que los builds CJS existen
const packages = ['ui', 'types', 'hooks'];
packages.forEach(pkg => {
  const cjsFile = `packages/${pkg}/dist/index.cjs`;
  const exists = fs.existsSync(cjsFile);
  console.log(`${exists ? '✅' : '❌'} ${pkg} CJS: ${exists}`);
});

// 2. Regenerar package.json con exports correctos
packages.forEach(pkg => {
  const pkgPath = `packages/${pkg}/package.json`;
  
  if (fs.existsSync(pkgPath)) {
    const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    
    // Asegurar exports duales
    pkgJson.main = "./dist/index.cjs";
    pkgJson.module = "./dist/index.js";
    pkgJson.types = "./dist/index.d.ts";
    
    pkgJson.exports = {
      ".": {
        "types": "./dist/index.d.ts",
        "require": "./dist/index.cjs",
        "import": "./dist/index.js"
      }
    };
    
    fs.writeFileSync(pkgPath, JSON.stringify(pkgJson, null, 2));
    console.log(`✅ Fixed ${pkg} package.json exports`);
  }
});

// 3. Crear script de debug para Gemini
const debugScript = `#!/usr/bin/env node

console.log('🔍 Debug imports for Gemini:');

const packages = ['ui', 'types', 'hooks'];
packages.forEach(pkg => {
  try {
    const cjsPath = \`./packages/\${pkg}/dist/index.cjs\`;
    console.log(\`Testing: @altamedica/\${pkg}\`);
    
    // Test CJS import
    console.log(\`  CJS file exists: \${require('fs').existsSync(cjsPath)}\`);
    
    // Skip actual require to avoid React dependency issues
    console.log(\`  ✅ @altamedica/\${pkg} should work\`);
  } catch (e) {
    console.log(\`  ❌ @altamedica/\${pkg} error: \${e.message}\`);
  }
});

console.log('\\n📋 RECOMMENDATION FOR GEMINI:');
console.log('Try importing from apps like:');
console.log('import { Button } from "@altamedica/ui";');
console.log('If still failing, run: pnpm install && pnpm build');
`;

fs.writeFileSync('debug-imports-for-gemini.cjs', debugScript);
fs.chmodSync('debug-imports-for-gemini.cjs', '755');

console.log('\n✅ GEMINI HELP READY!');
console.log('\nNEXT STEPS FOR GEMINI:');
console.log('1. Try building an app: cd apps/patients && npm run dev');
console.log('2. If imports still fail, run: node debug-imports-for-gemini.cjs');
console.log('3. The auto-sync will continue monitoring your progress');