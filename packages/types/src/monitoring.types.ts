/**
 * Monitoring & Hospital Data Integration auxiliary types
 * (Extraídos mínimamente para satisfacer dependencias de HospitalDataIntegrationService)
 */

export type DataSource = 'api' | 'iot' | 'whatsapp' | 'default';

export interface SaturationLevel {
  level: 'low' | 'medium' | 'high' | 'critical';
  score: number; // 0-100
  factors: {
    bedOccupancy: number;
    emergencyWait: number;
    staffRatio: number;
    criticalPatients: number;
    [key: string]: number;
  };
  recommendations: string[];
}

// Renombrado para evitar colisión con ValidationResult del módulo médico
export interface MonitoringValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}
