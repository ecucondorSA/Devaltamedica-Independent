import { logger } from '../logger';

/**
 * BaseMCP - Clase base para todos los agentes MCP especializados
 * MCP = Model Context Protocol - Agentes expertos en contextos específicos
 */

export interface MCPConfig {
  name: string;
  app: string;
  port: number;
  description: string;
  location: string;
}

export interface FilePattern {
  pattern: string;
  description: string;
  example?: string;
}

export interface RouteInfo {
  path: string;
  method?: string;
  description: string;
  component?: string;
  authentication?: boolean;
}

export interface CommandInfo {
  command: string;
  description: string;
  example?: string;
}

export interface TechStack {
  framework: string;
  version: string;
  ui?: string[];
  state?: string[];
  styling?: string[];
  testing?: string[];
  other?: string[];
}

export interface AppKnowledge {
  purpose: string;
  mainFeatures: string[];
  techStack: TechStack;
  keyFiles: FilePattern[];
  routes: RouteInfo[];
  commands: CommandInfo[];
  dependencies: string[];
  commonIssues: string[];
  bestPractices: string[];
  integrations: string[];
  secrets?: string[];
}

export abstract class BaseMCP {
  protected config: MCPConfig;
  protected knowledge: AppKnowledge;

  constructor(config: MCPConfig, knowledge: AppKnowledge) {
    this.config = config;
    this.knowledge = knowledge;
  }

  /**
   * Obtener información básica de la aplicación
   */
  getInfo(): void {
    logger.info(`\n🚀 ${this.config.name}`);
    logger.info(`📍 Ubicación: ${this.config.location}`);
    logger.info(`🌐 Puerto: ${this.config.port}`);
    logger.info(`📝 Descripción: ${this.config.description}`);
    logger.info(`\n🎯 Propósito: ${this.knowledge.purpose}`);
  }

  /**
   * Listar características principales
   */
  listFeatures(): void {
    logger.info(`\n✨ Características principales de ${this.config.app}:\n`);
    this.knowledge.mainFeatures.forEach(feature => {
      logger.info(`  • ${feature}`);
    });
  }

  /**
   * Mostrar stack tecnológico
   */
  showTechStack(): void {
    logger.info(`\n🛠️ Stack Tecnológico de ${this.config.app}:\n`);
    const stack = this.knowledge.techStack;
    logger.info(`  Framework: ${stack.framework} ${stack.version}`);
    
    if (stack.ui?.length) {
      logger.info(`  UI: ${stack.ui.join(', ')}`);
    }
    if (stack.state?.length) {
      logger.info(`  Estado: ${stack.state.join(', ')}`);
    }
    if (stack.styling?.length) {
      logger.info(`  Estilos: ${stack.styling.join(', ')}`);
    }
    if (stack.testing?.length) {
      logger.info(`  Testing: ${stack.testing.join(', ')}`);
    }
  }

  /**
   * Listar archivos importantes
   */
  listKeyFiles(): void {
    logger.info(`\n📁 Archivos clave en ${this.config.app}:\n`);
    this.knowledge.keyFiles.forEach(file => {
      logger.info(`  📄 ${file.pattern}`);
      logger.info(`     ${file.description}`);
      if (file.example) {
        logger.info(`     Ejemplo: ${file.example}`);
      }
    });
  }

  /**
   * Mostrar rutas disponibles
   */
  showRoutes(): void {
    logger.info(`\n🗺️ Rutas en ${this.config.app}:\n`);
    this.knowledge.routes.forEach(route => {
      const auth = route.authentication ? '🔒' : '🌐';
      const method = route.method || 'GET';
      logger.info(`  ${auth} ${method} ${route.path}`);
      logger.info(`     ${route.description}`);
      if (route.component) {
        logger.info(`     Componente: ${route.component}`);
      }
    });
  }

  /**
   * Listar comandos disponibles
   */
  listCommands(): void {
    logger.info(`\n⚡ Comandos para ${this.config.app}:\n`);
    this.knowledge.commands.forEach(cmd => {
      logger.info(`  $ ${cmd.command}`);
      logger.info(`    ${cmd.description}`);
      if (cmd.example) {
        logger.info(`    Ejemplo: ${cmd.example}`);
      }
    });
  }

  /**
   * Resolver problemas comunes
   */
  troubleshoot(problem: string): void {
    logger.info(`\n🔍 Analizando problema en ${this.config.app}...\n`);
    const problemLower = problem.toLowerCase();
    
    // Buscar en problemas comunes
    const relevantIssues = this.knowledge.commonIssues.filter(issue => 
      issue.toLowerCase().includes(problemLower)
    );
    
    if (relevantIssues.length > 0) {
      logger.info('💡 Problemas relacionados encontrados:');
      relevantIssues.forEach(issue => {
        logger.info(`  • ${issue}`);
      });
    }
    
    // Sugerencias generales basadas en palabras clave
    this.suggestGeneralSolutions(problemLower);
  }

  /**
   * Sugerir soluciones generales
   */
  protected suggestGeneralSolutions(problem: string): void {
    if (problem.includes('port') || problem.includes('puerto')) {
      logger.info(`\n📌 El puerto de ${this.config.app} es: ${this.config.port}`);
      logger.info('   Verificar que no esté ocupado: netstat -ano | findstr :' + this.config.port);
    }
    
    if (problem.includes('build') || problem.includes('compile')) {
      logger.info('\n🏗️ Para construir:');
      logger.info(`   pnpm --filter ${this.config.app} build`);
    }
    
    if (problem.includes('install') || problem.includes('dependency')) {
      logger.info('\n📦 Para instalar dependencias:');
      logger.info(`   pnpm --filter ${this.config.app} install`);
    }
  }

  /**
   * Mostrar mejores prácticas
   */
  showBestPractices(): void {
    logger.info(`\n✅ Mejores prácticas para ${this.config.app}:\n`);
    this.knowledge.bestPractices.forEach((practice, index) => {
      logger.info(`  ${index + 1}. ${practice}`);
    });
  }

  /**
   * Buscar funcionalidad
   */
  findFeature(query: string): void {
    logger.info(`\n🔎 Buscando "${query}" en ${this.config.app}...\n`);
    const queryLower = query.toLowerCase();
    
    // Buscar en features
    const features = this.knowledge.mainFeatures.filter(f => 
      f.toLowerCase().includes(queryLower)
    );
    
    if (features.length > 0) {
      logger.info('✨ Características encontradas:');
      features.forEach(f => logger.info(`  • ${f}`));
    }
    
    // Buscar en rutas
    const routes = this.knowledge.routes.filter(r => 
      r.path.toLowerCase().includes(queryLower) || 
      r.description.toLowerCase().includes(queryLower)
    );
    
    if (routes.length > 0) {
      logger.info('\n🗺️ Rutas relacionadas:');
      routes.forEach(r => logger.info(`  • ${r.path} - ${r.description}`));
    }
    
    // Buscar en archivos
    const files = this.knowledge.keyFiles.filter(f => 
      f.pattern.toLowerCase().includes(queryLower) ||
      f.description.toLowerCase().includes(queryLower)
    );
    
    if (files.length > 0) {
      logger.info('\n📁 Archivos relacionados:');
      files.forEach(f => logger.info(`  • ${f.pattern} - ${f.description}`));
    }
  }

  /**
   * Método abstracto para obtener ayuda específica
   */
  abstract help(query?: string): void;

  /**
   * Método abstracto para generar código de ejemplo
   */
  abstract generateExample(type: string): string;
}