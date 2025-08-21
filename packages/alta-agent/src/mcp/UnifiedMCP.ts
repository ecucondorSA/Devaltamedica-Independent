/**
 * UnifiedMCP - Coordinador central de todos los agentes MCP
 * Este es el punto de entrada principal para consultar sobre cualquier parte del sistema
 */

import { WebMCP, webMCP } from './WebMCP';
import { PatientMCP, patientMCP } from './PatientMCP';
import { DoctorMCP, doctorMCP } from './DoctorMCP';
import { APIMCP, apiMCP } from './APIMCP';
import { CompaniesMCP, companiesMCP } from './CompaniesMCP';
import { PackageExpertAgent, packageExpert } from '../PackageExpertAgent';

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
export interface MCPSystem {
  name: string;
  agent: any;
  port: number;
  description: string;
}

export class UnifiedMCP {
  private systems: Map<string, MCPSystem>;
  
  constructor() {
    this.systems = new Map([
      ['web', { 
        name: 'WebMCP', 
        agent: webMCP, 
        port: 3000,
        description: 'Gateway público y autenticación'
      }],
      ['patients', { 
        name: 'PatientMCP', 
        agent: patientMCP, 
        port: 3003,
        description: 'Portal de pacientes'
      }],
      ['doctors', { 
        name: 'DoctorMCP', 
        agent: doctorMCP, 
        port: 3002,
        description: 'Portal de doctores'
      }],
      ['api', { 
        name: 'APIMCP', 
        agent: apiMCP, 
        port: 3001,
        description: 'Backend central'
      }],
      ['companies', { 
        name: 'CompaniesMCP', 
        agent: companiesMCP, 
        port: 3004,
        description: 'Marketplace B2B'
      }],
      ['packages', { 
        name: 'PackageExpert', 
        agent: packageExpert, 
        port: 0,
        description: 'Experto en packages'
      }]
    ]);
  }

  /**
   * Obtener agente específico
   */
  getAgent(system: string): any {
    const sys = this.systems.get(system);
    if (!sys) {
      logger.info(`❌ Sistema '${system}' no encontrado.`);
      logger.info(`   Sistemas disponibles: ${Array.from(this.systems.keys()).join(', ')}`);
      return null;
    }
    return sys.agent;
  }

  /**
   * Listar todos los sistemas
   */
  listSystems(): void {
    logger.info('\n🏥 SISTEMAS DE ALTAMEDICA MCP\n');
    logger.info('Sistema coordinado de agentes expertos:\n');
    
    this.systems.forEach((system, key) => {
      const portInfo = system.port ? `:${system.port}` : '';
      logger.info(`📦 ${key}${portInfo} - ${system.description}`);
      logger.info(`   Agente: ${system.name}`);
      logger.info(`   Uso: mcp.${key}.help()\n`);
    });
  }

  /**
   * Buscar funcionalidad en todos los sistemas
   */
  findFeature(query: string): void {
    logger.info(`\n🔍 Buscando "${query}" en todos los sistemas...\n`);
    
    const results: Array<{system: string, found: boolean}> = [];
    
    // Buscar en cada sistema
    this.systems.forEach((system, key) => {
      if (key === 'packages') {
        // PackageExpert tiene método diferente
        const recommendations = packageExpert.recommendPackages(query);
        if (recommendations.length > 0) {
          logger.info(`📦 En packages:`);
          recommendations.forEach(rec => {
            logger.info(`   • ${rec.package} - ${rec.reason}`);
          });
          results.push({system: key, found: true});
        }
      } else if (system.agent.findFeature) {
        // Capturar output del agente
        const originalLog = console.log;
        let output = '';
        console.log = (msg: any) => { output += msg + '\n'; };
        
        system.agent.findFeature(query);
        
        console.log = originalLog;
        
        if (output.includes('encontrad')) {
          logger.info(`\n🎯 En ${key}:`);
          logger.info(output);
          results.push({system: key, found: true});
        }
      }
    });
    
    if (results.filter(r => r.found).length === 0) {
      logger.info('❌ No se encontraron coincidencias.');
    } else {
      logger.info(`\n✅ Encontrado en ${results.filter(r => r.found).length} sistemas.`);
    }
  }

  /**
   * Resolver problema consultando múltiples agentes
   */
  troubleshoot(problem: string): void {
    logger.info(`\n🔧 Analizando problema: "${problem}"\n`);
    logger.info('Consultando agentes especializados...\n');
    
    const problemLower = problem.toLowerCase();
    
    // Determinar qué agentes consultar basado en keywords
    const agentsToConsult: string[] = [];
    
    if (problemLower.includes('auth') || problemLower.includes('login')) {
      agentsToConsult.push('web', 'api');
    }
    
    if (problemLower.includes('video') || problemLower.includes('webrtc')) {
      agentsToConsult.push('patients', 'doctors', 'api');
    }
    
    if (problemLower.includes('map') || problemLower.includes('leaflet')) {
      agentsToConsult.push('web', 'companies');
    }
    
    if (problemLower.includes('import') || problemLower.includes('package')) {
      agentsToConsult.push('packages');
    }
    
    if (agentsToConsult.length === 0) {
      // Consultar todos si no hay match específico
      agentsToConsult.push(...Array.from(this.systems.keys()));
    }
    
    // Consultar agentes seleccionados
    agentsToConsult.forEach(key => {
      const system = this.systems.get(key);
      if (system && system.agent.troubleshoot) {
        logger.info(`\n💡 Sugerencias de ${system.name}:`);
        system.agent.troubleshoot(problem);
      }
    });
  }

  /**
   * Generar ejemplo de código
   */
  generateExample(context: string, type: string): string {
    const [app, exampleType] = type.includes('/') 
      ? type.split('/') 
      : [context, type];
    
    const system = this.systems.get(app);
    if (!system || !system.agent.generateExample) {
      return `❌ No se puede generar ejemplo para ${app}/${exampleType}`;
    }
    
    return system.agent.generateExample(exampleType);
  }

  /**
   * Comando de desarrollo rápido
   */
  dev(app?: string): void {
    if (!app) {
      logger.info('\n🚀 Comandos de desarrollo:\n');
      logger.info('pnpm dev:min     # web + patients + api + doctors');
      logger.info('pnpm dev:medical # patients + doctors + api');
      logger.info('pnpm dev:all     # Todos los servicios\n');
      
      logger.info('Por aplicación:');
      this.systems.forEach((system, key) => {
        if (system.port) {
          logger.info(`pnpm --filter ${key} dev    # Puerto ${system.port}`);
        }
      });
      return;
    }
    
    const system = this.systems.get(app);
    if (!system) {
      logger.info(`❌ App '${app}' no encontrada.`);
      return;
    }
    
    logger.info(`\n🚀 Para iniciar ${app}:`);
    logger.info(`   pnpm --filter ${app} dev`);
    if (system.port) {
      logger.info(`   Se abrirá en: http://localhost:${system.port}`);
    }
  }

  /**
   * Ayuda general
   */
  help(query?: string): void {
    if (!query) {
      logger.info('\n🤖 UNIFIED MCP - Sistema Coordinado de Agentes\n');
      logger.info('Comandos principales:');
      logger.info('  mcp.listSystems()           - Ver todos los sistemas');
      logger.info('  mcp.web.help()              - Ayuda de web-app');
      logger.info('  mcp.patients.help()         - Ayuda de patients');
      logger.info('  mcp.doctors.help()          - Ayuda de doctors');
      logger.info('  mcp.api.help()              - Ayuda de api-server');
      logger.info('  mcp.companies.help()        - Ayuda de companies');
      logger.info('  mcp.packages.help()         - Ayuda de packages\n');
      logger.info('  mcp.findFeature("video")    - Buscar en todos');
      logger.info('  mcp.troubleshoot("error")   - Resolver problemas');
      logger.info('  mcp.dev()                   - Comandos de desarrollo');
      return;
    }
    
    // Delegar a agente específico
    const parts = query.split('.');
    if (parts.length > 0) {
      const agent = this.getAgent(parts[0]);
      if (agent && agent.help) {
        agent.help(parts.slice(1).join('.'));
      }
    }
  }

  // Acceso directo a agentes
  get web() { return webMCP; }
  get patients() { return patientMCP; }
  get doctors() { return doctorMCP; }
  get api() { return apiMCP; }
  get companies() { return companiesMCP; }
  get packages() { return packageExpert; }
}

// Exportar instancia singleton
export const mcp = new UnifiedMCP();

// Auto-registrar en global para desarrollo
if (typeof globalThis !== 'undefined' && process.env.NODE_ENV === 'development') {
  (globalThis as any).mcp = mcp;
  (globalThis as any).MCP = mcp;
  logger.info('🤖 Unified MCP disponible globalmente como: mcp o MCP');
  logger.info('   Usa: mcp.help() para comenzar');
}