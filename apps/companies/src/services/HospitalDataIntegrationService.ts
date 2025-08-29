/**
 * 🏥 HOSPITAL DATA INTEGRATION SERVICE
 * Sistema multi-canal para recolección de datos hospitalarios en tiempo real
 */

import {
  addDoc,
  collection,
  getFirebaseFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
} from '@altamedica/firebase';
import type { DataSource, SaturationLevel, ValidationResult } from '@altamedica/types';
import { HospitalAPIClient } from './integrations/HospitalAPIService';
import { IoTSensorService } from './integrations/IoTSensorService';
import { WhatsAppClient } from './integrations/WhatsAppService';

import { logger } from '@altamedica/shared/services/logger.service';
export interface IntegrationConfig {
  whatsapp: {
    enabled: boolean;
    phoneNumber: string;
    apiKey: string;
  };
  api: {
    enabled: boolean;
    endpoint: string;
    apiKey: string;
  };
  iot: {
    enabled: boolean;
    devices: string[];
  };
}

export interface HospitalMetrics {
  hospitalId: string;
  timestamp: Date;
  occupancy: {
    beds: {
      total: number;
      occupied: number;
      available: number;
      percentage: number;
    };
    emergency: {
      waiting: number;
      averageWaitTime: number; // minutos
      critical: number;
    };
    specialties: Array<{
      name: string;
      doctors: number;
      patients: number;
      saturation: number; // 0-100%
    }>;
  };
  staff: {
    total: number;
    active: number;
    bySpecialty: Map<string, number>;
  };
  dataQuality: {
    source: DataSource;
    confidence: number; // 0-100%
    lastUpdate: Date;
  };
}

export class HospitalDataIntegrationService {
  private whatsappClient: WhatsAppClient;
  private apiClient: HospitalAPIClient;
  private iotService: IoTSensorService;
  private dataCache: Map<string, HospitalMetrics> = new Map();

  constructor(private config: IntegrationConfig) {
    this.whatsappClient = new WhatsAppClient(config.whatsapp);
    this.apiClient = new HospitalAPIClient(config.api);
    this.iotService = new IoTSensorService(config.iot);
  }

  /**
   * 🔄 Recolecta datos de todas las fuentes disponibles
   */
  async collectHospitalData(hospitalId: string): Promise<HospitalMetrics> {
    const sources = await Promise.allSettled([
      this.config.whatsapp.enabled ? this.whatsappClient.getLatestUpdate(hospitalId) : null,
      this.config.api.enabled ? this.apiClient.fetchHospitalStatus(hospitalId) : null,
      this.config.iot.enabled ? this.iotService.getSensorData(hospitalId) : null,
    ]);

    // Procesar y combinar datos
    const validData = sources
      .filter((result) => result.status === 'fulfilled' && result.value)
      .map((result) => (result as PromiseFulfilledResult<any>).value);

    if (validData.length === 0) {
      throw new Error(`No data available for hospital ${hospitalId}`);
    }

    // Merge inteligente de datos con prioridad por confiabilidad
    const mergedData = this.mergeDataSources(validData);

    // Validar y enriquecer
    const validatedData = await this.validateAndEnrich(mergedData);

    // Guardar en cache y Firebase
    await this.persistData(hospitalId, validatedData);

    return validatedData;
  }

  /**
   * 📊 Calcula el nivel de saturación del hospital
   */
  calculateSaturation(metrics: HospitalMetrics): SaturationLevel {
    // Validar que metrics tenga la estructura esperada
    if (
      !metrics ||
      !metrics.occupancy ||
      !metrics.occupancy.beds ||
      !metrics.occupancy.emergency ||
      !metrics.staff
    ) {
      logger.warn('Invalid metrics structure:', metrics);
      return {
        level: 'low',
        score: 0,
        factors: {
          bedOccupancy: 0,
          emergencyWait: 0,
          staffRatio: 0,
          criticalPatients: 0,
        },
        recommendations: ['No hay datos suficientes para calcular saturación'],
      };
    }

    const weights = {
      bedOccupancy: 0.3,
      emergencyWait: 0.25,
      staffRatio: 0.25,
      criticalPatients: 0.2,
    };

    const factors = {
      bedOccupancy: (metrics.occupancy.beds.percentage || 0) / 100,
      emergencyWait: Math.min((metrics.occupancy.emergency.averageWaitTime || 0) / 120, 1), // 2h max
      staffRatio:
        (metrics.occupancy.emergency.waiting || 0) / Math.max(metrics.staff.active || 1, 1),
      criticalPatients:
        (metrics.occupancy.emergency.critical || 0) /
        Math.max(metrics.occupancy.emergency.waiting || 1, 1),
    };

    const score = Object.entries(factors).reduce((total, [key, value]) => {
      return total + value * weights[key as keyof typeof weights];
    }, 0);

    return {
      level: score > 0.8 ? 'critical' : score > 0.6 ? 'high' : score > 0.4 ? 'medium' : 'low',
      score: Math.round(score * 100),
      factors,
      recommendations: this.generateRecommendations(score, factors),
    };
  }

  /**
   * 🔄 Monitoreo en tiempo real
   */
  async startRealTimeMonitoring(hospitalId: string, callback: (data: HospitalMetrics) => void) {
    // Firebase listener
    const db = getFirebaseFirestore();
    const metricsRef = collection(db, 'hospitals', hospitalId, 'metrics');
    const q = query(metricsRef, orderBy('timestamp', 'desc'), limit(1));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data() as HospitalMetrics;
        callback(data);
      }
    });

    // WhatsApp webhook listener
    if (this.config.whatsapp.enabled) {
      this.whatsappClient.onMessage(hospitalId, async (message) => {
        const data = await this.processWhatsAppMessage(message);
        if (data) {
          callback(data);
        }
      });
    }

    // IoT real-time stream
    if (this.config.iot.enabled) {
      this.iotService.streamSensorData(hospitalId, async (sensorData) => {
        const metrics = await this.processSensorData(sensorData);
        callback(metrics);
      });
    }

    return unsubscribe;
  }

  /**
   * 🤖 Procesamiento inteligente de mensajes WhatsApp
   */
  private async processWhatsAppMessage(message: any): Promise<HospitalMetrics | null> {
    // Análisis de lenguaje natural
    const patterns = {
      beds: /camas?\s*[:=]?\s*(\d+)\s*\/\s*(\d+)/i,
      waiting: /esperando\s*[:=]?\s*(\d+)/i,
      doctors: /m[eé]dicos?\s*[:=]?\s*(\d+)/i,
      emergency: /urgencia\s*[:=]?\s*(\d+)/i,
    };

    const extracted: any = {};

    for (const [key, pattern] of Object.entries(patterns)) {
      const match = message.text.match(pattern);
      if (match) {
        extracted[key] = match.slice(1).map(Number);
      }
    }

    // Si tiene imagen, procesar con AI
    if (message.image) {
      const aiAnalysis = await this.analyzeWaitingRoomImage(message.image);
      extracted.estimatedWaiting = aiAnalysis.peopleCount;
    }

    return this.buildMetricsFromExtracted(message.hospitalId, extracted);
  }

  /**
   * 🔀 Merge inteligente de múltiples fuentes
   */
  private mergeDataSources(sources: any[]): HospitalMetrics {
    // Prioridad: API > IoT > WhatsApp
    const priorities = { api: 3, iot: 2, whatsapp: 1 };

    // Filtrar fuentes válidas
    const validSources = sources.filter((s) => s && s.hospitalId);

    if (validSources.length === 0) {
      // Retornar datos por defecto si no hay fuentes válidas
      return this.getDefaultMetrics('unknown');
    }

    validSources.sort((a, b) => {
      const priorityA = priorities[a.source as keyof typeof priorities] || 0;
      const priorityB = priorities[b.source as keyof typeof priorities] || 0;
      return priorityB - priorityA;
    });

    // Tomar el más confiable como base
    const baseData = validSources[0];

    // Enriquecer con datos de otras fuentes
    for (let i = 1; i < validSources.length; i++) {
      const source = validSources[i];
      // Merge logic aquí - llenar gaps con datos secundarios
      this.fillDataGaps(baseData, source);
    }

    return baseData;
  }

  /**
   * ✅ Validación y enriquecimiento de datos
   */
  private async validateAndEnrich(data: HospitalMetrics): Promise<HospitalMetrics> {
    const validation = this.validateDataIntegrity(data);

    if (!validation.isValid) {
      logger.warn(`Data validation issues: ${validation.errors.join(', ')}`);
      // Intentar corregir automáticamente
      data = this.autoCorrectData(data, validation);
    }

    // Enriquecer con datos históricos
    const historical = await this.getHistoricalAverages(data.hospitalId);
    data.dataQuality.confidence = this.calculateConfidence(data, historical);

    return data;
  }

  /**
   * 💾 Persistencia multi-nivel
   */
  private async persistData(hospitalId: string, data: HospitalMetrics): Promise<void> {
    // Cache inmediato
    this.dataCache.set(hospitalId, data);

    // Firebase para real-time
    const db = getFirebaseFirestore();
    const metricsRef = collection(db, 'hospitals', hospitalId, 'metrics');
    await addDoc(metricsRef, {
      ...data,
      timestamp: new Date(),
    });

    // PostgreSQL para históricos (mediante API)
    await this.apiClient.saveHistoricalData(hospitalId, data);

    // Redis para acceso rápido
    await this.cacheInRedis(hospitalId, data);
  }

  /**
   * 🎯 Generación de recomendaciones inteligentes
   */
  private generateRecommendations(score: number, factors: any): string[] {
    const recommendations: string[] = [];

    if (factors.bedOccupancy > 0.9) {
      recommendations.push('🏥 Considerar redistribución de pacientes no críticos');
    }

    if (factors.emergencyWait > 0.7) {
      recommendations.push('⚡ Activar protocolo de respuesta rápida');
      recommendations.push('👨‍⚕️ Solicitar médicos de guardia adicionales');
    }

    if (factors.staffRatio > 0.8) {
      recommendations.push('💼 Contratar personal temporal urgente');
      recommendations.push('🔄 Redistribuir personal entre departamentos');
    }

    if (score > 0.85) {
      recommendations.push('🚨 ALERTA: Activar plan de contingencia completo');
    }

    return recommendations;
  }

  // Métodos auxiliares
  private validateDataIntegrity(data: HospitalMetrics): ValidationResult {
    const errors: string[] = [];

    if (data.occupancy.beds.occupied > data.occupancy.beds.total) {
      errors.push('Bed occupancy exceeds total beds');
    }

    if (data.occupancy.emergency.averageWaitTime < 0) {
      errors.push('Invalid wait time');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private calculateConfidence(current: HospitalMetrics, historical: any): number {
    // Lógica para calcular confianza basada en desviación histórica
    return 85; // placeholder
  }

  private async analyzeWaitingRoomImage(imageUrl: string): Promise<any> {
    // Integración con servicio de AI para análisis de imágenes
    return { peopleCount: 15 }; // placeholder
  }

  private fillDataGaps(base: any, secondary: any): void {
    // Lógica para llenar datos faltantes
  }

  private autoCorrectData(data: HospitalMetrics, validation: ValidationResult): HospitalMetrics {
    // Correcciones automáticas basadas en reglas
    return data;
  }

  private async getHistoricalAverages(hospitalId: string): Promise<any> {
    // Obtener promedios históricos
    return {};
  }

  private async cacheInRedis(hospitalId: string, data: HospitalMetrics): Promise<void> {
    // Implementar caché Redis
  }

  private buildMetricsFromExtracted(hospitalId: string, extracted: any): HospitalMetrics {
    // Construir objeto metrics desde datos extraídos
    return this.getDefaultMetrics(hospitalId);
  }

  private getDefaultMetrics(hospitalId: string): HospitalMetrics {
    return {
      hospitalId,
      timestamp: new Date(),
      occupancy: {
        beds: {
          total: 100,
          occupied: 0,
          available: 100,
          percentage: 0,
        },
        emergency: {
          waiting: 0,
          averageWaitTime: 0,
          critical: 0,
        },
        specialties: [],
      },
      staff: {
        total: 50,
        active: 40,
        bySpecialty: new Map(),
      },
      dataQuality: {
        source: 'default' as any,
        confidence: 0,
        lastUpdate: new Date(),
      },
    };
  }

  /**
   * 🛰️ Procesa datos crudos provenientes de sensores IoT y genera métricas parciales
   * Implementación mínima para satisfacer dependencias; puede enriquecerse posteriormente.
   */
  private async processSensorData(sensorData: any): Promise<HospitalMetrics> {
    // Si existe cache previa la usamos como base para mantener consistencia
    const base =
      this.dataCache.get(sensorData?.hospitalId) ||
      this.getDefaultMetrics(sensorData?.hospitalId || 'unknown');

    // Ejemplo de mapeo simple (placeholder seguro)
    if (sensorData && typeof sensorData === 'object') {
      if (typeof sensorData.bedsOccupied === 'number' && typeof sensorData.bedsTotal === 'number') {
        base.occupancy.beds.total = sensorData.bedsTotal;
        base.occupancy.beds.occupied = Math.min(sensorData.bedsOccupied, sensorData.bedsTotal);
        base.occupancy.beds.available = Math.max(
          base.occupancy.beds.total - base.occupancy.beds.occupied,
          0,
        );
        base.occupancy.beds.percentage =
          base.occupancy.beds.total > 0
            ? Math.round((base.occupancy.beds.occupied / base.occupancy.beds.total) * 100)
            : 0;
      }
      if (typeof sensorData.waiting === 'number') {
        base.occupancy.emergency.waiting = sensorData.waiting;
      }
      if (typeof sensorData.critical === 'number') {
        base.occupancy.emergency.critical = sensorData.critical;
      }
      if (typeof sensorData.averageWaitTime === 'number') {
        base.occupancy.emergency.averageWaitTime = sensorData.averageWaitTime;
      }
    }

    base.dataQuality.lastUpdate = new Date();
    base.dataQuality.source = 'iot' as any;
    return base;
  }
}
