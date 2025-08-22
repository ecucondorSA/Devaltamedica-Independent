import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const mode = args.find(arg => arg.startsWith('--mode'))?.split('=')[1] || 'basic';
const targetPath = args.find(arg => arg.startsWith('--path'))?.split('=')[1] || '.';

function analyzeCode(target, analysisMode) {
  const results = { target, mode: analysisMode, timestamp: new Date().toISOString() };
  
  if (!fs.existsSync(target)) {
    console.log(`❌ Target path does not exist: ${target}`);
    process.exit(1);
  }
  
  console.log(`🔍 Analyzing ${target} in ${analysisMode} mode`);
  
  try {
    if (analysisMode === 'all' || analysisMode === 'lint') {
      console.log('📝 Running ESLint check...');
      try {
        execSync(`pnpm eslint ${target} --format=compact --max-warnings=10`, { stdio: 'pipe', timeout: 30000 });
        results.eslint = 'passed';
        console.log('✅ ESLint: No issues found');
      } catch (error) {
        results.eslint = 'failed';
        console.log('⚠️ ESLint: Issues found (non-blocking)');
      }
    }
    
    if (analysisMode === 'all' || analysisMode === 'types') {
      console.log('🔍 Checking TypeScript...');
      try {
        execSync('pnpm type-check', { stdio: 'pipe', cwd: target, timeout: 60000 });
        results.typescript = 'passed';
        console.log('✅ TypeScript: No type errors');
      } catch (error) {
        results.typescript = 'failed';
        console.log('⚠️ TypeScript: Type errors found (non-blocking)');
      }
    }
    
    if (analysisMode === 'all' || analysisMode === 'structure') {
      console.log('📁 Analyzing file structure...');
      const stats = analyzeStructure(target);
      results.structure = stats;
      console.log(`📊 Found ${stats.files} files, ${stats.components} components`);
    }
    
    results.status = 'completed';
    console.log('✅ Code analysis completed successfully');
    
  } catch (error) {
    console.error(`❌ Analysis failed: ${error.message}`);
    results.status = 'failed';
    results.error = error.message;
  }
  
  return results;
}

function analyzeStructure(targetPath) {
  const stats = { files: 0, components: 0, tests: 0 };
  
  function walkDir(dir) {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        walkDir(fullPath);
      } else if (stat.isFile()) {
        stats.files++;
        if (item.endsWith('.tsx') || item.endsWith('.jsx')) {
          stats.components++;
        }
        if (item.includes('.test.') || item.includes('.spec.')) {
          stats.tests++;
        }
      }
    });
  }
  
  walkDir(targetPath);
  return stats;
}

const result = analyzeCode(targetPath, mode);
console.log('\n📋 Analysis Summary:');
console.log(JSON.stringify(result, null, 2));