const fs = require('fs');
const path = require('path');

function checkPeerDependencies() {
  const results = {
    unsatisfied: [],
    satisfied: [],
    summary: {
      total: 0,
      unsatisfiedCount: 0
    }
  };

  function loadPackageJson(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
    } catch (e) {
      console.error('Error reading ' + filePath);
    }
    return null;
  }

  const rootPkg = loadPackageJson('package.json');
  const rootDeps = {
    ...rootPkg.dependencies,
    ...rootPkg.devDependencies
  };

  function checkDirectory(dir, type) {
    const items = fs.readdirSync(dir).filter(d => !d.startsWith('.'));
    
    items.forEach(item => {
      const itemPath = path.join(dir, item);
      const pkgPath = path.join(itemPath, 'package.json');
      const pkg = loadPackageJson(pkgPath);
      
      if (pkg && pkg.peerDependencies) {
        const packageName = pkg.name || `${type}/${item}`;
        
        Object.entries(pkg.peerDependencies).forEach(([dep, version]) => {
          results.summary.total++;
          
          const isInstalled = rootDeps[dep] || false;
          const installedVersion = rootDeps[dep] || 'NOT_INSTALLED';
          
          const entry = {
            package: packageName,
            peerDep: dep,
            requiredVersion: version,
            installedVersion: installedVersion,
            satisfied: isInstalled
          };
          
          if (isInstalled) {
            results.satisfied.push(entry);
          } else {
            results.unsatisfied.push(entry);
            results.summary.unsatisfiedCount++;
          }
        });
      }
    });
  }

  checkDirectory('packages', 'packages');
  checkDirectory('apps', 'apps');

  return results;
}

const results = checkPeerDependencies();

console.log('=== ANÁLISIS DE PEER DEPENDENCIES ===\n');
console.log(`Total peer dependencies: ${results.summary.total}`);
console.log(`Satisfechas: ${results.satisfied.length}`);
console.log(`No satisfechas: ${results.summary.unsatisfiedCount}\n`);

if (results.unsatisfied.length > 0) {
  console.log('=== PEER DEPENDENCIES NO SATISFECHAS ===\n');
  results.unsatisfied.forEach(item => {
    console.log(`📦 ${item.package}`);
    console.log(`   ❌ ${item.peerDep} (requiere: ${item.requiredVersion})`);
  });
  
  const uniqueDeps = [...new Set(results.unsatisfied.map(i => i.peerDep))];
  console.log('\n=== COMANDO DE INSTALACIÓN ===');
  console.log(`pnpm add -D ${uniqueDeps.join(' ')}`);
} else {
  console.log('✅ Todas las peer dependencies están satisfechas');
}

if (results.satisfied.length > 0) {
  console.log('\n=== PEER DEPENDENCIES SATISFECHAS ===\n');
  const satisfiedCount = {};
  results.satisfied.forEach(item => {
    if (!satisfiedCount[item.peerDep]) {
      satisfiedCount[item.peerDep] = 0;
    }
    satisfiedCount[item.peerDep]++;
  });
  
  Object.entries(satisfiedCount).forEach(([dep, count]) => {
    console.log(`✅ ${dep} (usado por ${count} packages)`);
  });
}