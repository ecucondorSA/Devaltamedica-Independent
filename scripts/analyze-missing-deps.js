const fs = require('fs');
const path = require('path');

function analyzeDependencies() {
  const results = {
    apps: {},
    packages: {},
    summary: {
      totalMissing: 0,
      criticalMissing: []
    }
  };

  function checkImports(dir) {
    const imports = new Set();
    const files = [];
    
    function scanDir(currentDir) {
      if (!fs.existsSync(currentDir)) return;
      
      const items = fs.readdirSync(currentDir);
      items.forEach(item => {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('dist') && !item.includes('.next')) {
          scanDir(fullPath);
        } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js') || item.endsWith('.jsx'))) {
          files.push(fullPath);
        }
      });
    }
    
    scanDir(dir);
    
    files.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
        const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
        
        let match;
        while ((match = importRegex.exec(content)) !== null) {
          const pkg = match[1];
          if (!pkg.startsWith('.') && !pkg.startsWith('@altamedica/')) {
            const basePkg = pkg.split('/')[0] === '@' ? pkg.split('/').slice(0, 2).join('/') : pkg.split('/')[0];
            imports.add(basePkg);
          }
        }
        
        while ((match = requireRegex.exec(content)) !== null) {
          const pkg = match[1];
          if (!pkg.startsWith('.') && !pkg.startsWith('@altamedica/')) {
            const basePkg = pkg.split('/')[0] === '@' ? pkg.split('/').slice(0, 2).join('/') : pkg.split('/')[0];
            imports.add(basePkg);
          }
        }
      } catch (e) {}
    });
    
    return Array.from(imports);
  }

  function analyzePackageJson(dir, name, type) {
    const pkgPath = path.join(dir, 'package.json');
    if (!fs.existsSync(pkgPath)) return null;
    
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const deps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
      ...pkg.peerDependencies
    };
    
    const imports = checkImports(dir);
    const missing = imports.filter(imp => !deps[imp] && !['fs', 'path', 'crypto', 'util', 'events', 'stream', 'http', 'https', 'url', 'querystring', 'child_process', 'os', 'net', 'dns', 'tls', 'cluster', 'worker_threads'].includes(imp));
    
    const missingTypes = [];
    Object.keys(deps || {}).forEach(dep => {
      if (!dep.startsWith('@types/') && !dep.includes('typescript')) {
        const needsTypes = ['express', 'cors', 'cookie-parser', 'bcrypt', 'jsonwebtoken', 'nodemailer', 'uuid', 'minimatch'];
        if (needsTypes.includes(dep)) {
          const typePkg = '@types/' + dep;
          if (!deps[typePkg]) {
            missingTypes.push(typePkg);
          }
        }
      }
    });
    
    return {
      name,
      type,
      missing,
      missingTypes,
      totalDeps: Object.keys(deps || {}).length,
      totalImports: imports.length
    };
  }

  const apps = fs.readdirSync('apps').filter(d => !d.startsWith('.'));
  apps.forEach(app => {
    const analysis = analyzePackageJson(path.join('apps', app), app, 'app');
    if (analysis) {
      results.apps[app] = analysis;
      results.summary.totalMissing += analysis.missing.length + analysis.missingTypes.length;
    }
  });

  const packages = fs.readdirSync('packages').filter(d => !d.startsWith('.'));
  packages.forEach(pkg => {
    const analysis = analyzePackageJson(path.join('packages', pkg), pkg, 'package');
    if (analysis) {
      results.packages[pkg] = analysis;
      results.summary.totalMissing += analysis.missing.length + analysis.missingTypes.length;
    }
  });

  const criticalPackages = [
    'supertest', 'vitest', '@testing-library/react', '@testing-library/jest-dom',
    'playwright', '@playwright/test', 'node-mocks-http'
  ];
  
  Object.values(results.apps).forEach(app => {
    app.missing.forEach(dep => {
      if (criticalPackages.includes(dep)) {
        results.summary.criticalMissing.push({
          location: `apps/${app.name}`,
          dependency: dep
        });
      }
    });
  });

  return results;
}

const results = analyzeDependencies();

console.log('=== REPORTE DE DEPENDENCIAS FALTANTES ===\n');
console.log(`Total de dependencias faltantes: ${results.summary.totalMissing}\n`);

console.log('=== APPS CON DEPENDENCIAS FALTANTES ===');
Object.values(results.apps).forEach(app => {
  if (app.missing.length > 0 || app.missingTypes.length > 0) {
    console.log(`\n${app.name}:`);
    if (app.missing.length > 0) {
      console.log(`  Librerías faltantes: ${app.missing.join(', ')}`);
    }
    if (app.missingTypes.length > 0) {
      console.log(`  Types faltantes: ${app.missingTypes.join(', ')}`);
    }
  }
});

console.log('\n=== PACKAGES CON DEPENDENCIAS FALTANTES ===');
Object.values(results.packages).forEach(pkg => {
  if (pkg.missing.length > 0 || pkg.missingTypes.length > 0) {
    console.log(`\n${pkg.name}:`);
    if (pkg.missing.length > 0) {
      console.log(`  Librerías faltantes: ${pkg.missing.join(', ')}`);
    }
    if (pkg.missingTypes.length > 0) {
      console.log(`  Types faltantes: ${pkg.missingTypes.join(', ')}`);
    }
  }
});

if (results.summary.criticalMissing.length > 0) {
  console.log('\n=== DEPENDENCIAS CRÍTICAS FALTANTES ===');
  results.summary.criticalMissing.forEach(item => {
    console.log(`  ${item.location}: ${item.dependency}`);
  });
}

console.log('\n=== COMANDOS DE INSTALACIÓN SUGERIDOS ===');
const allMissing = new Set();
Object.values(results.apps).forEach(app => {
  app.missing.forEach(dep => allMissing.add(dep));
  app.missingTypes.forEach(dep => allMissing.add(dep));
});
Object.values(results.packages).forEach(pkg => {
  pkg.missing.forEach(dep => allMissing.add(dep));
  pkg.missingTypes.forEach(dep => allMissing.add(dep));
});

if (allMissing.size > 0) {
  console.log(`\npnpm add -D ${Array.from(allMissing).join(' ')}`);
}