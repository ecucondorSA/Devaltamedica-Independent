/**
 * 🏥 ALTA AGENT - Medical Anamnesis Assistant & Package Expert
 * Desarrollado por Dr. Eduardo Marques (Medicina-UBA)
 * 
 * Exports principales del paquete
 */

// Core - Medical AI
export { AltaAgent } from './core/AltaAgent';
export { AltaAgentWithAI } from './core/AltaAgentWithAI';
export type {
  ManusSDK,
  ManusConfig,
  ManusResponse,
  MedicalAnalysis,
  MedicalEntities,
  UrgencyResult,
  ClinicalInsight,
  DiagnosisOption,
  GenSparkSDK,
  GenSparkConfig,
  GeneratedDocument,
  DynamicForm,
  EducationalContent,
  Visualization
} from './core/AltaAgentWithAI';

// Core - Package Expert
export { PackageExpertAgent, packageExpert } from './PackageExpertAgent';
export * from './types';

// Components
export { AltaChat } from './components/AltaChat';
export { AltaAvatar3D } from './components/AltaAvatar3D';

// Types
export type {
  AltaConfig,
  AltaState,
  AltaEmotion,
  AltaConversationContext,
  AltaResponse,
  AltaMessage,
  AltaSymptomAnalysis,
  AltaEvent,
  AltaEventType,
  AltaAttachment,
  AltaAvatarState,
  ValidatedAltaConfig
} from './types/alta.types';

// Constants
export { 
  DEFAULT_ALTA_CONFIG,
  ALTA_PROMPTS,
  AltaConfigSchema
} from './types/alta.types';

// MCP Agents - Model Context Protocol Experts
export { BaseMCP } from './mcp/BaseMCP';
export { WebMCP, webMCP } from './mcp/WebMCP';
export { PatientMCP, patientMCP } from './mcp/PatientMCP';
export { DoctorMCP, doctorMCP } from './mcp/DoctorMCP';
export { APIMCP, apiMCP } from './mcp/APIMCP';
export { CompaniesMCP, companiesMCP } from './mcp/CompaniesMCP';
export { UnifiedMCP, mcp } from './mcp/UnifiedMCP';

// Quick access functions for Package Expert
import { logger } from './logger.js';
import { packageExpert } from './PackageExpertAgent';

export const agent = packageExpert;
export const info = (pkg: string) => packageExpert.getPackageInfo(pkg);
export const recommend = (need: string) => packageExpert.recommendPackages(need);
export const check = (functionality: string) => packageExpert.checkDuplication(functionality);
export const help = (query?: string) => packageExpert.help(query);

// Import MCP for global registration
import { mcp } from './mcp/UnifiedMCP';


// Auto-register en global para desarrollo (solo en dev)
if (typeof globalThis !== 'undefined' && process.env.NODE_ENV === 'development') {
  (globalThis as any).altaAgent = packageExpert;
  (globalThis as any).agent = packageExpert;
  (globalThis as any).mcp = mcp;
  (globalThis as any).MCP = mcp;
  logger.info('🤖 Alta-Agent disponible globalmente:');
  logger.info('   • Package Expert: agent o altaAgent');
  logger.info('   • MCP System: mcp o MCP');
  logger.info('   Usa: mcp.help() para comenzar');
}

// Version
export const VERSION = '1.0.0';
export const AUTHOR = 'Dr. Eduardo Marques';
export const CREDENTIALS = 'Medicina-UBA';