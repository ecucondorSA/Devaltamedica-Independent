// 🤖 Hook de React para usar agentes de IA
// Archivo: packages/hooks/src/useAIAgents.ts

import { useCallback, useState } from 'react';
import { logger } from '@altamedica/shared/services/logger.service';
// TODO: Import from @altamedica/ai-agents once types are available
// import { aiAgents, AIJob, AIJobRequest } from '@altamedica/ai-agents';

interface AIJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

interface AIJobRequest {
  type: 'analyze' | 'diagnose' | 'predict' | 'summarize_medical_record' | 'analyze_symptoms' | 'generate_treatment_plan';
  data: any;
  [key: string]: any;
}

interface UseAIAgentsReturn {
  // Estado
  isLoading: boolean;
  error: string | null;
  activeJobs: AIJob[];
  
  // Acciones
  createJob: (request: AIJobRequest) => Promise<AIJob>;
  getJobStatus: (jobId: string) => Promise<AIJob>;
  waitForResult: (jobId: string) => Promise<AIJob>;
  clearError: () => void;
  
  // Métodos de conveniencia
  analyzeMedicalRecord: (patientId: string, data: any) => Promise<AIJob>;
  analyzeSymptoms: (patientId: string, symptoms: string[]) => Promise<AIJob>;
  emergencyAnalysis: (patientId: string, symptoms: string[]) => Promise<AIJob>;
}

export function useAIAgents(): UseAIAgentsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeJobs, setActiveJobs] = useState<AIJob[]>([]);

  const handleError = useCallback((err: any) => {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    setError(message);
    logger.error('AI Agents Error:', err);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const addJob = useCallback((job: AIJob) => {
    setActiveJobs(prev => [...prev, job]);
  }, []);

  const updateJob = useCallback((updatedJob: AIJob) => {
    setActiveJobs(prev => 
      prev.map(job => job.id === updatedJob.id ? updatedJob : job)
    );
  }, []);

  const createJob = useCallback(async (request: AIJobRequest): Promise<AIJob> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // TODO: Replace with real aiAgents service
      const job: AIJob = {
        id: `job_${Date.now()}`,
        status: 'pending',
        result: null,
      };
      addJob(job);
      
      return job;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [addJob, handleError]);

  const getJobStatus = useCallback(async (jobId: string): Promise<AIJob> => {
    try {
      // TODO: Replace with real aiAgents service
      const job: AIJob = {
        id: jobId,
        status: 'completed',
        result: null,
      };
      updateJob(job);
      return job;
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [updateJob, handleError]);

  const waitForResult = useCallback(async (jobId: string): Promise<AIJob> => {
    try {
      setIsLoading(true);
      
      // TODO: Replace with real aiAgents service
      const job: AIJob = {
        id: jobId,
        status: 'completed',
        result: null,
      };
      updateJob(job);
      
      return job;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [updateJob, handleError]);

  // Métodos de conveniencia
  const analyzeMedicalRecord = useCallback(async (patientId: string, data: any) => {
    return createJob({
      type: 'summarize_medical_record',
      data: { patientId, context: data }
    });
  }, [createJob]);

  const analyzeSymptoms = useCallback(async (patientId: string, symptoms: string[]) => {
    return createJob({
      type: 'analyze_symptoms',
      data: { patientId, symptoms }
    });
  }, [createJob]);

  const emergencyAnalysis = useCallback(async (patientId: string, symptoms: string[]) => {
    const job = await createJob({
      type: 'analyze_symptoms',
      data: { 
        patientId,
        symptoms, 
        priority: 'high',
        urgency: true 
      }
    });

    // Auto-esperar resultado para emergencias
    return waitForResult(job.id);
  }, [createJob, waitForResult]);

  return {
    isLoading,
    error,
    activeJobs,
    createJob,
    getJobStatus,
    waitForResult,
    clearError,
    analyzeMedicalRecord,
    analyzeSymptoms,
    emergencyAnalysis
  };
}

// Hook especializado para médicos
export function useDoctorAI() {
  const aiAgents = useAIAgents();

  const diagnosePatient = useCallback(async (
    patientId: string, 
    symptoms: string[], 
    medicalHistory: string[]
  ) => {
    // Análisis completo para diagnóstico
    const analysisJob = await aiAgents.analyzeSymptoms(patientId, symptoms);
    const recordJob = await aiAgents.analyzeMedicalRecord(patientId, {
      symptoms,
      medicalHistory,
      timestamp: new Date().toISOString()
    });

    return { analysisJob, recordJob };
  }, [aiAgents]);

  const generateTreatmentPlan = useCallback(async (
    patientId: string,
    diagnosis: string,
    patientInfo: any
  ) => {
    return aiAgents.createJob({
      type: 'generate_treatment_plan',
      data: { patientId, diagnosis, patientInfo }
    });
  }, [aiAgents]);

  return {
    ...aiAgents,
    diagnosePatient,
    generateTreatmentPlan
  };
}

// Hook especializado para pacientes
export function usePatientAI() {
  const aiAgents = useAIAgents();

  const analyzeMySymptoms = useCallback(async (
    patientId: string,
    symptoms: string[],
    description?: string
  ) => {
    return aiAgents.analyzeSymptoms(patientId, symptoms);
  }, [aiAgents]);

  const getMyMedicalSummary = useCallback(async (patientId: string) => {
    return aiAgents.analyzeMedicalRecord(patientId, {
      requestType: 'patient_summary',
      includeRecommendations: true
    });
  }, [aiAgents]);

  return {
    ...aiAgents,
    analyzeMySymptoms,
    getMyMedicalSummary
  };
}
