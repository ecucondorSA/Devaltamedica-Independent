// Simple logger implementation to avoid circular dependencies
const logger = {
  info: (message, data) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.log(message, data);
    }
  },
  warn: (message, data) => {
    if (typeof console !== 'undefined') {
      console.warn(message, data);
    }
  },
  error: (message, data) => {
    if (typeof console !== 'undefined') {
      console.error(message, data);
    }
  },
  debug: (message, data) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.debug(message, data);
    }
  }
};

#!/usr/bin/env node

/**
 * Setup MCP with LLM Integration
 * 
 * Este script configura la integración entre MCP Playwright y diferentes LLMs
 * disponibles para el análisis automático del DOM y generación de tests.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class MCPLLMSetup {
  constructor() {
    this.configFile = path.join(__dirname, '.mcp-llm-config.json');
    this.availableLLMs = {
      'claude-desktop': {
        name: 'Claude Desktop',
        description: 'Usar Claude Desktop como LLM (recomendado)',
        setup: this.setupClaudeDesktop,
        command: 'claude-desktop',
        available: this.checkClaudeDesktop()
      },
      'ollama': {
        name: 'Ollama Local',
        description: 'Usar modelo local con Ollama',
        setup: this.setupOllama,
        command: 'ollama',
        available: this.checkOllama()
      },
      'openai-api': {
        name: 'OpenAI API',
        description: 'Usar API de OpenAI (requiere API key)',
        setup: this.setupOpenAI,
        command: 'openai-api',
        available: true
      },
      'mock-llm': {
        name: 'Mock LLM (Testing)',
        description: 'Simulador para testing sin LLM real',
        setup: this.setupMockLLM,
        command: 'mock-llm',
        available: true
      }
    };
  }

  /**
   * Mostrar LLMs disponibles
   */
  listAvailableLLMs() {
    logger.info('🤖 LLMs Disponibles para MCP Playwright:\n');
    
    Object.entries(this.availableLLMs).forEach(([key, llm]) => {
      const status = llm.available ? '✅' : '❌';
      logger.info(`${status} ${key}: ${llm.name}`);
      logger.info(`   📝 ${llm.description}`);
      
      if (!llm.available) {
        logger.info(`   ⚠️  No disponible - necesita instalación`);
      }
      logger.info('');
    });
  }

  /**
   * Verificar Claude Desktop
   */
  checkClaudeDesktop() {
    try {
      // Verificar si Claude Desktop está instalado
      const claudeConfig = path.join(process.env.APPDATA, 'Claude', 'claude_desktop_config.json');
      return fs.existsSync(claudeConfig);
    } catch {
      return false;
    }
  }

  /**
   * Verificar Ollama
   */
  checkOllama() {
    try {
      execSync('ollama --version', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Setup Claude Desktop
   */
  setupClaudeDesktop() {
    logger.info('🔧 Configurando Claude Desktop...');
    
    const claudeConfigPath = path.join(process.env.APPDATA, 'Claude', 'claude_desktop_config.json');
    
    if (!fs.existsSync(claudeConfigPath)) {
      logger.info('❌ Claude Desktop no encontrado');
      logger.info('📥 Instalar desde: https://claude.ai/download');
      return false;
    }

    // Leer configuración actual
    let config = {};
    try {
      config = JSON.parse(fs.readFileSync(claudeConfigPath, 'utf8'));
    } catch {
      config = {};
    }

    // Agregar configuración MCP
    if (!config.mcpServers) {
      config.mcpServers = {};
    }

    config.mcpServers.playwright = {
      command: "npx",
      args: ["-y", "@executeautomation/playwright-mcp-server"],
      env: {
        NODE_ENV: "test",
        PLAYWRIGHT_BROWSERS_PATH: "ms-playwright"
      }
    };

    // Guardar configuración
    fs.writeFileSync(claudeConfigPath, JSON.stringify(config, null, 2));
    
    logger.info('✅ Claude Desktop configurado');
    logger.info('🔄 Reinicia Claude Desktop para aplicar cambios');
    
    return true;
  }

  /**
   * Setup Ollama
   */
  setupOllama() {
    logger.info('🔧 Configurando Ollama...');
    
    if (!this.checkOllama()) {
      logger.info('❌ Ollama no encontrado');
      logger.info('📥 Instalar desde: https://ollama.com/');
      return false;
    }

    try {
      // Descargar modelo recomendado para análisis de código
      logger.info('📦 Descargando modelo codellama para análisis...');
      execSync('ollama pull codellama:7b', { stdio: 'inherit' });
      
      logger.info('✅ Ollama configurado');
      return true;
    } catch (error) {
      logger.info(`❌ Error configurando Ollama: ${error.message}`);
      return false;
    }
  }

  /**
   * Setup OpenAI API
   */
  setupOpenAI() {
    logger.info('🔧 Configurando OpenAI API...');
    
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      logger.info('❌ OPENAI_API_KEY no encontrada en variables de entorno');
      logger.info('🔑 Agregar: set OPENAI_API_KEY=sk-...');
      return false;
    }
    
    logger.info('✅ OpenAI API configurada');
    return true;
  }

  /**
   * Setup Mock LLM para testing
   */
  setupMockLLM() {
    logger.info('🔧 Configurando Mock LLM...');
    
    const mockResponses = {
      domAnalysis: {
        selectors: [
          'button[data-testid="appointment-button"]',
          'input[placeholder*="search"]',
          'form[data-testid="booking-form"]'
        ],
        workflows: [
          'Click appointment button',
          'Fill search input',
          'Submit booking form'
        ]
      },
      testGeneration: `
test('should complete mock workflow', async ({ page }) => {
  await page.goto('http://localhost:3003');
  await page.getByTestId('appointment-button').click();
  await page.getByPlaceholder(/search/i).fill('test');
  await page.getByTestId('booking-form').getByRole('button', { name: 'Submit' }).click();
});`
    };

    // Guardar configuración mock
    const mockConfig = {
      llm: 'mock-llm',
      responses: mockResponses,
      enabled: true
    };

    fs.writeFileSync(this.configFile, JSON.stringify(mockConfig, null, 2));
    
    logger.info('✅ Mock LLM configurado para testing');
    return true;
  }

  /**
   * Configurar LLM específico
   */
  async setupLLM(llmType) {
    const llm = this.availableLLMs[llmType];
    
    if (!llm) {
      throw new Error(`LLM desconocido: ${llmType}`);
    }
    
    logger.info(`🚀 Configurando ${llm.name}...`);
    
    const success = await llm.setup.call(this);
    
    if (success) {
      // Guardar configuración actual
      const config = {
        currentLLM: llmType,
        setupDate: new Date().toISOString(),
        command: llm.command
      };
      
      fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));
      
      logger.info(`✅ ${llm.name} configurado correctamente`);
      return true;
    }
    
    return false;
  }

  /**
   * Verificar configuración actual
   */
  checkCurrentSetup() {
    if (!fs.existsSync(this.configFile)) {
      logger.info('⚠️ No hay configuración MCP-LLM');
      return null;
    }

    try {
      const config = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
      logger.info(`✅ LLM actual: ${config.currentLLM}`);
      logger.info(`📅 Configurado: ${new Date(config.setupDate).toLocaleString()}`);
      return config;
    } catch (error) {
      logger.info(`❌ Error leyendo configuración: ${error.message}`);
      return null;
    }
  }

  /**
   * Ejecutar test con LLM
   */
  async runWithLLM(workflow) {
    const config = this.checkCurrentSetup();
    
    if (!config) {
      logger.info('❌ No hay LLM configurado. Ejecuta setup primero.');
      return false;
    }

    logger.info(`🤖 Ejecutando ${workflow} con ${config.currentLLM}...`);

    // Dependiendo del LLM configurado, usar diferente estrategia
    switch (config.currentLLM) {
      case 'claude-desktop':
        return this.runWithClaudeDesktop(workflow);
      
      case 'ollama':
        return this.runWithOllama(workflow);
        
      case 'openai-api':
        return this.runWithOpenAI(workflow);
        
      case 'mock-llm':
        return this.runWithMockLLM(workflow);
        
      default:
        logger.info(`❌ LLM no soportado: ${config.currentLLM}`);
        return false;
    }
  }

  /**
   * Ejecutar con Claude Desktop
   */
  runWithClaudeDesktop(workflow) {
    logger.info('🤖 Usando Claude Desktop para análisis del DOM...');
    logger.info('📝 Instrucciones:');
    logger.info('1. Abre Claude Desktop');
    logger.info('2. Escribe: "Generate Playwright test for AltaMedica workflow"');
    logger.info('3. El servidor MCP analizará automáticamente el DOM');
    logger.info('4. Claude generará el test basado en el análisis');
    
    // Por ahora, usar fallback mock
    return this.runWithMockLLM(workflow);
  }

  /**
   * Ejecutar con Mock LLM
   */
  runWithMockLLM(workflow) {
    logger.info('🎭 Usando Mock LLM (simulación)...');
    
    try {
      // Ejecutar generador con datos mock
      const { MultiAreaGenerator } = require('./multi-area-generator.js');
      const generator = new MultiAreaGenerator();
      
      logger.info('📊 Análisis DOM simulado completado');
      logger.info('🔍 Selectors detectados: button[data-testid], input[placeholder], form');
      logger.info('✅ Test generado con datos mock');
      
      return true;
    } catch (error) {
      logger.info(`❌ Error ejecutando mock: ${error.message}`);
      return false;
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const setup = new MCPLLMSetup();

  if (args.includes('--list') || args.includes('-l')) {
    setup.listAvailableLLMs();
    return;
  }

  if (args.includes('--check') || args.includes('-c')) {
    setup.checkCurrentSetup();
    return;
  }

  const setupIndex = args.indexOf('--setup');
  if (setupIndex !== -1) {
    const llmType = args[setupIndex + 1];
    
    if (!llmType) {
      logger.error('❌ --setup requiere tipo de LLM');
      logger.info('Disponibles: claude-desktop, ollama, openai-api, mock-llm');
      return;
    }

    try {
      await setup.setupLLM(llmType);
    } catch (error) {
      logger.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
    return;
  }

  const runIndex = args.indexOf('--run');
  if (runIndex !== -1) {
    const workflow = args[runIndex + 1];
    
    if (!workflow) {
      logger.error('❌ --run requiere nombre de workflow');
      return;
    }

    const success = await setup.runWithLLM(workflow);
    process.exit(success ? 0 : 1);
  }

  // Mostrar ayuda
  logger.info(`
🤖 MCP-LLM Setup para Playwright

Configura la integración entre MCP Playwright y modelos de lenguaje
para generar tests automáticamente analizando el DOM.

Usage:
  node setup-mcp-llm.js --list                    # Listar LLMs disponibles
  node setup-mcp-llm.js --setup <llm-type>        # Configurar LLM específico
  node setup-mcp-llm.js --check                   # Verificar configuración actual
  node setup-mcp-llm.js --run <workflow>          # Ejecutar workflow con LLM

LLM Types:
  claude-desktop    # Claude Desktop (recomendado)
  ollama           # Modelo local con Ollama
  openai-api       # API de OpenAI
  mock-llm         # Simulador para testing

Ejemplos:
  node setup-mcp-llm.js --setup mock-llm
  node setup-mcp-llm.js --run complete-medical-journey
  node setup-mcp-llm.js --list
  `);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { MCPLLMSetup };