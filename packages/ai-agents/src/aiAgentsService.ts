// 🤖 Servicio de Agentes de IA para AltaMedica
// Archivo: packages/ai/src/aiAgentsService.ts

import { logger } from '@altamedica/shared';

export interface AIJobRequest {
  type:
    | 'summarize_medical_record'
    | 'analyze_symptoms'
    | 'generate_prescription'
    | 'analyze_lab_results'
    | 'generate_treatment_plan'
    | 'medical_risk_assessment'
    | 'drug_interaction_check'
    | 'diagnostic_assistance';
  patientId: string;
  context: Record<string, any>;
}

export interface AIJob {
  id: string;
  type: string;
  patientId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  context: Record<string, any>;
  result?: any;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

class AIAgentsService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3002/api/ai') {
    this.baseUrl = baseUrl;
  }

  /**
   * 🚀 Crear un nuevo job de IA
   */
  async createJob(jobRequest: AIJobRequest): Promise<AIJob> {
    const response = await fetch(`${this.baseUrl}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jobRequest),
    });

    if (!response.ok) {
      throw new Error(`Error creating AI job: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * 📊 Obtener estado de un job
   */
  async getJobStatus(jobId: string): Promise<AIJob> {
    const response = await fetch(`${this.baseUrl}/jobs/${jobId}`);

    if (!response.ok) {
      throw new Error(`Error fetching job status: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * 📋 Listar jobs de un paciente
   */
  async getPatientJobs(patientId: string, status?: string): Promise<AIJob[]> {
    const params = new URLSearchParams({ patientId });
    if (status) params.append('status', status);

    const response = await fetch(`${this.baseUrl}/jobs?${params}`);

    if (!response.ok) {
      throw new Error(`Error fetching jobs: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * ⏳ Esperar a que un job se complete
   */
  async waitForCompletion(jobId: string, timeoutMs: number = 300000): Promise<AIJob> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const job = await this.getJobStatus(jobId);

      if (job.status === 'completed') {
        return job;
      }

      if (job.status === 'failed') {
        throw new Error(`Job failed: ${job.error}`);
      }

      // Esperar 2 segundos antes de verificar nuevamente
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    throw new Error(`Job timeout after ${timeoutMs}ms`);
  }

  /**
   * 🏥 Analizar historial médico completo
   */
  async analyzeMedicalRecord(
    patientId: string,
    medicalData: {
      symptoms?: string[];
      medicalHistory?: string[];
      medications?: string[];
      labResults?: any[];
      priority?: 'low' | 'medium' | 'high';
    },
  ) {
    return this.createJob({
      type: 'summarize_medical_record',
      patientId,
      context: medicalData,
    });
  }

  /**
   * 🔍 Analizar síntomas para diagnóstico
   */
  async analyzeSymptoms(patientId: string, symptoms: string[], additionalInfo?: any) {
    return this.createJob({
      type: 'analyze_symptoms',
      patientId,
      context: { symptoms, additionalInfo },
    });
  }

  /**
   * 💊 Generar recomendaciones de prescripción
   */
  async generatePrescription(patientId: string, diagnosis: string, patientInfo: any) {
    return this.createJob({
      type: 'generate_prescription',
      patientId,
      context: { diagnosis, patientInfo },
    });
  }

  /**
   * 🧪 Analizar resultados de laboratorio
   */
  async analyzeLabResults(patientId: string, labResults: any[]) {
    return this.createJob({
      type: 'analyze_lab_results',
      patientId,
      context: { labResults },
    });
  }

  /**
   * ⚠️ Evaluar riesgos médicos
   */
  async assessMedicalRisk(patientId: string, riskFactors: any) {
    return this.createJob({
      type: 'medical_risk_assessment',
      patientId,
      context: { riskFactors },
    });
  }

  /**
   * ⚗️ Verificar interacciones medicamentosas
   */
  async checkDrugInteractions(patientId: string, medications: string[]) {
    return this.createJob({
      type: 'drug_interaction_check',
      patientId,
      context: { medications },
    });
  }
  /** Asistencia diagnóstica remota */
  async diagnosticAssistance(patientId: string, context: any) {
    return this.createJob({
      type: 'diagnostic_assistance',
      patientId,
      context,
    });
  }
}

// Singleton instance
export const aiAgents = new AIAgentsService();

// Funciones de conveniencia para casos comunes
export const MedicalAI = {
  /**
   * 🩺 Análisis completo de paciente (múltiples agentes)
   */
  async completePatientAnalysis(
    patientId: string,
    patientData: {
      symptoms: string[];
      medicalHistory: string[];
      medications: string[];
      labResults: any[];
    },
  ) {
    logger.info(`🏥 Iniciando análisis completo para paciente ${patientId}`);

    // Ejecutar múltiples análisis en paralelo
    const jobs = await Promise.all([
      aiAgents.analyzeMedicalRecord(patientId, patientData),
      aiAgents.analyzeSymptoms(patientId, patientData.symptoms),
      aiAgents.analyzeLabResults(patientId, patientData.labResults),
      aiAgents.checkDrugInteractions(patientId, patientData.medications),
    ]);

    logger.info(`🚀 ${jobs.length} análisis iniciados`);
    return jobs;
  },

  /**
   * 🔄 Análisis de urgencia médica
   */
  async emergencyAnalysis(patientId: string, urgentSymptoms: string[]) {
    logger.info(`🚨 Análisis de urgencia para paciente ${patientId}`);

    const job = await aiAgents.analyzeSymptoms(patientId, urgentSymptoms, {
      priority: 'high',
      urgency: true,
      timestamp: new Date().toISOString(),
    });

    // Esperar resultado inmediato para urgencias
    return aiAgents.waitForCompletion(job.id, 60000); // 1 minuto max
  },
  /** Prototipo diagnóstico local */
  async localDiagnosticPrototype(input: { patientId: string; context: any }) {
    try {
      const { DiagnosticEngine } = await import('@altamedica/diagnostic-engine');
      const engine = new DiagnosticEngine();
      const session = engine.startSession({ ...input.context });
      for (let i = 0; i < 3; i++) {
        const q = engine.nextQuestion(session.id);
        if (!q) break;
        engine.submitAnswer(session.id, q.id, { value: i % 2 === 0 });
      }
      return engine.generateReport(session.id);
    } catch (e: any) {
      return { error: 'diagnostic-engine not available', detail: e?.message };
    }
  },
};

export default aiAgents;
