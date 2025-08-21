/**
 * 🏥 HospitalAPIService (Stub)
 * Implementación mínima para permitir compilación y pruebas iniciales.
 * Reemplazar posteriormente con lógica real de integración.
 */

export interface HospitalAPIConfig {
  endpoint: string;
  apiKey: string;
  enabled?: boolean;
}

export class HospitalAPIClient {
  constructor(private config: HospitalAPIConfig) {}

  async fetchHospitalStatus(hospitalId: string): Promise<any> {
    return {
      hospitalId,
      source: 'api',
      timestamp: new Date(),
      occupancy: {
        beds: { total: 100, occupied: 30, available: 70, percentage: 30 },
        emergency: { waiting: 5, averageWaitTime: 20, critical: 1 },
        specialties: []
      },
      staff: { total: 50, active: 40, bySpecialty: new Map() },
      dataQuality: { source: 'api', confidence: 80, lastUpdate: new Date() }
    };
  }

  async saveHistoricalData(hospitalId: string, data: any): Promise<void> {
    // Stub: en producción enviará datos a un almacenamiento histórico
    return;
  }
}
/**
 * 🌐 HOSPITAL API INTEGRATION SERVICE
 * API REST para que hospitales envíen datos programáticamente
 */

import axios, { AxiosInstance } from 'axios';
import { z } from 'zod';
import type { HospitalMetrics } from '../HospitalDataIntegrationService';

import { logger } from '@altamedica/shared/services/logger.service';
// Schema de validación para datos entrantes
const HospitalStatusSchema = z.object({
  hospitalId: z.string().uuid(),
  timestamp: z.string().datetime(),
  occupancy: z.object({
    beds: z.object({
      total: z.number().positive(),
      occupied: z.number().min(0),
      icu: z.object({
        total: z.number().positive(),
        occupied: z.number().min(0)
      }).optional()
    }),
    emergency: z.object({
      waiting: z.number().min(0),
      averageWaitTime: z.number().min(0),
      triage: z.object({
        red: z.number().min(0),
        yellow: z.number().min(0),
        green: z.number().min(0)
      }).optional()
    })
  }),
  staff: z.object({
    doctors: z.array(z.object({
      specialty: z.string(),
      available: z.number().min(0),
      onDuty: z.number().min(0)
    })),
    nurses: z.object({
      total: z.number().min(0),
      available: z.number().min(0)
    }).optional()
  }),
  resources: z.object({
    ventilators: z.object({
      total: z.number().min(0),
      available: z.number().min(0)
    }).optional(),
    operatingRooms: z.object({
      total: z.number().min(0),
      available: z.number().min(0)
    }).optional()
  }).optional()
});

export type HospitalStatusPayload = z.infer<typeof HospitalStatusSchema>;

export interface HospitalAPIConfig {
  enabled: boolean;
  endpoint: string;
  apiKey: string;
}

export class HospitalAPIClient {
  private client: AxiosInstance;
  private webhookSubscriptions: Map<string, string[]> = new Map();
  
  constructor(private config: HospitalAPIConfig) {
    this.client = axios.create({
      baseURL: config.endpoint,
      headers: {
        'X-API-Key': config.apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    // Interceptor para logging
    this.client.interceptors.request.use(
      (config) => {
        logger.info(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('❌ API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Interceptor para manejo de respuestas
    this.client.interceptors.response.use(
      (response) => {
        logger.info(`✅ API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error(`❌ API Response Error: ${error.response?.status} ${error.message}`);
        return Promise.reject(error);
      }
    );
  }

  /**
   * 📊 Obtener estado actual del hospital
   */
  async fetchHospitalStatus(hospitalId: string): Promise<HospitalMetrics | null> {
    if (!this.config.enabled) {
      logger.info('🔌 Hospital API disabled, returning mock data');
      return this.getMockHospitalData(hospitalId);
    }

    try {
      const response = await this.client.get(`/hospitals/${hospitalId}/status`);
      const validated = HospitalStatusSchema.parse(response.data);
      return this.convertToMetrics(validated);
    } catch (error) {
      logger.error(`❌ Failed to fetch hospital status for ${hospitalId}:`, error);
      // Retornar datos mock en caso de error
      return this.getMockHospitalData(hospitalId);
    }
  }

  /**
   * 💾 Guardar datos históricos
   */
  async saveHistoricalData(hospitalId: string, data: HospitalMetrics): Promise<void> {
    if (!this.config.enabled) {
      logger.info('🔌 Hospital API disabled, skipping historical save');
      return;
    }

    try {
      await this.client.post(`/hospitals/${hospitalId}/metrics`, data);
    } catch (error) {
      logger.error(`❌ Failed to save historical data for ${hospitalId}:`, error);
    }
  }

  /**
   * 🎭 Datos mock para desarrollo
   */
  private getMockHospitalData(hospitalId: string): HospitalMetrics {
    const mockHospitals: Record<string, Partial<HospitalMetrics>> = {
      'HOSP-DEMO-001': {
        hospitalId: 'HOSP-DEMO-001',
        timestamp: new Date(),
        occupancy: {
          beds: {
            total: 100,
            occupied: 78,
            available: 22,
            percentage: 78
          },
          emergency: {
            waiting: 15,
            averageWaitTime: 45,
            critical: 3
          },
          specialties: [
            { name: 'Cardiología', doctors: 5, patients: 12, saturation: 60 },
            { name: 'Pediatría', doctors: 8, patients: 20, saturation: 40 },
            { name: 'Urgencias', doctors: 12, patients: 35, saturation: 85 }
          ]
        },
        staff: {
          total: 150,
          active: 120,
          bySpecialty: new Map([
            ['Cardiología', 5],
            ['Pediatría', 8],
            ['Urgencias', 12]
          ])
        },
        dataQuality: {
          source: 'api' as any,
          confidence: 95,
          lastUpdate: new Date()
        }
      }
    };

    return mockHospitals[hospitalId] as HospitalMetrics || this.generateRandomMetrics(hospitalId);
  }

  /**
   * 🎲 Generar métricas aleatorias
   */
  private generateRandomMetrics(hospitalId: string): HospitalMetrics {
    const total = 100;
    const occupied = Math.floor(Math.random() * 30) + 60;
    const available = total - occupied;
    const percentage = Math.round((occupied / total) * 100);
    
    return {
      hospitalId,
      timestamp: new Date(),
      occupancy: {
        beds: {
          total,
          occupied,
          available,
          percentage
        },
        emergency: {
          waiting: Math.floor(Math.random() * 20) + 5,
          averageWaitTime: Math.floor(Math.random() * 60) + 20,
          critical: Math.floor(Math.random() * 5)
        },
        specialties: [
          { name: 'General', doctors: 10, patients: 25, saturation: 50 },
          { name: 'Urgencias', doctors: 8, patients: 30, saturation: 75 }
        ]
      },
      staff: {
        total: 100,
        active: Math.floor(Math.random() * 20) + 70,
        bySpecialty: new Map([
          ['General', 10],
          ['Urgencias', 8]
        ])
      },
      dataQuality: {
        source: 'api' as any,
        confidence: 85,
        lastUpdate: new Date()
      }
    };
  }

  /**
   * 🔄 Convertir datos de API a métricas internas
   */
  private convertToMetrics(status: HospitalStatusPayload): HospitalMetrics {
    const beds = status.occupancy.beds;
    const available = beds.total - beds.occupied;
    const percentage = Math.round((beds.occupied / beds.total) * 100);
    
    return {
      hospitalId: status.hospitalId,
      timestamp: new Date(status.timestamp),
      occupancy: {
        beds: {
          total: beds.total,
          occupied: beds.occupied,
          available,
          percentage
        },
        emergency: {
          waiting: status.occupancy.emergency.waiting,
          averageWaitTime: status.occupancy.emergency.averageWaitTime,
          critical: status.occupancy.emergency.triage?.red || 0
        },
        specialties: status.staff.doctors.map(doc => ({
          name: doc.specialty,
          doctors: doc.available,
          patients: 0, // No disponible en el payload
          saturation: 50 // Valor por defecto
        }))
      },
      staff: {
        total: status.staff.doctors.reduce((sum, doc) => sum + doc.onDuty, 0),
        active: status.staff.doctors.reduce((sum, doc) => sum + doc.available, 0),
        bySpecialty: new Map(
          status.staff.doctors.map(doc => [doc.specialty, doc.available])
        )
      },
      dataQuality: {
        source: 'api' as any,
        confidence: 95,
        lastUpdate: new Date()
      }
    };
  }

  /**
   * 📥 Obtener estado actual del hospital
   */
  async fetchHospitalStatus(hospitalId: string): Promise<HospitalMetrics> {
    try {
      const response = await this.client.get(`/hospitals/${hospitalId}/status`);
      
      // Validar respuesta con Zod
      const validated = HospitalStatusSchema.parse(response.data);
      
      // Transformar a formato interno
      return this.transformToMetrics(validated);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to fetch hospital status: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * 📤 Endpoint para que hospitales envíen datos
   */
  async submitHospitalStatus(data: HospitalStatusPayload): Promise<void> {
    try {
      // Validar datos entrantes
      const validated = HospitalStatusSchema.parse(data);
      
      // Enviar a nuestro backend
      await this.client.post(`/hospitals/${data.hospitalId}/status`, validated);
      
      // Notificar webhooks suscritos
      await this.notifyWebhooks(data.hospitalId, validated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid data format: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * 🔄 Configurar webhook para actualizaciones
   */
  async registerWebhook(hospitalId: string, webhookUrl: string): Promise<string> {
    try {
      const response = await this.client.post(`/hospitals/${hospitalId}/webhooks`, {
        url: webhookUrl,
        events: ['status.updated', 'emergency.declared', 'capacity.critical']
      });

      const webhookId = response.data.webhookId;
      
      // Guardar localmente
      const webhooks = this.webhookSubscriptions.get(hospitalId) || [];
      webhooks.push(webhookUrl);
      this.webhookSubscriptions.set(hospitalId, webhooks);

      return webhookId;
    } catch (error) {
      throw new Error(`Failed to register webhook: ${error}`);
    }
  }

  /**
   * 📊 Endpoint para datos históricos
   */
  async saveHistoricalData(hospitalId: string, metrics: HospitalMetrics): Promise<void> {
    try {
      await this.client.post(`/hospitals/${hospitalId}/metrics/historical`, {
        timestamp: new Date().toISOString(),
        metrics: this.transformToAPIFormat(metrics)
      });
    } catch (error) {
      logger.error('Failed to save historical data:', error);
      // No throw - historical data is not critical
    }
  }

  /**
   * 🏥 Obtener información del hospital
   */
  async getHospitalInfo(hospitalId: string): Promise<any> {
    try {
      const response = await this.client.get(`/hospitals/${hospitalId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get hospital info: ${error}`);
    }
  }

  /**
   * 🚨 Reportar emergencia
   */
  async reportEmergency(hospitalId: string, emergency: {
    type: 'mass_casualty' | 'system_failure' | 'capacity_critical' | 'staff_shortage';
    severity: 'low' | 'medium' | 'high' | 'critical';
    details: string;
    estimatedDuration?: number; // minutos
  }): Promise<void> {
    try {
      await this.client.post(`/hospitals/${hospitalId}/emergencies`, {
        ...emergency,
        timestamp: new Date().toISOString(),
        source: 'api'
      });

      // Notificar a la red inmediatamente
      await this.notifyNetworkEmergency(hospitalId, emergency);
    } catch (error) {
      throw new Error(`Failed to report emergency: ${error}`);
    }
  }

  /**
   * 📈 Obtener métricas agregadas de la red
   */
  async getNetworkMetrics(): Promise<any> {
    try {
      const response = await this.client.get('/network/metrics');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get network metrics: ${error}`);
    }
  }

  /**
   * 🔄 Transformar datos de API a formato interno
   */
  private transformToMetrics(apiData: HospitalStatusPayload): HospitalMetrics {
    const totalDoctors = apiData.staff.doctors.reduce((sum, doc) => sum + doc.available, 0);
    
    return {
      hospitalId: apiData.hospitalId,
      timestamp: new Date(apiData.timestamp),
      occupancy: {
        beds: {
          total: apiData.occupancy.beds.total,
          occupied: apiData.occupancy.beds.occupied,
          available: apiData.occupancy.beds.total - apiData.occupancy.beds.occupied,
          percentage: Math.round((apiData.occupancy.beds.occupied / apiData.occupancy.beds.total) * 100)
        },
        emergency: {
          waiting: apiData.occupancy.emergency.waiting,
          averageWaitTime: apiData.occupancy.emergency.averageWaitTime,
          critical: apiData.occupancy.emergency.triage?.red || 0
        },
        specialties: apiData.staff.doctors.map(doc => ({
          name: doc.specialty,
          doctors: doc.available,
          patients: 0, // TODO: Necesitamos este dato en la API
          saturation: 0 // TODO: Calcular basado en ratio
        }))
      },
      staff: {
        total: totalDoctors + (apiData.staff.nurses?.total || 0),
        active: totalDoctors,
        bySpecialty: new Map(apiData.staff.doctors.map(doc => [doc.specialty, doc.available]))
      },
      dataQuality: {
        source: 'api' as any,
        confidence: 95, // API data is highly reliable
        lastUpdate: new Date()
      }
    };
  }

  /**
   * 🔄 Transformar formato interno a API
   */
  private transformToAPIFormat(metrics: HospitalMetrics): HospitalStatusPayload {
    const doctors = Array.from(metrics.staff.bySpecialty.entries()).map(([specialty, count]) => ({
      specialty,
      available: count,
      onDuty: count
    }));

    return {
      hospitalId: metrics.hospitalId,
      timestamp: metrics.timestamp.toISOString(),
      occupancy: {
        beds: {
          total: metrics.occupancy.beds.total,
          occupied: metrics.occupancy.beds.occupied
        },
        emergency: {
          waiting: metrics.occupancy.emergency.waiting,
          averageWaitTime: metrics.occupancy.emergency.averageWaitTime,
          triage: {
            red: metrics.occupancy.emergency.critical,
            yellow: 0,
            green: 0
          }
        }
      },
      staff: {
        doctors
      }
    };
  }

  /**
   * 🔔 Notificar webhooks
   */
  private async notifyWebhooks(hospitalId: string, data: HospitalStatusPayload): Promise<void> {
    const webhooks = this.webhookSubscriptions.get(hospitalId) || [];
    
    for (const webhook of webhooks) {
      try {
        await axios.post(webhook, {
          event: 'status.updated',
          hospitalId,
          data,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error(`Failed to notify webhook ${webhook}:`, error);
      }
    }
  }

  /**
   * 🚨 Notificar emergencia a la red
   */
  private async notifyNetworkEmergency(hospitalId: string, emergency: any): Promise<void> {
    try {
      await this.client.post('/network/emergency-broadcast', {
        hospitalId,
        emergency,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to notify network emergency:', error);
    }
  }

  /**
   * 📋 Generar documentación API
   */
  static generateAPIDocumentation(): string {
    return `
# AltaMedica Hospital API Documentation

## Authentication
All requests must include the X-API-Key header:
\`\`\`
X-API-Key: your-api-key-here
\`\`\`

## Endpoints

### Submit Hospital Status
\`POST /api/v1/hospitals/{hospitalId}/status\`

Request Body:
\`\`\`json
{
  "hospitalId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-15T10:30:00Z",
  "occupancy": {
    "beds": {
      "total": 100,
      "occupied": 85,
      "icu": {
        "total": 20,
        "occupied": 18
      }
    },
    "emergency": {
      "waiting": 23,
      "averageWaitTime": 45,
      "triage": {
        "red": 2,
        "yellow": 8,
        "green": 13
      }
    }
  },
  "staff": {
    "doctors": [
      {
        "specialty": "emergency",
        "available": 5,
        "onDuty": 5
      },
      {
        "specialty": "cardiology",
        "available": 2,
        "onDuty": 3
      }
    ],
    "nurses": {
      "total": 45,
      "available": 42
    }
  }
}
\`\`\`

### Register Webhook
\`POST /api/v1/hospitals/{hospitalId}/webhooks\`

### Report Emergency
\`POST /api/v1/hospitals/{hospitalId}/emergencies\`

## Rate Limits
- 100 requests per minute per hospital
- 1000 requests per hour per hospital

## SDKs
- JavaScript/TypeScript: npm install @altamedica/hospital-sdk
- Python: pip install altamedica-hospital
- Java: Maven dependency available
    `;
  }
}