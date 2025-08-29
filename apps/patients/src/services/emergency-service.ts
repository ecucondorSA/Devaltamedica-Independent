/**
 * Sistema Unificado de Emergencias
 * Centraliza toda la lógica de emergencias para evitar duplicación
 */

import { EventEmitter } from 'events';

import { logger } from '@altamedica/shared';
export type EmergencyType = 'medical' | 'system' | 'security';
export type EmergencySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Emergency {
  id: string;
  type: EmergencyType;
  severity: EmergencySeverity;
  message: string;
  timestamp: string;
  location?: string;
  patientId?: string;
  actions?: EmergencyAction[];
  autoHide?: boolean;
  autoHideDelay?: number;
}

export interface EmergencyAction {
  id: string;
  label: string;
  action: string;
  type?: 'primary' | 'secondary' | 'danger';
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  priority: number;
}

class EmergencyService extends EventEmitter {
  private static instance: EmergencyService;
  private activeEmergencies: Map<string, Emergency> = new Map();
  private emergencyHistory: Emergency[] = [];
  private ws: WebSocket | null = null;

  private constructor() {
    super();
    this.initializeWebSocket();
  }

  public static getInstance(): EmergencyService {
    if (!EmergencyService.instance) {
      EmergencyService.instance = new EmergencyService();
    }
    return EmergencyService.instance;
  }

  private initializeWebSocket() {
    if (typeof window === 'undefined') return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
    
    try {
      this.ws = new WebSocket(`${wsUrl}/emergency`);
      
      this.ws.onmessage = (event) => {
        const emergency = JSON.parse(event.data) as Emergency;
        this.handleIncomingEmergency(emergency);
      };

      this.ws.onerror = (error) => {
        logger.error('Emergency WebSocket error:', String(error));
      };

      this.ws.onclose = () => {
        // Intentar reconectar después de 5 segundos
        setTimeout(() => this.initializeWebSocket(), 5000);
      };
    } catch (error) {
      logger.error('Failed to initialize emergency WebSocket:', String(error));
    }
  }

  private handleIncomingEmergency(emergency: Emergency) {
    this.activeEmergencies.set(emergency.id, emergency);
    this.emergencyHistory.push(emergency);
    this.emit('emergency', emergency);

    // Auto-ocultar si está configurado
    if (emergency.autoHide && emergency.autoHideDelay) {
      setTimeout(() => {
        this.dismissEmergency(emergency.id);
      }, emergency.autoHideDelay);
    }
  }

  public triggerEmergency(emergency: Omit<Emergency, 'id' | 'timestamp'>): Emergency {
    const fullEmergency: Emergency = {
      ...emergency,
      id: `emergency-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    this.handleIncomingEmergency(fullEmergency);
    
    // Enviar al servidor si hay conexión
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'emergency.trigger',
        data: fullEmergency
      }));
    }

    return fullEmergency;
  }

  public dismissEmergency(id: string) {
    const emergency = this.activeEmergencies.get(id);
    if (emergency) {
      this.activeEmergencies.delete(id);
      this.emit('emergency-dismissed', emergency);
      
      // Notificar al servidor
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'emergency.dismiss',
          data: { id }
        }));
      }
    }
  }

  public getActiveEmergencies(): Emergency[] {
    return Array.from(this.activeEmergencies.values());
  }

  public getEmergencyHistory(): Emergency[] {
    return [...this.emergencyHistory];
  }

  public async notifyEmergencyContacts(
    patientId: string,
    emergencyId: string,
    contacts: EmergencyContact[]
  ): Promise<boolean[]> {
    const notifications = contacts.map(async (contact) => {
      try {
        const response = await fetch('/api/v1/emergency/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId,
            emergencyId,
            contactId: contact.id,
            message: `Emergencia médica activada para paciente ${patientId}`
          })
        });
        
        return response.ok;
      } catch (error) {
        logger.error(`Failed to notify contact ${contact.id}:`, String(error));
        return false;
      }
    });

    return Promise.all(notifications);
  }

  public executeEmergencyAction(emergencyId: string, actionId: string) {
    const emergency = this.activeEmergencies.get(emergencyId);
    if (!emergency) return;

    const action = emergency.actions?.find(a => a.id === actionId);
    if (!action) return;

    this.emit('emergency-action', { emergency, action });

    // Ejecutar acción según el tipo
    switch (action.action) {
      case 'call-911':
        window.location.href = 'tel:911';
        break;
      case 'notify-doctor':
        this.notifyDoctor(emergency);
        break;
      case 'activate-protocol':
        this.activateEmergencyProtocol(emergency);
        break;
      default:
        logger.info('Unknown emergency action:', action.action);
    }
  }

  private async notifyDoctor(emergency: Emergency) {
    // Implementación para notificar al doctor
    logger.info('Notifying doctor about emergency:', emergency);
  }

  private async activateEmergencyProtocol(emergency: Emergency) {
    // Implementación para activar protocolo de emergencia
    logger.info('Activating emergency protocol:', emergency);
  }

  public dispose() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.removeAllListeners();
    this.activeEmergencies.clear();
  }
}

// Exportar instancia singleton
export const emergencyService = EmergencyService.getInstance();

// Hook de React para usar el servicio
export function useEmergencyService() {
  return emergencyService;
}