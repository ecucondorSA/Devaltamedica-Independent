#!/usr/bin/env node

/**
 * HEALTH CHECK DE INTEGRACIÓN CLAUDE-GEMINI
 * Verifica la salud del sistema completo y detecta problemas de integración
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class IntegrationHealthCheck {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      packages: {},
      apps: {},
      integration: {},
      criticalIssues: [],
      recommendations: []
    };
  }

  async run() {
    console.log('🏥 HEALTH CHECK DE INTEGRACIÓN ALTAMEDICA\n');
    console.log('='.repeat(42));
    
    await this.checkPackagesHealth();
    await this.checkAppsHealth();
    await this.checkIntegrationHealth();
    await this.checkCriticalDependencies();
    
    this.generateReport();
    return this.results;
  }

  async checkPackagesHealth() {
    console.log('\n📦 Verificando Packages (Claude Territory)...');
    
    const packages = [
      { name: 'ui', critical: true },
      { name: 'types', critical: true },
      { name: 'hooks', critical: true },
      { name: 'medical', critical: false },
      { name: 'auth', critical: true },
      { name: 'database', critical: false }
    ];

    for (const pkg of packages) {
      const pkgPath = `packages/${pkg.name}`;
      const health = {
        exists: fs.existsSync(pkgPath),
        hasPackageJson: false,
        hasDist: false,
        buildSuccessful: false,
        exportsCount: 0,
        lastModified: null
      };

      if (health.exists) {
        health.hasPackageJson = fs.existsSync(`${pkgPath}/package.json`);
        health.hasDist = fs.existsSync(`${pkgPath}/dist`);
        
        // Verificar build
        try {
          execSync(`cd ${pkgPath} && npm run build`, { stdio: 'pipe' });
          health.buildSuccessful = true;
        } catch {
          health.buildSuccessful = false;
          if (pkg.critical) {
            this.results.criticalIssues.push(`Package ${pkg.name} no compila`);
          }
        }

        // Contar exports
        if (health.hasDist && fs.existsSync(`${pkgPath}/dist/index.js`)) {
          try {
            const exports = execSync(
              `node -e "console.log(Object.keys(require('./${pkgPath}/dist/index.js')).length)"`,
              { encoding: 'utf8' }
            ).trim();
            health.exportsCount = parseInt(exports) || 0;
          } catch {
            health.exportsCount = 0;
          }
        }

        // Last modified
        const stats = fs.statSync(pkgPath);
        health.lastModified = stats.mtime;
      }

      this.results.packages[pkg.name] = health;
      
      const status = health.buildSuccessful ? '✅' : '❌';
      console.log(`  ${status} @altamedica/${pkg.name}: ${health.exportsCount} exports`);
    }
  }

  async checkAppsHealth() {
    console.log('\n🚀 Verificando Apps (Gemini Territory)...');
    
    const apps = [
      'patients',
      'doctors', 
      'companies',
      'admin',
      'web-app',
      'api-server',
      'signaling-server'
    ];

    for (const app of apps) {
      const appPath = `apps/${app}`;
      const health = {
        exists: fs.existsSync(appPath),
        hasPackageJson: false,
        typeCheckPasses: false,
        importsFromPackages: [],
        missingImports: [],
        port: this.getAppPort(app)
      };

      if (health.exists) {
        health.hasPackageJson = fs.existsSync(`${appPath}/package.json`);
        
        // Type check
        try {
          execSync(`cd ${appPath} && npx tsc --noEmit`, { stdio: 'pipe' });
          health.typeCheckPasses = true;
        } catch (error) {
          health.typeCheckPasses = false;
          // Analizar errores de importación
          const errorOutput = error.toString();
          const importErrors = errorOutput.match(/Cannot find module '@altamedica\/[^']+/g) || [];
          health.missingImports = [...new Set(importErrors)];
          
          if (health.missingImports.length > 0) {
            this.results.criticalIssues.push(
              `App ${app} tiene ${health.missingImports.length} imports rotos`
            );
          }
        }

        // Detectar qué packages usa
        try {
          const packageJson = JSON.parse(fs.readFileSync(`${appPath}/package.json`, 'utf8'));
          health.importsFromPackages = Object.keys(packageJson.dependencies || {})
            .filter(dep => dep.startsWith('@altamedica/'));
        } catch {}
      }

      this.results.apps[app] = health;
      
      const status = health.typeCheckPasses ? '✅' : '❌';
      console.log(`  ${status} ${app} (port ${health.port})`);
    }
  }

  async checkIntegrationHealth() {
    console.log('\n🔗 Verificando Integración Claude-Gemini...');
    
    // Verificar que UI exports coincidan con app imports
    const uiExports = this.getAllUIExports();
    const appImports = this.getAllAppImports();
    
    const missingExports = appImports.filter(imp => !uiExports.includes(imp));
    const unusedExports = uiExports.filter(exp => !appImports.includes(exp));
    
    this.results.integration = {
      uiExportsCount: uiExports.length,
      appImportsCount: appImports.length,
      missingExports: missingExports.length,
      unusedExports: unusedExports.length,
      integrationScore: ((uiExports.length - missingExports.length) / appImports.length * 100).toFixed(1)
    };
    
    console.log(`  📊 Integration Score: ${this.results.integration.integrationScore}%`);
    console.log(`  ❌ Missing exports: ${missingExports.length}`);
    console.log(`  ⚠️  Unused exports: ${unusedExports.length}`);
    
    if (missingExports.length > 0) {
      this.results.recommendations.push(
        `Claude debe agregar estos exports faltantes: ${missingExports.slice(0, 5).join(', ')}`
      );
    }
  }

  async checkCriticalDependencies() {
    console.log('\n🔍 Verificando Dependencias Críticas...');
    
    // Verificar lockfile
    const hasLockfile = fs.existsSync('pnpm-lock.yaml');
    
    // Verificar node_modules
    const hasNodeModules = fs.existsSync('node_modules');
    
    // Verificar versiones TypeScript
    try {
      const tsVersions = execSync('pnpm why typescript', { encoding: 'utf8' });
      const uniqueVersions = [...new Set(tsVersions.match(/typescript@[\d.]+/g))];
      
      if (uniqueVersions.length > 1) {
        this.results.criticalIssues.push(
          `Múltiples versiones de TypeScript detectadas: ${uniqueVersions.join(', ')}`
        );
      }
    } catch {}
    
    console.log(`  ${hasLockfile ? '✅' : '❌'} Lockfile presente`);
    console.log(`  ${hasNodeModules ? '✅' : '❌'} node_modules presente`);
  }

  getAllUIExports() {
    try {
      const indexPath = 'packages/ui/src/index.tsx';
      const content = fs.readFileSync(indexPath, 'utf8');
      const exports = content.match(/export\s+{([^}]+)}/g) || [];
      const components = exports.flatMap(exp => {
        const matches = exp.match(/{([^}]+)}/);
        return matches ? matches[1].split(',').map(c => c.trim()) : [];
      });
      return [...new Set(components)];
    } catch {
      return [];
    }
  }

  getAllAppImports() {
    const imports = new Set();
    const apps = ['patients', 'doctors', 'companies', 'admin'];
    
    for (const app of apps) {
      try {
        const files = execSync(
          `find apps/${app}/src -name "*.tsx" -o -name "*.ts" | xargs grep "@altamedica/ui" || true`,
          { encoding: 'utf8' }
        );
        
        const importMatches = files.match(/import\s+{([^}]+)}\s+from\s+['"]@altamedica\/ui/g) || [];
        importMatches.forEach(imp => {
          const components = imp.match(/{([^}]+)}/);
          if (components) {
            components[1].split(',').forEach(c => imports.add(c.trim()));
          }
        });
      } catch {}
    }
    
    return Array.from(imports);
  }

  getAppPort(app) {
    const portMap = {
      'web-app': 3000,
      'api-server': 3001,
      'doctors': 3002,
      'patients': 3003,
      'companies': 3004,
      'admin': 3005,
      'signaling-server': 8888
    };
    return portMap[app] || 'N/A';
  }

  generateReport() {
    console.log('\n' + '='.repeat(42));
    console.log('📋 RESUMEN DEL HEALTH CHECK\n');
    
    // Score general
    const packagesScore = Object.values(this.results.packages)
      .filter(p => p.buildSuccessful).length / Object.keys(this.results.packages).length * 100;
    const appsScore = Object.values(this.results.apps)
      .filter(a => a.typeCheckPasses).length / Object.keys(this.results.apps).length * 100;
    const overallScore = (packagesScore + appsScore + parseFloat(this.results.integration.integrationScore)) / 3;
    
    console.log(`🏆 HEALTH SCORE GENERAL: ${overallScore.toFixed(1)}%`);
    console.log(`  📦 Packages (Claude): ${packagesScore.toFixed(1)}%`);
    console.log(`  🚀 Apps (Gemini): ${appsScore.toFixed(1)}%`);
    console.log(`  🔗 Integration: ${this.results.integration.integrationScore}%`);
    
    if (this.results.criticalIssues.length > 0) {
      console.log('\n❌ PROBLEMAS CRÍTICOS:');
      this.results.criticalIssues.forEach((issue, i) => {
        console.log(`  ${i + 1}. ${issue}`);
      });
    }
    
    if (this.results.recommendations.length > 0) {
      console.log('\n💡 RECOMENDACIONES:');
      this.results.recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec}`);
      });
    }
    
    // Guardar reporte
    const reportPath = `health-check-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Reporte completo guardado en: ${reportPath}`);
  }
}

// Ejecutar health check
if (require.main === module) {
  const healthCheck = new IntegrationHealthCheck();
  healthCheck.run().then(() => {
    console.log('\n✅ Health check completado');
  }).catch(error => {
    console.error('❌ Error en health check:', error);
    process.exit(1);
  });
}

module.exports = IntegrationHealthCheck;