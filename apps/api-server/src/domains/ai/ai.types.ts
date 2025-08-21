export interface MedicalAIRequest {
  type: 'symptom-analysis' | 'diagnosis-support' | 'drug-interaction' | 'risk-assessment';
  patientId: string;
  doctorId?: string;
  data: {
    symptoms?: string[];
    vitals?: Record<string, number>;
    medicalHistory?: string[];
    currentMedications?: string[];
    labResults?: Record<string, any>;
  };
  context?: {
    urgency?: 'low' | 'medium' | 'high' | 'emergency';
    specialty?: string;
    requestSource?: 'appointment' | 'telemedicine' | 'emergency';
  };
}

export interface MedicalAIResponse {
  id: string;
  type: MedicalAIRequest['type'];
  confidence: number;
  results: {
    primaryFindings: string[];
    recommendations: string[];
    riskFactors: string[];
    suggestedTests?: string[];
    referrals?: string[];
    warnings?: string[];
  };
  metadata: {
    modelVersion: string;
    processingTime: number;
    dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
  };
  createdAt: Date;
}