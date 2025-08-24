/**
 * 💬 WhatsAppService (Stub)
 * Simula recepción de mensajes estructurados.
 */

export interface WhatsAppConfig {
  phoneNumber: string;
  apiKey: string;
  enabled?: boolean;
}

type MessageHandler = (message: any) => void | Promise<void>;

export class WhatsAppClient {
  private listeners: Map<string, MessageHandler[]> = new Map();

  constructor(private config: WhatsAppConfig) {}

  async getLatestUpdate(hospitalId: string): Promise<any> {
    return {
      hospitalId,
      source: 'whatsapp',
      text: 'camas 30/100 esperando 5 urgencia 2',
      timestamp: new Date(),
    };
  }

  onMessage(hospitalId: string, handler: MessageHandler): void {
    const arr = this.listeners.get(hospitalId) || [];
    arr.push(handler);
    this.listeners.set(hospitalId, arr);
  }

  // Método auxiliar para pruebas manuales
  async simulateIncomingMessage(hospitalId: string, text: string) {
    const handlers = this.listeners.get(hospitalId) || [];
    const message = { hospitalId, source: 'whatsapp', text, timestamp: new Date() };
    for (const h of handlers) {
      await h(message);
    }
  }
}
/**
 * 📱 WHATSAPP BUSINESS INTEGRATION SERVICE
 * Integración con WhatsApp Business API para reporte rápido de datos hospitalarios
 */

import type { HospitalMetrics } from '../HospitalDataIntegrationService';

import { logger } from '@altamedica/shared/services/logger.service';
// Mock interfaces para compatibilidad con Next.js
interface MockClient {
  on: (event: string, callback: (...args: any[]) => void) => void;
  initialize: () => Promise<void>;
  sendMessage: (chatId: string, message: string) => Promise<void>;
}

interface MockMessage {
  body: string;
  hasMedia: boolean;
  reply: (message: string) => Promise<void>;
  getContact: () => Promise<{ number: string }>;
}

interface MockLocalAuth {
  constructor: (options: { clientId: string }) => MockLocalAuth;
}

export interface WhatsAppMessage {
  from: string;
  hospitalId: string;
  text: string;
  image?: string;
  audio?: string;
  timestamp: Date;
}
