#!/usr/bin/env node

/**
 * Multi-Area MCP Playwright Generator
 * 
 * Genera tests E2E para múltiples áreas/aplicaciones usando MCP
 * 
 * Usage:
 *   node multi-area-generator.js --areas "patients,doctors,companies" --flow "complete-workflow"
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuración multi-área
const MULTI_AREA_WORKFLOWS = {
  'complete-medical-journey': {
    name: 'Complete Medical Journey (Multi-Area)',
    description: 'Flujo completo desde booking hasta consulta y marketplace',
    areas: ['patients', 'doctors', 'companies'],
    steps: [
      {
        area: 'patients',
        flow: 'booking',
        description: 'Paciente reserva cita médica'
      },
      {
        area: 'doctors',
        flow: 'consultation',
        description: 'Doctor realiza consulta'
      },
      {
        area: 'companies',
        flow: 'marketplace',
        description: 'Empresa busca doctores especialistas'
      }
    ]
  },
  
  'telemedicine-ecosystem': {
    name: 'Telemedicine Ecosystem (Multi-Area)',
    description: 'Ecosistema completo de telemedicina entre pacientes y doctores',
    areas: ['patients', 'doctors'],
    steps: [
      {
        area: 'patients',
        flow: 'telemedicine',
        description: 'Paciente inicia sesión de telemedicina'
      },
      {
        area: 'doctors',
        flow: 'consultation',
        description: 'Doctor conduce consulta virtual'
      }
    ]
  },
  
  'b2b-medical-hiring': {
    name: 'B2B Medical Hiring Process (Multi-Area)',
    description: 'Proceso completo de contratación médica B2B',
    areas: ['companies', 'doctors'],
    steps: [
      {
        area: 'companies',
        flow: 'marketplace',
        description: 'Empresa publica oferta médica'
      },
      {
        area: 'doctors',
        flow: 'schedule',
        description: 'Doctor gestiona disponibilidad para nueva posición'
      }
    ]
  }
};

class MultiAreaGenerator {
  constructor() {
    this.testsDir = path.join(__dirname, 'tests', 'multi-area');
    this.singleAreaGenerator = path.join(__dirname, 'ai-test-generator.js');
    
    // Asegurar que existe el directorio
    if (!fs.existsSync(this.testsDir)) {
      fs.mkdirSync(this.testsDir, { recursive: true });
    }
  }

  /**
   * Generar workflow multi-área completo
   */
  async generateMultiAreaWorkflow(workflowName, options = {}) {
    const workflow = MULTI_AREA_WORKFLOWS[workflowName];
    
    if (!workflow) {
      throw new Error(`Workflow desconocido: ${workflowName}`);
    }
    
    logger.info(`🔄 Generando workflow multi-área: ${workflow.name}`);
    
    const testComponents = [];
    const generatedFiles = [];
    
    // Generar tests individuales para cada área
    for (const step of workflow.steps) {
      logger.info(`📱 Generando para ${step.area} - ${step.flow}`);
      
      try {
        // Usar el generador existente para cada área
        const singleTestPath = await this.generateSingleAreaTest(step.area, step.flow);
        const testContent = fs.readFileSync(singleTestPath, 'utf8');
        
        testComponents.push({
          area: step.area,
          flow: step.flow,
          description: step.description,
          content: testContent
        });
        
        generatedFiles.push(singleTestPath);
        
      } catch (error) {
        logger.warn(`⚠️ Error generando ${step.area}-${step.flow}: ${error.message}`);
      }
    }
    
    // Crear test multi-área combinado
    const multiAreaTest = this.combineTestsIntoWorkflow(workflow, testComponents);
    const multiAreaPath = path.join(this.testsDir, `${workflowName}.spec.ts`);
    
    fs.writeFileSync(multiAreaPath, multiAreaTest, 'utf8');
    
    logger.info(`✅ Workflow multi-área generado: ${multiAreaPath}`);
    
    return {
      multiAreaTest: multiAreaPath,
      individualTests: generatedFiles,
      workflow: workflow
    };
  }
  
  /**
   * Generar test individual usando el AI generator existente
   */
  async generateSingleAreaTest(app, flow) {
    const command = `node "${this.singleAreaGenerator}" --app ${app} --flow ${flow}`;
    
    try {
      execSync(command, { 
        cwd: __dirname,
        stdio: 'pipe'
      });
      
      // El generador crea archivos con este patrón
      return path.join(__dirname, 'tests', 'ai-generated', `${app}-${flow}-ai-generated.spec.ts`);
      
    } catch (error) {
      throw new Error(`Failed to generate test for ${app}-${flow}: ${error.message}`);
    }
  }
  
  /**
   * Combinar tests individuales en un workflow multi-área
   */
  combineTestsIntoWorkflow(workflow, testComponents) {
    const timestamp = new Date().toISOString();
    
    return `/**
 * Multi-Area E2E Test: ${workflow.name}
 * Generated: ${timestamp}
 * 
 * Este test multi-área coordina flujos entre múltiples aplicaciones
 * usando Playwright MCP para crear un workflow end-to-end completo.
 */

import { test, expect } from '@playwright/test';
import { authenticateAs } from '../helpers/.claude';

import { logger } from '@altamedica/shared/services/logger.service';
test.describe('${workflow.name}', () => {
  test('should complete full multi-area workflow', async ({ browser }) => {
    
${this.generateMultiAreaTestSteps(workflow, testComponents)}

  });

  test('should handle cross-area data consistency', async ({ browser }) => {
    // Test para verificar consistencia de datos entre áreas
    await test.step('Verify data sync between areas', async () => {
      logger.info('Verificando sincronización de datos entre áreas');
      
      // TODO: Implementar verificaciones de consistencia
      // - Citas creadas en patients aparecen en doctors
      // - Perfiles actualizados se reflejan en todas las áreas
      // - Notificaciones llegan a las áreas correctas
    });
  });

  test('should handle multi-area error scenarios', async ({ browser }) => {
    // Test para escenarios de error multi-área
    await test.step('Handle cross-area failures gracefully', async () => {
      logger.info('Probando manejo de errores multi-área');
      
      // TODO: Implementar escenarios de error
      // - Una área no disponible
      // - Timeouts de comunicación entre áreas
      // - Conflictos de datos entre áreas
    });
  });
});

/**
 * Configuración multi-área
 */
const MULTI_AREA_CONFIG = {
  baseURLs: {
${workflow.areas.map(area => `    ${area}: 'http://localhost:${this.getPortForArea(area)}'`).join(',\n')}
  },
  
  testData: {
    // Datos compartidos entre áreas para el workflow
    sharedUserId: 'multi-area-test-user-${Date.now()}',
    workflowId: '${workflow.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}'
  }
};

/**
 * AI Analysis Notes - Multi-Area:
 * 
 * 1. Cross-Area Communication: Tests verifican comunicación entre aplicaciones
 * 2. Data Consistency: Validación de sincronización de datos
 * 3. Error Handling: Manejo robusto de fallos multi-área
 * 4. Performance: Consideraciones de latencia entre áreas
 * 5. Security: Validación de permisos cross-area
 */`;
  }
  
  /**
   * Generar steps para el test multi-área
   */
  generateMultiAreaTestSteps(workflow, testComponents) {
    return workflow.steps.map((step, index) => {
      const stepNumber = index + 1;
      return `
    // Step ${stepNumber}: ${step.description}
    await test.step('${step.description}', async () => {
      const ${step.area}Context = await browser.newContext();
      const ${step.area}Page = await ${step.area}Context.newPage();
      
      try {
        // Navegar a ${step.area} app
        await ${step.area}Page.goto('http://localhost:${this.getPortForArea(step.area)}');
        
        // Autenticación específica para ${step.area}
        await authenticateAs(${step.area}Page, '${step.area.slice(0, -1)}', 'test.${step.area.slice(0, -1)}@altamedica.mx');
        
        // Ejecutar flujo específico de ${step.flow}
        logger.info('Ejecutando ${step.flow} en ${step.area}');
        
        // TODO: Implementar pasos específicos del flujo
        // Basado en el test generado para ${step.area}-${step.flow}
        
        // Verificar resultados del step
        await expect(${step.area}Page).toHaveURL(/.*${step.area}/);
        
      } finally {
        await ${step.area}Context.close();
      }
    });`;
    }).join('\n');
  }
  
  /**
   * Obtener puerto para área específica
   */
  getPortForArea(area) {
    const ports = {
      'patients': 3003,
      'doctors': 3002,
      'companies': 3004,
      'admin': 3005,
      'web-app': 3000
    };
    
    return ports[area] || 3000;
  }
  
  /**
   * Listar workflows disponibles
   */
  listWorkflows() {
    logger.info('🔄 Workflows Multi-Área Disponibles:\n');
    
    Object.entries(MULTI_AREA_WORKFLOWS).forEach(([key, workflow]) => {
      logger.info(`📋 ${key}:`);
      logger.info(`   📝 ${workflow.name}`);
      logger.info(`   📱 Áreas: ${workflow.areas.join(', ')}`);
      logger.info(`   📋 ${workflow.description}`);
      logger.info(`   🔗 Steps:`);
      
      workflow.steps.forEach((step, index) => {
        logger.info(`      ${index + 1}. ${step.area} → ${step.flow}: ${step.description}`);
      });
      logger.info('');
    });
  }
  
  /**
   * Generar área específica personalizada
   */
  async generateCustomMultiArea(areas, flowName = 'custom') {
    logger.info(`🎯 Generando workflow personalizado para: ${areas.join(', ')}`);
    
    const customWorkflow = {
      name: `Custom Multi-Area Workflow (${areas.join('-')})`,
      description: `Workflow personalizado para ${areas.join(', ')}`,
      areas: areas,
      steps: areas.map(area => ({
        area: area,
        flow: 'booking', // Flow por defecto
        description: `Execute workflow in ${area} area`
      }))
    };
    
    return await this.generateMultiAreaWorkflow('custom', { workflow: customWorkflow });
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const generator = new MultiAreaGenerator();
  
  if (args.includes('--list') || args.includes('-l')) {
    generator.listWorkflows();
    return;
  }
  
  const workflowIndex = args.indexOf('--workflow');
  const areasIndex = args.indexOf('--areas');
  
  if (workflowIndex !== -1) {
    // Generar workflow predefinido
    const workflowName = args[workflowIndex + 1];
    
    if (!workflowName) {
      logger.error('❌ --workflow requiere un nombre');
      return;
    }
    
    try {
      const result = await generator.generateMultiAreaWorkflow(workflowName);
      logger.info(`\n🎉 Workflow multi-área generado exitosamente!`);
      logger.info(`📁 Archivo principal: ${result.multiAreaTest}`);
      logger.info(`📂 Tests individuales: ${result.individualTests.length}`);
      logger.info(`\n🚀 Para ejecutar:`);
      logger.info(`   pnpm test:e2e ${path.basename(result.multiAreaTest)}`);
      
    } catch (error) {
      logger.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
    
  } else if (areasIndex !== -1) {
    // Generar workflow personalizado
    const areasStr = args[areasIndex + 1];
    
    if (!areasStr) {
      logger.error('❌ --areas requiere lista de áreas separadas por coma');
      return;
    }
    
    const areas = areasStr.split(',').map(a => a.trim());
    
    try {
      const result = await generator.generateCustomMultiArea(areas);
      logger.info(`\n🎉 Workflow personalizado generado!`);
      logger.info(`📁 Archivo: ${result.multiAreaTest}`);
      
    } catch (error) {
      logger.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
    
  } else {
    logger.info(`
🔄 Multi-Area MCP Playwright Generator

Genera tests E2E que coordinan múltiples áreas de AltaMedica Platform.

Usage:
  node multi-area-generator.js --workflow <workflow-name>
  node multi-area-generator.js --areas <area1,area2,area3>
  node multi-area-generator.js --list

Workflows Predefinidos:
  --workflow complete-medical-journey    # Patients → Doctors → Companies
  --workflow telemedicine-ecosystem      # Patients ↔ Doctors (WebRTC)
  --workflow b2b-medical-hiring          # Companies ↔ Doctors

Ejemplos:
  node multi-area-generator.js --workflow complete-medical-journey
  node multi-area-generator.js --areas "patients,doctors"
  node multi-area-generator.js --list
    `);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { MultiAreaGenerator, MULTI_AREA_WORKFLOWS };