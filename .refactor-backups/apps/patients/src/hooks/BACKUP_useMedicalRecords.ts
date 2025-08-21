/**
 * 📋 HOOKS ESPECIALIZADOS MÉDICOS - ALTAMEDICA (DEPRECATED)
 *
 * ⚠️ DEPRECATION NOTICE:
 * Este archivo ha sido consolidado en useMedicalHistoryUnified.ts
 *
 * FUNCIONALIDADES MIGRADAS:
 * - ✅ useMedicalRecords → useMedicalHistoryUnified
 * - ✅ usePrescriptions → useMedicalHistoryUnified (prescriptions)
 * - ✅ useMedicalAI → useMedicalHistoryUnified (analyzeSymptoms, checkDrugInteractions)
 * - ✅ useMedicalDashboard → useMedicalHistoryUnified (dashboardData)
 *
 * NUEVA UBICACIÓN: ./useMedicalHistoryUnified.ts
 *
 * Por favor use el hook unificado para evitar duplicación.
 */

// Re-export from unified implementation
import { useMedicalHistoryUnified } from './useMedicalHistoryUnified';

// Backward compatibility wrappers
export const useMedicalRecordsBackup = useMedicalHistoryUnified;
export const usePrescriptionsBackup = useMedicalHistoryUnified;
export const useMedicalAIBackup = useMedicalHistoryUnified;
export const useMedicalDashboardBackup = useMedicalHistoryUnified;

import { useState, useEffect, useCallback, useMemo } from 'react';
import { medicalService } from '../services';
import type {
  MedicalRecord,
  Prescription,
  PaginatedResponse,
  SymptomAnalysis,
  DrugInteractionCheck,
} from '../types';
import type { MedicalRecordFilters } from '../services/MedicalService';

// 📋 HOOK DE REGISTROS MÉDICOS
export function useMedicalRecords(
  patientId?: string,
  options: { initialFetch?: boolean; defaultLimit?: number } = {},
) {
  const { initialFetch = false, defaultLimit = 10 } = options;

  const [state, setState] = useState({
    records: [] as MedicalRecord[],
    currentRecord: null as MedicalRecord | null,
    loading: false,
    error: null as string | null,
    pagination: null as any,
    lastFetch: null as string | null,
  });

  const [currentFilters, setCurrentFilters] = useState<MedicalRecordFilters>({
    ...(patientId && { patientId }),
    limit: defaultLimit,
    page: 1,
  });

  const searchRecords = useCallback(
    async (filters: MedicalRecordFilters = {}) => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const searchFilters = { ...currentFilters, ...filters };
        setCurrentFilters(searchFilters);

        const response: PaginatedResponse<MedicalRecord> =
          await medicalService.getMedicalRecords(searchFilters);

        setState((prev) => ({
          ...prev,
          records: response.data,
          pagination: {
            page: searchFilters.page || 1,
            limit: searchFilters.limit || defaultLimit,
            total: response.total,
            totalPages: Math.ceil(response.total / (searchFilters.limit || defaultLimit)),
            hasNextPage: response.hasNextPage,
            hasPrevPage: response.hasPrevPage,
          },
          loading: false,
          lastFetch: new Date().toISOString(),
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Error al buscar registros médicos',
        }));
      }
    },
    [currentFilters, defaultLimit],
  );

  const getRecordById = useCallback(async (id: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const record = await medicalService.getMedicalRecordById(id);
      setState((prev) => ({ ...prev, currentRecord: record, loading: false }));
      return record;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al obtener registro médico',
      }));
      return null;
    }
  }, []);

  useEffect(() => {
    if (initialFetch) {
      searchRecords();
    }
  }, [initialFetch]);

  const memoizedData = useMemo(() => {
    const recordsByType = state.records.reduce(
      (acc, record) => {
        if (!acc[record.type]) acc[record.type] = [];
        acc[record.type].push(record);
        return acc;
      },
      {} as Record<string, MedicalRecord[]>,
    );

    const recentRecords = state.records
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    return {
      ...state,
      recordsByType,
      recentRecords,
      hasRecords: state.records.length > 0,
      totalRecords: state.records.length,
    };
  }, [state]);

  return {
    ...memoizedData,
    searchRecords,
    getRecordById,
    refreshRecords: () => searchRecords(currentFilters),
    clearError: () => setState((prev) => ({ ...prev, error: null })),
  };
}

// 💊 HOOK DE PRESCRIPCIONES
export function usePrescriptions(patientId?: string, options: { initialFetch?: boolean } = {}) {
  const { initialFetch = false } = options;

  const [state, setState] = useState({
    prescriptions: [] as Prescription[],
    currentPrescription: null as Prescription | null,
    loading: false,
    error: null as string | null,
    lastFetch: null as string | null,
  });

  const fetchPrescriptions = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const response: PaginatedResponse<Prescription> =
        await medicalService.getPrescriptions(patientId);

      setState((prev) => ({
        ...prev,
        prescriptions: response.data,
        loading: false,
        lastFetch: new Date().toISOString(),
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al obtener prescripciones',
      }));
    }
  }, [patientId]);

  const verifyPrescription = useCallback(async (code: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const prescription = await medicalService.verifyPrescription(code);

      setState((prev) => ({
        ...prev,
        currentPrescription: prescription,
        loading: false,
      }));

      return prescription;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al verificar prescripción',
      }));
      return null;
    }
  }, []);

  useEffect(() => {
    if (initialFetch) {
      fetchPrescriptions();
    }
  }, [initialFetch, fetchPrescriptions]);

  const memoizedData = useMemo(() => {
    const activePrescriptions = state.prescriptions.filter((p) => p.status === 'active');
    const expiredPrescriptions = state.prescriptions.filter((p) => p.status === 'expired');
    const expiringSoon = state.prescriptions.filter((p) => {
      if (p.status !== 'active') return false;
      const expiryDate = new Date(p.expiryDate);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return expiryDate <= thirtyDaysFromNow;
    });

    return {
      ...state,
      activePrescriptions,
      expiredPrescriptions,
      expiringSoon,
      hasActivePrescriptions: activePrescriptions.length > 0,
      expiringCount: expiringSoon.length,
    };
  }, [state]);

  return {
    ...memoizedData,
    fetchPrescriptions,
    verifyPrescription,
    refreshPrescriptions: fetchPrescriptions,
    clearError: () => setState((prev) => ({ ...prev, error: null })),
  };
}

// 🤖 HOOK DE IA MÉDICA
export function useMedicalAI() {
  const [analysisState, setAnalysisState] = useState({
    symptomAnalysis: null as SymptomAnalysis | null,
    drugCheck: null as DrugInteractionCheck | null,
    loading: false,
    error: null as string | null,
  });

  const analyzeSymptoms = useCallback(async (symptoms: string[], patientInfo?: any) => {
    try {
      setAnalysisState((prev) => ({ ...prev, loading: true, error: null }));

      const analysis = await medicalService.analyzeSymptoms(symptoms, patientInfo);

      setAnalysisState((prev) => ({
        ...prev,
        symptomAnalysis: analysis,
        loading: false,
      }));

      return analysis;
    } catch (error) {
      setAnalysisState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error en análisis de síntomas',
      }));
      return null;
    }
  }, []);

  const checkDrugInteractions = useCallback(async (medications: string[]) => {
    try {
      setAnalysisState((prev) => ({ ...prev, loading: true, error: null }));

      const drugCheck = await medicalService.checkDrugInteractions(medications);

      setAnalysisState((prev) => ({
        ...prev,
        drugCheck,
        loading: false,
      }));

      return drugCheck;
    } catch (error) {
      setAnalysisState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error en verificación de interacciones',
      }));
      return null;
    }
  }, []);

  const clearAnalysis = useCallback(() => {
    setAnalysisState({
      symptomAnalysis: null,
      drugCheck: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...analysisState,
    analyzeSymptoms,
    checkDrugInteractions,
    clearAnalysis,
    clearError: () => setAnalysisState((prev) => ({ ...prev, error: null })),
  };
}

// 📊 HOOK PARA DASHBOARD MÉDICO
export function useMedicalDashboard(patientId?: string) {
  const [dashboardData, setDashboardData] = useState({
    recentRecords: [] as MedicalRecord[],
    activePrescriptions: [] as Prescription[],
    upcomingAppointments: [] as any[],
    healthMetrics: null as any,
    loading: false,
    error: null as string | null,
    lastUpdate: null as string | null,
  });

  const loadDashboard = useCallback(async () => {
    try {
      setDashboardData((prev) => ({ ...prev, loading: true, error: null }));

      // Cargar datos en paralelo para mejor rendimiento
      const [recordsResponse, prescriptionsResponse] = await Promise.allSettled([
        medicalService.getMedicalRecords({ patientId, limit: 5 }),
        medicalService.getPrescriptions(patientId),
      ]);

      const recentRecords =
        recordsResponse.status === 'fulfilled' ? recordsResponse.value.data : [];
      const allPrescriptions =
        prescriptionsResponse.status === 'fulfilled' ? prescriptionsResponse.value.data : [];
      const activePrescriptions = allPrescriptions.filter((p) => p.status === 'active');

      setDashboardData((prev) => ({
        ...prev,
        recentRecords,
        activePrescriptions,
        loading: false,
        lastUpdate: new Date().toISOString(),
      }));
    } catch (error) {
      setDashboardData((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al cargar dashboard médico',
      }));
    }
  }, [patientId]);

  const refreshDashboard = useCallback(() => {
    return loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (patientId) {
      loadDashboard();
    }
  }, [patientId, loadDashboard]);

  const summaryData = useMemo(() => {
    const criticalPrescriptions = dashboardData.activePrescriptions.filter(
      (p) => new Date(p.expiryDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
    );

    const urgentRecords = dashboardData.recentRecords.filter(
      (r) => r.priority === 'urgent' || r.priority === 'critical',
    );

    return {
      ...dashboardData,
      criticalPrescriptions,
      urgentRecords,
      hasCriticalItems: criticalPrescriptions.length > 0 || urgentRecords.length > 0,
      totalActivePrescriptions: dashboardData.activePrescriptions.length,
      recentRecordsCount: dashboardData.recentRecords.length,
    };
  }, [dashboardData]);

  return {
    ...summaryData,
    refreshDashboard,
    clearError: () => setDashboardData((prev) => ({ ...prev, error: null })),
  };
}

export default {
  useMedicalRecords,
  usePrescriptions,
  useMedicalAI,
  useMedicalDashboard,
};
