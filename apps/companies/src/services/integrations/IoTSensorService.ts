/**
 * 📡 IoTSensorService (Stub)
 * Proporciona datos simulados de sensores IoT.
 */

export interface IoTConfig {
  devices: string[];
  enabled?: boolean;
}

export class IoTSensorService {
  constructor(private config: IoTConfig) {}

  async getSensorData(hospitalId: string): Promise<any> {
    return {
      hospitalId,
      source: 'iot',
      bedsTotal: 100,
      bedsOccupied: 32,
      waiting: 6,
      critical: 2,
      averageWaitTime: 25,
    };
  }

  streamSensorData(hospitalId: string, callback: (data: any) => void): () => void {
    // Stub: no inicia stream real; retorna función de cancelación
    void hospitalId;
    void callback; // evitar warnings
    return () => {};
  }
}
/**
 * 🔌 IoT SENSOR INTEGRATION SERVICE
 * Integración con sensores IoT para monitoreo automático
 */

import { EventEmitter } from 'events';
import type { HospitalMetrics } from '../HospitalDataIntegrationService';

import { logger } from '@altamedica/shared/services/logger.service';
// Mock interfaces para compatibilidad con Next.js
interface MqttClient {
  on: (event: string, callback: (...args: any[]) => void) => void;
  subscribe: (topics: string[], callback?: (err?: Error) => void) => void;
  connect: (options?: any) => this;
}

interface BleManagerMock {
  initialize: () => Promise<void>;
  requestLEScan: (options: any, callback: (result: any) => void) => Promise<void>;
  stopLEScan: () => Promise<void>;
}

export interface SensorData {
  deviceId: string;
  type: 'occupancy' | 'movement' | 'environmental' | 'camera';
  location: string;
  timestamp: Date;
  data: {
    [key: string]: any;
  };
}

export interface OccupancyData {
  roomId: string;
  peopleCount: number;
  capacity: number;
  occupancyRate: number;
  movement: 'entering' | 'leaving' | 'static';
}
