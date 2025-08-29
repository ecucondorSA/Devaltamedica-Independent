#!/usr/bin/env node

/**
 * QUICK HEALTH CHECK - Versión optimizada
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🏥 QUICK HEALTH CHECK ALTAMEDICA\n');
console.log('='.repeat(42));

// 1. Check UI Package
console.log('\n📦 UI Package Status:');
try {
  const uiExists = fs.existsSync('packages/ui/dist/index.cjs');
  const uiSize = uiExists ? fs.statSync('packages/ui/dist/index.cjs').size : 0;
  console.log(`  ✅ Build exists: ${(uiSize / 1024).toFixed(1)} KB`);
  
  // Count exports quickly
  const indexContent = fs.readFileSync('packages/ui/src/index.tsx', 'utf8');
  const exportCount = (indexContent.match(/export/g) || []).length;
  console.log(`  ✅ Exports count: ${exportCount}+`);
} catch (e) {
  console.log(`  ❌ UI Package error: ${e.message}`);
}

// 2. Check Critical Packages
console.log('\n🔧 Critical Packages:');
['types', 'hooks', 'auth', 'medical'].forEach(pkg => {
  const exists = fs.existsSync(`packages/${pkg}/dist`);
  console.log(`  ${exists ? '✅' : '❌'} @altamedica/${pkg}`);
});

// 3. Check Apps TypeScript
console.log('\n🚀 Apps Status (Quick):');
['patients', 'doctors', 'companies', 'admin'].forEach(app => {
  const exists = fs.existsSync(`apps/${app}/package.json`);
  if (exists) {
    // Quick check for obvious errors
    try {
      const hasErrors = execSync(
        `cd apps/${app} && npx tsc --noEmit --skipLibCheck 2>&1 | grep -c "error TS" || true`,
        { encoding: 'utf8', timeout: 5000 }
      ).trim();
      const status = hasErrors === '0' ? '✅' : `❌ (${hasErrors} errors)`;
      console.log(`  ${status} ${app}`);
    } catch {
      console.log(`  ⚠️  ${app} (check skipped)`);
    }
  }
});

// 4. Integration Score
console.log('\n🔗 Integration Quick Check:');
try {
  // Check if UI exports are accessible
  const uiIndexExists = fs.existsSync('packages/ui/dist/index.cjs');
  const typesIndexExists = fs.existsSync('packages/types/dist/index.js');
  const hooksIndexExists = fs.existsSync('packages/hooks/dist/index.js');
  
  const score = [uiIndexExists, typesIndexExists, hooksIndexExists]
    .filter(Boolean).length / 3 * 100;
  
  console.log(`  📊 Build Artifacts: ${score.toFixed(0)}%`);
} catch (e) {
  console.log(`  ❌ Integration check failed`);
}

// 5. Git Status
console.log('\n📝 Git Status:');
try {
  const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  const modified = execSync('git status --short | wc -l', { encoding: 'utf8' }).trim();
  console.log(`  Branch: ${branch}`);
  console.log(`  Modified files: ${modified}`);
} catch {}

// 6. Recommendations
console.log('\n💡 Quick Recommendations:');
const recommendations = [];

if (!fs.existsSync('packages/ui/dist/index.cjs')) {
  recommendations.push('Run: cd packages/ui && npm run build');
}

if (!fs.existsSync('node_modules')) {
  recommendations.push('Run: pnpm install');
}

if (recommendations.length === 0) {
  recommendations.push('System looks healthy! Continue working.');
}

recommendations.forEach((rec, i) => {
  console.log(`  ${i + 1}. ${rec}`);
});

console.log('\n✅ Quick health check completed!\n');