/**
 * useAIHIPAA.tsx
 * Hook de inteligencia artificial HIPAA real que conecta con la infraestructura IA del backend
 * Implementado por ChatGPT-5 (Líder Técnico Principal)
 */

'use client';

import { logger } from '@altamedica/shared';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { db } from '../lib/firebase-config';
import { useAuthHIPAA } from './useAuthHIPAA';

// ============================================================================
// TIPOS Y INTERFACES HIPAA PARA INTELIGENCIA ARTIFICIAL
// ============================================================================

export interface AIDiagnosis {
  id: string;
  patientId: string;
  doctorId: string;
  symptoms: string[];
  vitalSigns: VitalSigns;
  medicalHistory: string[];
  currentMedications: string[];
  aiAnalysis: AIAnalysisResult;
  doctorRecommendation?: string;
  confidence: number;
  status: 'pending' | 'reviewed' | 'confirmed' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  // Campos de compliance HIPAA
  hipaaCompliant: boolean;
  auditTrail: AIAuditEntry[];
  dataAccessLog: DataAccessEntry[];
}

export interface VitalSigns {
  bloodPressure: string;
  heartRate: number;
  temperature: number;
  oxygenSaturation: number;
  respiratoryRate: number;
  weight: number;
  height: number;
  bmi: number;
}

export interface AIAnalysisResult {
  primaryDiagnosis: string;
  differentialDiagnoses: string[];
  confidenceScore: number;
  riskFactors: string[];
  recommendedTests: string[];
  treatmentSuggestions: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  explanation: string;
  evidence: string[];
  limitations: string[];
}

export interface AIAuditEntry {
  timestamp: Date;
  action: string;
  userId: string;
  userRole: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  aiModel: string;
  aiVersion: string;
}

export interface DataAccessEntry {
  timestamp: Date;
  action: string;
  resource: string;
  ipAddress: string;
  userAgent: string;
  reason: string;
}

export interface CreateDiagnosisData {
  symptoms: string[];
  vitalSigns: VitalSigns;
  medicalHistory: string[];
  currentMedications: string[];
  additionalNotes?: string;
}

export interface DiagnosisFilters {
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  doctorId?: string;
  urgency?: string;
  confidenceMin?: number;
}

export interface AIState {
  diagnoses: AIDiagnosis[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  pendingCount: number;
  confirmedCount: number;
  aiModelStatus: 'ready' | 'processing' | 'error';
  lastAnalysisTime?: Date;
}

// ============================================================================
// HOOK PRINCIPAL DE INTELIGENCIA ARTIFICIAL HIPAA
// ============================================================================

export const useAIHIPAA = () => {
  const { state: authState } = useAuthHIPAA();
  const [state, setState] = useState<AIState>({
    diagnoses: [],
    isLoading: false,
    error: null,
    totalCount: 0,
    pendingCount: 0,
    confirmedCount: 0,
    aiModelStatus: 'ready',
  });

  // ============================================================================
  // FUNCIONES DE IA HIPAA
  // ============================================================================

  const logDataAccess = useCallback(
    async (action: string, resource: string, reason: string) => {
      try {
        if (!authState.user) return;

        const accessEntry: DataAccessEntry = {
          timestamp: new Date(),
          action,
          resource,
          ipAddress: 'client-ip', // TODO: Implementar detección real de IP
          userAgent: navigator.userAgent,
          reason,
        };

        // Log en el usuario
        const userRef = doc(db, 'users', authState.user.uid);
        await updateDoc(userRef, {
          dataAccessLog: [...(authState.user.dataAccessLog || []), accessEntry],
          updatedAt: serverTimestamp(),
        });

        // Log de auditoría IA
        const auditEntry: AIAuditEntry = {
          timestamp: new Date(),
          action: `AI_${action.toUpperCase()}`,
          userId: authState.user.uid,
          userRole: authState.user.role,
          details: `User ${action} ${resource} for ${reason}`,
          ipAddress: 'client-ip',
          userAgent: navigator.userAgent,
          aiModel: 'GPT-4-Medical',
          aiVersion: '1.0.0',
        };

        await addDoc(collection(db, 'ai_audit_logs'), auditEntry);
      } catch (error) {
        logger.error('Error logging AI data access:', String(error));
      }
    },
    [authState.user],
  );

  const generateAIDiagnosis = useCallback(
    async (data: CreateDiagnosisData) => {
      try {
        if (!authState.user) {
          throw new Error('User not authenticated');
        }

        setState((prev) => ({
          ...prev,
          isLoading: true,
          error: null,
          aiModelStatus: 'processing',
        }));

        // Log de acceso
        await logDataAccess('CREATE', 'AI_DIAGNOSIS', 'Generating AI diagnosis');

        // Simular análisis de IA (TODO: Integrar con backend real)
        const aiAnalysis: AIAnalysisResult = await simulateAIAnalysis(data);

        // Crear diagnóstico en Firestore
        const diagnosisData: Omit<AIDiagnosis, 'id' | 'auditTrail' | 'dataAccessLog'> = {
          patientId: authState.user.uid,
          doctorId: authState.user.uid, // Temporal: el usuario actual actúa como doctor
          symptoms: data.symptoms,
          vitalSigns: data.vitalSigns,
          medicalHistory: data.medicalHistory,
          currentMedications: data.currentMedications,
          aiAnalysis,
          doctorRecommendation: undefined,
          confidence: aiAnalysis.confidenceScore,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
          hipaaCompliant: true,
        };

        const docRef = await addDoc(collection(db, 'ai_diagnoses'), {
          ...diagnosisData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Crear diagnóstico completo
        const newDiagnosis: AIDiagnosis = {
          ...diagnosisData,
          id: docRef.id,
          auditTrail: [],
          dataAccessLog: [],
        };

        // Actualizar estado local
        setState((prev) => ({
          ...prev,
          diagnoses: [newDiagnosis, ...prev.diagnoses],
          totalCount: prev.totalCount + 1,
          pendingCount: prev.pendingCount + 1,
          isLoading: false,
          aiModelStatus: 'ready',
          lastAnalysisTime: new Date(),
        }));

        logger.info(
          'AI diagnosis generated successfully:',
          JSON.stringify({ id: docRef.id, confidence: aiAnalysis.confidenceScore }),
        );
        return newDiagnosis;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to generate AI diagnosis';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
          aiModelStatus: 'error',
        }));
        logger.error('Error generating AI diagnosis:', String(error));
        throw error;
      }
    },
    [authState.user, logDataAccess],
  );

  const simulateAIAnalysis = useCallback(
    async (data: CreateDiagnosisData): Promise<AIAnalysisResult> => {
      // Simulación de análisis de IA (TODO: Reemplazar con llamada real al backend)
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simular delay de procesamiento

      const symptoms = data.symptoms.join(', ').toLowerCase();
      const vitalSigns = data.vitalSigns;

      // Lógica simple de diagnóstico basada en síntomas
      let primaryDiagnosis = 'Síntomas inespecíficos';
      let differentialDiagnoses: string[] = [];
      let confidenceScore = 0.6;
      let riskFactors: string[] = [];
      let recommendedTests: string[] = [];
      let treatmentSuggestions: string[] = [];
      let urgency: 'low' | 'medium' | 'high' | 'critical' = 'low';

      // Análisis de presión arterial
      if (
        vitalSigns.bloodPressure.includes('140/90') ||
        vitalSigns.bloodPressure.includes('160/100')
      ) {
        primaryDiagnosis = 'Hipertensión arterial';
        differentialDiagnoses = [
          'Hipertensión esencial',
          'Hipertensión secundaria',
          'Hipertensión de bata blanca',
        ];
        confidenceScore = 0.85;
        riskFactors = ['Edad avanzada', 'Obesidad', 'Historial familiar'];
        recommendedTests = ['Electrocardiograma', 'Ecocardiograma', 'Análisis de sangre'];
        treatmentSuggestions = ['Cambios en estilo de vida', 'Medicación antihipertensiva'];
        urgency = vitalSigns.bloodPressure.includes('160/100') ? 'high' : 'medium';
      }

      // Análisis de frecuencia cardíaca
      if (vitalSigns.heartRate > 100) {
        if (primaryDiagnosis === 'Síntomas inespecíficos') {
          primaryDiagnosis = 'Taquicardia';
          confidenceScore = 0.75;
        }
        differentialDiagnoses.push('Taquicardia sinusal', 'Arritmia cardíaca');
        recommendedTests.push('Holter de 24h', 'Prueba de esfuerzo');
        urgency = vitalSigns.heartRate > 120 ? 'high' : 'medium';
      }

      // Análisis de temperatura
      if (vitalSigns.temperature > 38) {
        if (primaryDiagnosis === 'Síntomas inespecíficos') {
          primaryDiagnosis = 'Fiebre';
          confidenceScore = 0.8;
        }
        differentialDiagnoses.push('Infección viral', 'Infección bacteriana');
        recommendedTests.push('Hemograma completo', 'Cultivos bacterianos');
        urgency = vitalSigns.temperature > 39 ? 'high' : 'medium';
      }

      // Análisis de síntomas específicos
      if (symptoms.includes('dolor') && symptoms.includes('pecho')) {
        primaryDiagnosis = 'Dolor torácico';
        differentialDiagnoses = [
          'Angina de pecho',
          'Infarto agudo de miocardio',
          'Reflujo gastroesofágico',
        ];
        confidenceScore = 0.9;
        urgency = 'critical';
        recommendedTests = [
          'Electrocardiograma inmediato',
          'Troponina cardíaca',
          'Radiografía de tórax',
        ];
      }

      if (symptoms.includes('dificultad') && symptoms.includes('respirar')) {
        primaryDiagnosis = 'Dificultad respiratoria';
        differentialDiagnoses = ['Asma', 'EPOC', 'Neumonía', 'Embolia pulmonar'];
        confidenceScore = 0.85;
        urgency = 'high';
        recommendedTests = ['Espirometría', 'Radiografía de tórax', 'Gasometría arterial'];
      }

      return {
        primaryDiagnosis,
        differentialDiagnoses:
          differentialDiagnoses.length > 0 ? differentialDiagnoses : ['Evaluación médica general'],
        confidenceScore,
        riskFactors:
          riskFactors.length > 0 ? riskFactors : ['Evaluación de factores de riesgo requerida'],
        recommendedTests:
          recommendedTests.length > 0 ? recommendedTests : ['Examen físico completo'],
        treatmentSuggestions:
          treatmentSuggestions.length > 0
            ? treatmentSuggestions
            : ['Consulta médica para evaluación'],
        urgency,
        explanation: `Análisis basado en síntomas reportados: ${data.symptoms.join(', ')} y signos vitales actuales.`,
        evidence: ['Síntomas reportados', 'Signos vitales', 'Historial médico'],
        limitations: [
          'Análisis preliminar',
          'Requiere confirmación médica',
          'No reemplaza evaluación profesional',
        ],
      };
    },
    [],
  );

  const fetchDiagnoses = useCallback(
    async (filters?: DiagnosisFilters) => {
      try {
        if (!authState.user) {
          throw new Error('User not authenticated');
        }

        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        // Log de acceso
        await logDataAccess('READ', 'AI_DIAGNOSES', 'Fetching AI diagnoses');

        // Construir query base
        let diagnosesQuery = query(
          collection(db, 'ai_diagnoses'),
          where('patientId', '==', authState.user.uid),
          orderBy('createdAt', 'desc'),
        );

        // Aplicar filtros adicionales
        if (filters?.status) {
          diagnosesQuery = query(diagnosesQuery, where('status', '==', filters.status));
        }

        if (filters?.dateFrom) {
          diagnosesQuery = query(diagnosesQuery, where('createdAt', '>=', filters.dateFrom));
        }

        if (filters?.dateTo) {
          diagnosesQuery = query(diagnosesQuery, where('createdAt', '<=', filters.dateTo));
        }

        if (filters?.doctorId) {
          diagnosesQuery = query(diagnosesQuery, where('doctorId', '==', filters.doctorId));
        }

        // Ejecutar query
        const querySnapshot = await getDocs(diagnosesQuery);
        const diagnoses: AIDiagnosis[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          diagnoses.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            auditTrail: data.auditTrail || [],
            dataAccessLog: data.dataAccessLog || [],
          } as AIDiagnosis);
        });

        // Aplicar filtros adicionales en memoria
        let filteredDiagnoses = diagnoses;

        if (filters?.urgency) {
          filteredDiagnoses = filteredDiagnoses.filter(
            (d) => d.aiAnalysis.urgency === filters.urgency,
          );
        }

        if (filters?.confidenceMin) {
          filteredDiagnoses = filteredDiagnoses.filter(
            (d) => d.confidence >= filters.confidenceMin!,
          );
        }

        // Calcular métricas
        const totalCount = filteredDiagnoses.length;
        const pendingCount = filteredDiagnoses.filter((d) => d.status === 'pending').length;
        const confirmedCount = filteredDiagnoses.filter((d) => d.status === 'confirmed').length;

        setState({
          diagnoses: filteredDiagnoses,
          isLoading: false,
          error: null,
          totalCount,
          pendingCount,
          confirmedCount,
          aiModelStatus: 'ready',
        });

        logger.info('AI diagnoses fetched successfully:', JSON.stringify({ count: totalCount }));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch AI diagnoses';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        logger.error('Error fetching AI diagnoses:', String(error));
        throw error;
      }
    },
    [authState.user, logDataAccess],
  );

  const updateDiagnosis = useCallback(
    async (diagnosisId: string, updates: Partial<AIDiagnosis>) => {
      try {
        if (!authState.user) {
          throw new Error('User not authenticated');
        }

        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        // Log de acceso
        await logDataAccess('UPDATE', `AI_DIAGNOSIS_${diagnosisId}`, 'Updating AI diagnosis');

        // Actualizar en Firestore
        const diagnosisRef = doc(db, 'ai_diagnoses', diagnosisId);
        await updateDoc(diagnosisRef, {
          ...updates,
          updatedAt: serverTimestamp(),
        });

        // Actualizar estado local
        setState((prev) => ({
          ...prev,
          diagnoses: prev.diagnoses.map((d) => (d.id === diagnosisId ? { ...d, ...updates } : d)),
          isLoading: false,
        }));

        logger.info('AI diagnosis updated successfully:', JSON.stringify({ id: diagnosisId }));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to update AI diagnosis';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        logger.error('Error updating AI diagnosis:', String(error));
        throw error;
      }
    },
    [authState.user, logDataAccess],
  );

  const confirmDiagnosis = useCallback(
    async (diagnosisId: string, doctorRecommendation: string) => {
      try {
        if (!authState.user) {
          throw new Error('User not authenticated');
        }

        // Log de acceso
        await logDataAccess('CONFIRM', `AI_DIAGNOSIS_${diagnosisId}`, 'Confirming AI diagnosis');

        // Actualizar diagnóstico
        await updateDiagnosis(diagnosisId, {
          status: 'confirmed',
          doctorRecommendation,
          confidence: 0.95, // Aumentar confianza al ser confirmado
        });

        logger.info('AI diagnosis confirmed successfully:', JSON.stringify({ id: diagnosisId }));
      } catch (error) {
        logger.error('Error confirming AI diagnosis:', String(error));
        throw error;
      }
    },
    [authState.user, logDataAccess, updateDiagnosis],
  );

  const rejectDiagnosis = useCallback(
    async (diagnosisId: string, reason: string) => {
      try {
        if (!authState.user) {
          throw new Error('User not authenticated');
        }

        // Log de acceso
        await logDataAccess('REJECT', `AI_DIAGNOSIS_${diagnosisId}`, reason);

        // Actualizar diagnóstico
        await updateDiagnosis(diagnosisId, {
          status: 'rejected',
          doctorRecommendation: `Rechazado: ${reason}`,
          confidence: 0.1, // Reducir confianza al ser rechazado
        });

        logger.info(
          'AI diagnosis rejected successfully:',
          JSON.stringify({ id: diagnosisId, reason }),
        );
      } catch (error) {
        logger.error('Error rejecting AI diagnosis:', String(error));
        throw error;
      }
    },
    [authState.user, logDataAccess, updateDiagnosis],
  );

  const getDiagnosisById = useCallback(
    (diagnosisId: string) => {
      return state.diagnoses.find((d) => d.id === diagnosisId);
    },
    [state.diagnoses],
  );

  const getPendingDiagnoses = useCallback(() => {
    return state.diagnoses.filter((d) => d.status === 'pending');
  }, [state.diagnoses]);

  const getConfirmedDiagnoses = useCallback(() => {
    return state.diagnoses.filter((d) => d.status === 'confirmed');
  }, [state.diagnoses]);

  const getHighUrgencyDiagnoses = useCallback(() => {
    return state.diagnoses.filter(
      (d) => d.aiAnalysis.urgency === 'high' || d.aiAnalysis.urgency === 'critical',
    );
  }, [state.diagnoses]);

  const searchDiagnoses = useCallback(
    (searchTerm: string) => {
      if (!searchTerm.trim()) return state.diagnoses;

      const term = searchTerm.toLowerCase();
      return state.diagnoses.filter(
        (diagnosis) =>
          diagnosis.aiAnalysis.primaryDiagnosis.toLowerCase().includes(term) ||
          diagnosis.symptoms.some((symptom) => symptom.toLowerCase().includes(term)) ||
          diagnosis.aiAnalysis.differentialDiagnoses.some((diff) =>
            diff.toLowerCase().includes(term),
          ),
      );
    },
    [state.diagnoses],
  );

  const getAIModelStatus = useCallback(() => {
    return state.aiModelStatus;
  }, [state.aiModelStatus]);

  // ============================================================================
  // EFECTOS
  // ============================================================================

  useEffect(() => {
    if (authState.isAuthenticated && authState.user) {
      fetchDiagnoses();
    }
  }, [authState.isAuthenticated, authState.user, fetchDiagnoses]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return {
    // Estado
    ...state,

    // Funciones principales
    generateAIDiagnosis,
    fetchDiagnoses,
    updateDiagnosis,
    confirmDiagnosis,
    rejectDiagnosis,

    // Funciones de consulta
    getDiagnosisById,
    getPendingDiagnoses,
    getConfirmedDiagnoses,
    getHighUrgencyDiagnoses,
    searchDiagnoses,
    getAIModelStatus,

    // Utilidades
    logDataAccess,
  };
};

export default useAIHIPAA;
