// 🧠 DIAGNÓSTICO IA REAL - REEMPLAZA TODOS LOS STUBS
// Implementa análisis médico real con OpenAI/Claude API
// ELIMINA: useDiagnosisQuickAnalysis.stub.ts, useDiagnosisRestrictions.stub.ts

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';

// 📊 TIPOS MÉDICOS REALES
export interface DiagnosisSymptom {
  id: string;
  name: string;
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  duration: string;
  location?: string;
  description: string;
  associatedSymptoms?: string[];
}

export interface MedicalHistory {
  conditions: string[];
  medications: string[];
  allergies: string[];
  surgeries: string[];
  familyHistory: string[];
}

export interface DiagnosisAnalysis {
  id: string;
  patientId: string;
  symptoms: DiagnosisSymptom[];
  medicalHistory: MedicalHistory;
  possibleConditions: {
    condition: string;
    probability: number;
    confidence: number;
    icd10Code: string;
    reasoning: string;
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
    requiredTests: string[];
  }[];
  recommendations: {
    immediate: string[];
    followUp: string[];
    lifestyle: string[];
    monitoring: string[];
  };
  redFlags: string[];
  aiConfidence: number;
  requiresHumanReview: boolean;
  timestamp: string;
}

export interface DiagnosisRestriction {
  type: 'age' | 'gender' | 'pregnancy' | 'allergy' | 'medication' | 'condition';
  value: string;
  message: string;
  severity: 'warning' | 'contraindication';
}

// 🔗 API CLIENTE REAL
const diagnosisAPI = {
  analyzeSymptoms: async (data: {
    patientId: string;
    symptoms: DiagnosisSymptom[];
    medicalHistory: MedicalHistory;
  }): Promise<DiagnosisAnalysis> => {
    const response = await fetch('/api/v1/diagnosis/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Diagnosis analysis failed: ${response.statusText}`);
    }

    return response.json();
  },

  getRestrictions: async (data: {
    patientId: string;
    proposedTreatments: string[];
  }): Promise<DiagnosisRestriction[]> => {
    const response = await fetch('/api/v1/diagnosis/restrictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Restrictions check failed: ${response.statusText}`);
    }

    return response.json();
  },

  quickAnalysis: async (
    symptoms: string[],
  ): Promise<{
    urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
    triageRecommendation: string;
    requiresImmediateAttention: boolean;
    estimatedWaitTime?: number;
  }> => {
    const response = await fetch('/api/v1/diagnosis/quick-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptoms }),
    });

    if (!response.ok) {
      throw new Error(`Quick analysis failed: ${response.statusText}`);
    }

    return response.json();
  },
};

// 🧠 HOOK PRINCIPAL - ANÁLISIS COMPLETO
export const useDiagnosisAnalysis = (patientId: string) => {
  const [symptoms, setSymptoms] = useState<DiagnosisSymptom[]>([]);
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory>({
    conditions: [],
    medications: [],
    allergies: [],
    surgeries: [],
    familyHistory: [],
  });

  const analysisMutation = useMutation({
    mutationFn: diagnosisAPI.analyzeSymptoms,
    onSuccess: (data) => {
      // Auto-save análisis para auditoría médica
      localStorage.setItem(`diagnosis_${patientId}_${data.id}`, JSON.stringify(data));
    },
  });

  const analyze = useCallback(() => {
    if (!patientId || symptoms.length === 0) return;

    analysisMutation.mutate({
      patientId,
      symptoms,
      medicalHistory,
    });
  }, [patientId, symptoms, medicalHistory, analysisMutation]);

  const addSymptom = useCallback((symptom: Omit<DiagnosisSymptom, 'id'>) => {
    const newSymptom = {
      ...symptom,
      id: `symptom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    setSymptoms((prev) => [...prev, newSymptom]);
  }, []);

  const removeSymptom = useCallback((symptomId: string) => {
    setSymptoms((prev) => prev.filter((s) => s.id !== symptomId));
  }, []);

  const updateMedicalHistory = useCallback((updates: Partial<MedicalHistory>) => {
    setMedicalHistory((prev) => ({ ...prev, ...updates }));
  }, []);

  return {
    // Estado
    symptoms,
    medicalHistory,
    analysis: analysisMutation.data,
    isAnalyzing: analysisMutation.isPending,
    error: analysisMutation.error,

    // Acciones
    analyze,
    addSymptom,
    removeSymptom,
    updateMedicalHistory,
    reset: () => {
      setSymptoms([]);
      analysisMutation.reset();
    },
  };
};

// ⚡ HOOK ANÁLISIS RÁPIDO - REEMPLAZA useDiagnosisQuickAnalysis.stub.ts
export const useDiagnosisQuickAnalysis = () => {
  const quickAnalysisMutation = useMutation({
    mutationFn: diagnosisAPI.quickAnalysis,
  });

  const analyzeQuick = useCallback(
    (symptoms: string[]) => {
      if (symptoms.length === 0) return;
      quickAnalysisMutation.mutate(symptoms);
    },
    [quickAnalysisMutation],
  );

  return {
    result: quickAnalysisMutation.data,
    isAnalyzing: quickAnalysisMutation.isPending,
    error: quickAnalysisMutation.error,
    analyzeQuick,
    reset: quickAnalysisMutation.reset,
  };
};

// 🚨 HOOK RESTRICCIONES - REEMPLAZA useDiagnosisRestrictions.stub.ts
export const useDiagnosisRestrictions = (patientId: string) => {
  const [proposedTreatments, setProposedTreatments] = useState<string[]>([]);

  const restrictionsQuery = useQuery({
    queryKey: ['diagnosis-restrictions', patientId, proposedTreatments],
    queryFn: () => diagnosisAPI.getRestrictions({ patientId, proposedTreatments }),
    enabled: patientId !== '' && proposedTreatments.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const checkRestrictions = useCallback((treatments: string[]) => {
    setProposedTreatments(treatments);
  }, []);

  const hasRestrictions = restrictionsQuery.data?.length > 0;
  const hasCriticalRestrictions = restrictionsQuery.data?.some(
    (r) => r.severity === 'contraindication',
  );

  return {
    restrictions: restrictionsQuery.data || [],
    isLoading: restrictionsQuery.isLoading,
    error: restrictionsQuery.error,
    hasRestrictions,
    hasCriticalRestrictions,
    checkRestrictions,
    refetch: restrictionsQuery.refetch,
  };
};

// 📊 HOOK HISTÓRICO - ANÁLISIS PREVIOS
export const useDiagnosisHistory = (patientId: string) => {
  const [history, setHistory] = useState<DiagnosisAnalysis[]>([]);

  useEffect(() => {
    const loadHistory = () => {
      const keys = Object.keys(localStorage).filter((key) =>
        key.startsWith(`diagnosis_${patientId}_`),
      );

      const analyses = keys
        .map((key) => {
          try {
            return JSON.parse(localStorage.getItem(key) || '{}');
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      setHistory(
        analyses.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
      );
    };

    if (patientId) loadHistory();
  }, [patientId]);

  const clearHistory = useCallback(() => {
    const keys = Object.keys(localStorage).filter((key) =>
      key.startsWith(`diagnosis_${patientId}_`),
    );
    keys.forEach((key) => localStorage.removeItem(key));
    setHistory([]);
  }, [patientId]);

  return {
    history,
    clearHistory,
    hasHistory: history.length > 0,
    latestAnalysis: history[0] || null,
  };
};

// 🎯 EXPORTS PARA REEMPLAZAR STUBS COMPLETAMENTE
export default {
  useDiagnosisAnalysis,
  useDiagnosisQuickAnalysis,
  useDiagnosisRestrictions,
  useDiagnosisHistory,
};
