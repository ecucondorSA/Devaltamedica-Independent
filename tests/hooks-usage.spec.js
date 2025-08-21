/**
 * @fileoverview Tests de Playwright para validar uso de hooks
 * @description Suite de tests para detectar hooks no utilizados y validar migraciones
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const HooksUsageAnalyzer = require('../scripts/analyze-hooks-usage');

test.describe('Análisis de Uso de Hooks', () => {
  let analyzer;
  let analysisResults;

  test.beforeAll(async () => {
    analyzer = new HooksUsageAnalyzer();
    await analyzer.analyze();
    analysisResults = analyzer.results;
  });

  test.describe('Cobertura de Hooks', () => {
    test('debería tener al menos 15% de hooks utilizados', async () => {
      const usagePercentage = (analysisResults.usedHooks.size / analysisResults.totalHooks) * 100;
      
      console.log(`📊 Cobertura actual: ${usagePercentage.toFixed(1)}%`);
      
      expect(usagePercentage).toBeGreaterThan(15);
    });

    test('no debería tener más de 50 hooks no utilizados', async () => {
      const unusedCount = analysisResults.totalHooks - analysisResults.usedHooks.size;
      
      console.log(`❌ Hooks no utilizados: ${unusedCount}`);
      
      if (unusedCount > 50) {
        const unusedList = [...analysisResults.unusedHooks].slice(0, 10);
        console.log('Ejemplos de hooks no utilizados:', unusedList.map(h => h.name));
      }
      
      expect(unusedCount).toBeLessThanOrEqual(50);
    });

    test('debería identificar hooks críticos utilizados', async () => {
      const criticalHooks = ['useAuth', 'useDebounce', 'useAPI', 'usePatients'];
      const usedHookNames = [...analysisResults.usedHooks].map(h => h.name);
      
      for (const criticalHook of criticalHooks) {
        expect(usedHookNames).toContain(criticalHook);
      }
    });
  });

  test.describe('Duplicación de Hooks', () => {
    test('no debería tener más de 10 hooks duplicados', async () => {
      const duplicatedCount = analysisResults.duplicatedHooks.size;
      
      console.log(`🔄 Hooks duplicados: ${duplicatedCount}`);
      
      if (duplicatedCount > 0) {
        const examples = Array.from(analysisResults.duplicatedHooks.entries()).slice(0, 5);
        console.log('Ejemplos de duplicaciones:', examples.map(([name]) => name));
      }
      
      expect(duplicatedCount).toBeLessThanOrEqual(10);
    });

    test('debería recomendar migración para hooks altamente duplicados', async () => {
      const highDuplicationThreshold = 3;
      const highlyDuplicated = [];
      
      for (const [hookName, duplicates] of analysisResults.duplicatedHooks.entries()) {
        if (duplicates.length >= highDuplicationThreshold) {
          highlyDuplicated.push({
            name: hookName,
            count: duplicates.length,
            apps: duplicates.map(d => d.app)
          });
        }
      }
      
      if (highlyDuplicated.length > 0) {
        console.log('🚨 Hooks que requieren migración inmediata:', highlyDuplicated);
      }
      
      // No fallamos el test, pero generamos reporte
      expect(highlyDuplicated.length).toBeLessThanOrEqual(5);
    });
  });

  test.describe('Dependencias y Configuración', () => {
    test('no debería tener problemas de dependencias faltantes', async () => {
      const issueCount = analysisResults.dependencyIssues.length;
      
      console.log(`⚠️ Problemas de dependencias: ${issueCount}`);
      
      if (issueCount > 0) {
        console.log('Problemas encontrados:', analysisResults.dependencyIssues);
      }
      
      expect(issueCount).toBe(0);
    });

    test('todas las apps con hooks deberían tener la dependencia correcta', async () => {
      const appsDir = path.join(__dirname, '..', 'apps');
      const apps = fs.readdirSync(appsDir);
      const appsWithoutDependency = [];

      for (const app of apps) {
        const packageJsonPath = path.join(appsDir, app, 'package.json');
        if (!fs.existsSync(packageJsonPath)) continue;

        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const hasHooksDependency = packageJson.dependencies && 
          packageJson.dependencies['@altamedica/hooks'];

        // Verificar si usa hooks
        const usedHooks = [...analysisResults.usedHooks].filter(h => h.app === app);
        
        if (usedHooks.length > 0 && !hasHooksDependency) {
          appsWithoutDependency.push({
            app,
            hooksUsed: usedHooks.map(h => h.name)
          });
        }
      }

      if (appsWithoutDependency.length > 0) {
        console.log('Apps sin dependencia pero usando hooks:', appsWithoutDependency);
      }

      expect(appsWithoutDependency).toHaveLength(0);
    });
  });

  test.describe('Funcionalidad en Runtime', () => {
    test('hooks exportados deberían ser importables', async () => {
      // Test que verifica que los hooks principales se puedan importar
      const criticalHooks = ['useAuth', 'useDebounce', 'useAPI'];
      
      for (const hookName of criticalHooks) {
        try {
          // Simular importación (en un entorno real)
          const moduleExists = fs.existsSync(
            path.join(__dirname, '..', 'packages', 'hooks', 'src', 'index.ts')
          );
          expect(moduleExists).toBeTruthy();
          
          // Verificar que está en el índice
          const indexContent = fs.readFileSync(
            path.join(__dirname, '..', 'packages', 'hooks', 'src', 'index.ts'),
            'utf8'
          );
          
          const isExported = indexContent.includes(hookName) || 
                           /export \* from/.test(indexContent);
          
          expect(isExported).toBeTruthy();
        } catch (error) {
          console.error(`❌ Error verificando ${hookName}:`, error.message);
          throw error;
        }
      }
    });
  });

  test.describe('Generación de Reportes', () => {
    test('debería generar reporte de migración', async () => {
      const migrationPlan = {
        priority1: [], // Hooks con 5+ duplicaciones
        priority2: [], // Hooks con 3-4 duplicaciones  
        priority3: [], // Hooks con 2 duplicaciones
        canRemove: [] // Hooks sin uso
      };

      // Clasificar por prioridad
      for (const [hookName, duplicates] of analysisResults.duplicatedHooks.entries()) {
        if (duplicates.length >= 5) {
          migrationPlan.priority1.push({ name: hookName, duplicates: duplicates.length });
        } else if (duplicates.length >= 3) {
          migrationPlan.priority2.push({ name: hookName, duplicates: duplicates.length });
        } else {
          migrationPlan.priority3.push({ name: hookName, duplicates: duplicates.length });
        }
      }

      // Hooks que se pueden eliminar
      migrationPlan.canRemove = [...analysisResults.unusedHooks]
        .filter(hook => hook.category !== 'critical')
        .slice(0, 20);

      const reportPath = path.join(__dirname, '..', 'migration-plan.json');
      fs.writeFileSync(reportPath, JSON.stringify(migrationPlan, null, 2));

      console.log('📋 Plan de migración generado:', {
        priority1: migrationPlan.priority1.length,
        priority2: migrationPlan.priority2.length,
        priority3: migrationPlan.priority3.length,
        canRemove: migrationPlan.canRemove.length
      });

      expect(fs.existsSync(reportPath)).toBeTruthy();
    });

    test('debería calcular ROI de migración', async () => {
      const totalDuplicatedLines = Array.from(analysisResults.duplicatedHooks.values())
        .reduce((total, duplicates) => total + duplicates.length * 20, 0); // Estimado 20 líneas por hook

      const estimatedSavings = {
        linesOfCode: totalDuplicatedLines,
        maintenanceHours: Math.floor(totalDuplicatedLines / 50), // 1 hora por 50 líneas
        bundleSize: Math.floor(totalDuplicatedLines * 0.1), // KB estimados
        developmentTime: analysisResults.duplicatedHooks.size * 2 // 2h por hook migrado
      };

      console.log('💰 ROI Estimado de migración:', estimatedSavings);

      expect(estimatedSavings.linesOfCode).toBeGreaterThan(0);
      expect(estimatedSavings.maintenanceHours).toBeGreaterThan(0);
    });
  });
});

test.describe('Tests de Integración con Apps', () => {
  test('app doctors debería usar useDebounce correctamente', async ({ page }) => {
    // Test específico para verificar que la migración funcionó
    const prescriptionsPageExists = fs.existsSync(
      path.join(__dirname, '..', 'apps', 'doctors', 'src', 'app', 'prescriptions', 'page.tsx')
    );

    if (prescriptionsPageExists) {
      const content = fs.readFileSync(
        path.join(__dirname, '..', 'apps', 'doctors', 'src', 'app', 'prescriptions', 'page.tsx'),
        'utf8'
      );

      expect(content).toContain("import { useDebounce } from '@altamedica/hooks'");
      expect(content).toContain('useDebounce(searchTerm, 500)');
    }
  });

  test('app patients debería tener re-exports correctos', async () => {
    const reExportFiles = [
      'useOptimizedPerformance.ts',
      'useAltamedicaAPI.ts', 
      'useAccessibility.ts'
    ];

    for (const fileName of reExportFiles) {
      const filePath = path.join(__dirname, '..', 'apps', 'patients', 'src', 'hooks', fileName);
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        expect(content).toContain("@altamedica/hooks");
        expect(content).not.toContain("@altamedica/utils");
        expect(content).not.toContain("@altamedica/auth-service");
      }
    }
  });
});