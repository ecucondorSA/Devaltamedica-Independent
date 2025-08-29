/**
 * usePrescriptionsHIPAA.tsx
 * Hook de prescripciones médicas HIPAA real que conecta con el backend implementado
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
// TIPOS Y INTERFACES HIPAA PARA PRESCRIPCIONES
// ============================================================================

export interface HIPAAPrescription {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  doctorLicense: string;
  prescriptionDate: Date;
  expiryDate: Date;
  status: 'active' | 'expired' | 'cancelled' | 'completed';
  medications: PrescriptionMedication[];
  instructions: string;
  diagnosis: string;
  notes: string;
  // Campos de compliance HIPAA
  hipaaCompliant: boolean;
  auditTrail: PrescriptionAuditEntry[];
  dataAccessLog: DataAccessEntry[];
  // Campos médicos específicos
  dosageInstructions: string;
  contraindications: string[];
  sideEffects: string[];
  interactions: string[];
  refills: number;
  refillsRemaining: number;
  pharmacy: string;
  insurance: string;
  cost: number;
}

export interface PrescriptionMedication {
  name: string;
  genericName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  unit: string;
  strength: string;
  form: string;
  route: string;
  ndc: string; // National Drug Code
  deaSchedule: string; // Drug Enforcement Administration Schedule
}

export interface PrescriptionAuditEntry {
  timestamp: Date;
  action: string;
  userId: string;
  userRole: string;
  details: string;
  ipAddress: string;
  userAgent: string;
}

export interface DataAccessEntry {
  timestamp: Date;
  action: string;
  resource: string;
  ipAddress: string;
  userAgent: string;
  reason: string;
}

export interface CreatePrescriptionData {
  patientId: string;
  doctorId: string;
  doctorName: string;
  doctorLicense: string;
  medications: Omit<PrescriptionMedication, 'ndc' | 'deaSchedule'>[];
  instructions: string;
  diagnosis: string;
  notes: string;
  dosageInstructions: string;
  contraindications: string[];
  sideEffects: string[];
  interactions: string[];
  refills: number;
  pharmacy: string;
  insurance: string;
  cost: number;
}

export interface PrescriptionFilters {
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  doctorId?: string;
  medicationName?: string;
}

export interface PrescriptionsState {
  prescriptions: HIPAAPrescription[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  activeCount: number;
  expiredCount: number;
}

// ============================================================================
// HOOK PRINCIPAL DE PRESCRIPCIONES HIPAA
// ============================================================================

export const usePrescriptionsHIPAA = () => {
  const { state: authState } = useAuthHIPAA();
  const [state, setState] = useState<PrescriptionsState>({
    prescriptions: [],
    isLoading: false,
    error: null,
    totalCount: 0,
    activeCount: 0,
    expiredCount: 0,
  });

  // ============================================================================
  // FUNCIONES DE PRESCRIPCIONES HIPAA
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

        // Log de auditoría
        const auditEntry: PrescriptionAuditEntry = {
          timestamp: new Date(),
          action: `PRESCRIPTION_${action.toUpperCase()}`,
          userId: authState.user.uid,
          userRole: authState.user.role,
          details: `User ${action} ${resource} for ${reason}`,
          ipAddress: 'client-ip',
          userAgent: navigator.userAgent,
        };

        await addDoc(collection(db, 'prescription_audit_logs'), auditEntry);
      } catch (error) {
        logger.error('Error logging prescription data access:', String(error));
      }
    },
    [authState.user],
  );

  const fetchPrescriptions = useCallback(
    async (filters?: PrescriptionFilters) => {
      try {
        if (!authState.user) {
          throw new Error('User not authenticated');
        }

        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        // Log de acceso
        await logDataAccess('READ', 'PRESCRIPTIONS', 'Fetching user prescriptions');

        // Construir query base
        let prescriptionsQuery = query(
          collection(db, 'prescriptions'),
          where('patientId', '==', authState.user.uid),
          orderBy('prescriptionDate', 'desc'),
        );

        // Aplicar filtros adicionales
        if (filters?.status) {
          prescriptionsQuery = query(prescriptionsQuery, where('status', '==', filters.status));
        }

        if (filters?.dateFrom) {
          prescriptionsQuery = query(
            prescriptionsQuery,
            where('prescriptionDate', '>=', filters.dateFrom),
          );
        }

        if (filters?.dateTo) {
          prescriptionsQuery = query(
            prescriptionsQuery,
            where('prescriptionDate', '<=', filters.dateTo),
          );
        }

        if (filters?.doctorId) {
          prescriptionsQuery = query(prescriptionsQuery, where('doctorId', '==', filters.doctorId));
        }

        // Ejecutar query
        const querySnapshot = await getDocs(prescriptionsQuery);
        const prescriptions: HIPAAPrescription[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          prescriptions.push({
            id: doc.id,
            ...data,
            prescriptionDate: data.prescriptionDate?.toDate() || new Date(),
            expiryDate: data.expiryDate?.toDate() || new Date(),
            auditTrail: data.auditTrail || [],
            dataAccessLog: data.dataAccessLog || [],
          } as HIPAAPrescription);
        });

        // Filtrar por nombre de medicamento si se especifica
        let filteredPrescriptions = prescriptions;
        if (filters?.medicationName) {
          filteredPrescriptions = prescriptions.filter((prescription) =>
            prescription.medications.some(
              (med) =>
                med.name.toLowerCase().includes(filters.medicationName!.toLowerCase()) ||
                med.genericName.toLowerCase().includes(filters.medicationName!.toLowerCase()),
            ),
          );
        }

        // Calcular métricas
        const totalCount = filteredPrescriptions.length;
        const activeCount = filteredPrescriptions.filter((p) => p.status === 'active').length;
        const expiredCount = filteredPrescriptions.filter((p) => p.status === 'expired').length;

        setState({
          prescriptions: filteredPrescriptions,
          isLoading: false,
          error: null,
          totalCount,
          activeCount,
          expiredCount,
        });

        logger.info('Prescriptions fetched successfully:', { count: totalCount });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch prescriptions';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        logger.error('Error fetching prescriptions:', String(error));
        throw error;
      }
    },
    [authState.user, logDataAccess],
  );

  const createPrescription = useCallback(
    async (data: CreatePrescriptionData) => {
      try {
        if (!authState.user) {
          throw new Error('User not authenticated');
        }

        // Verificar permisos (solo doctores pueden crear prescripciones)
        if (authState.user.role !== 'doctor') {
          throw new Error('Insufficient permissions to create prescriptions');
        }

        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        // Log de acceso
        await logDataAccess('CREATE', 'PRESCRIPTION', 'Creating new prescription');

        // Preparar datos de la prescripción
        const prescriptionData: Omit<HIPAAPrescription, 'id' | 'auditTrail' | 'dataAccessLog'> = {
          patientId: data.patientId,
          doctorId: data.doctorId,
          doctorName: data.doctorName,
          doctorLicense: data.doctorLicense,
          prescriptionDate: new Date(),
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año por defecto
          status: 'active',
          medications: data.medications.map((med) => ({
            ...med,
            ndc: `NDC_${Math.random().toString(36).substr(2, 9)}`, // TODO: Integrar con base de datos real de medicamentos
            deaSchedule: 'IV', // TODO: Determinar basado en el medicamento
          })),
          instructions: data.instructions,
          diagnosis: data.diagnosis,
          notes: data.notes,
          hipaaCompliant: true,
          dosageInstructions: data.dosageInstructions,
          contraindications: data.contraindications,
          sideEffects: data.sideEffects,
          interactions: data.interactions,
          refills: data.refills,
          refillsRemaining: data.refills,
          pharmacy: data.pharmacy,
          insurance: data.insurance,
          cost: data.cost,
        };

        // Crear documento en Firestore
        const docRef = await addDoc(collection(db, 'prescriptions'), {
          ...prescriptionData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Crear prescripción completa
        const newPrescription: HIPAAPrescription = {
          ...prescriptionData,
          id: docRef.id,
          auditTrail: [],
          dataAccessLog: [],
        };

        // Actualizar estado local
        setState((prev) => ({
          ...prev,
          prescriptions: [newPrescription, ...prev.prescriptions],
          totalCount: prev.totalCount + 1,
          activeCount: prev.activeCount + 1,
          isLoading: false,
        }));

        logger.info('Prescription created successfully:', { id: docRef.id });
        return newPrescription;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to create prescription';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        logger.error('Error creating prescription:', String(error));
        throw error;
      }
    },
    [authState.user, logDataAccess],
  );

  const updatePrescription = useCallback(
    async (prescriptionId: string, updates: Partial<HIPAAPrescription>) => {
      try {
        if (!authState.user) {
          throw new Error('User not authenticated');
        }

        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        // Log de acceso
        await logDataAccess('UPDATE', `PRESCRIPTION_${prescriptionId}`, 'Updating prescription');

        // Actualizar en Firestore
        const prescriptionRef = doc(db, 'prescriptions', prescriptionId);
        await updateDoc(prescriptionRef, {
          ...updates,
          updatedAt: serverTimestamp(),
        });

        // Actualizar estado local
        setState((prev) => ({
          ...prev,
          prescriptions: prev.prescriptions.map((p) =>
            p.id === prescriptionId ? { ...p, ...updates } : p,
          ),
          isLoading: false,
        }));

        logger.info('Prescription updated successfully:', { id: prescriptionId });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to update prescription';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        logger.error('Error updating prescription:', String(error));
        throw error;
      }
    },
    [authState.user, logDataAccess],
  );

  const cancelPrescription = useCallback(
    async (prescriptionId: string, reason: string) => {
      try {
        if (!authState.user) {
          throw new Error('User not authenticated');
        }

        // Log de acceso
        await logDataAccess('CANCEL', `PRESCRIPTION_${prescriptionId}`, reason);

        // Actualizar estado a cancelado
        await updatePrescription(prescriptionId, {
          status: 'cancelled',
          notes: `${prescriptionId.notes || ''}\n\nCANCELLED: ${reason}`,
        });

        logger.info('Prescription cancelled successfully:', { id: prescriptionId, reason });
      } catch (error) {
        logger.error('Error cancelling prescription:', String(error));
        throw error;
      }
    },
    [authState.user, logDataAccess, updatePrescription],
  );

  const refillPrescription = useCallback(
    async (prescriptionId: string) => {
      try {
        if (!authState.user) {
          throw new Error('User not authenticated');
        }

        // Log de acceso
        await logDataAccess(
          'REFILL',
          `PRESCRIPTION_${prescriptionId}`,
          'Requesting prescription refill',
        );

        // Buscar la prescripción
        const prescription = state.prescriptions.find((p) => p.id === prescriptionId);
        if (!prescription) {
          throw new Error('Prescription not found');
        }

        if (prescription.refillsRemaining <= 0) {
          throw new Error('No refills remaining for this prescription');
        }

        // Actualizar refills restantes
        await updatePrescription(prescriptionId, {
          refillsRemaining: prescription.refillsRemaining - 1,
        });

        logger.info('Prescription refill processed:', { id: prescriptionId });
      } catch (error) {
        logger.error('Error processing prescription refill:', String(error));
        throw error;
      }
    },
    [authState.user, logDataAccess, updatePrescription, state.prescriptions],
  );

  const getPrescriptionById = useCallback(
    (prescriptionId: string) => {
      return state.prescriptions.find((p) => p.id === prescriptionId);
    },
    [state.prescriptions],
  );

  const getActivePrescriptions = useCallback(() => {
    return state.prescriptions.filter((p) => p.status === 'active');
  }, [state.prescriptions]);

  const getExpiredPrescriptions = useCallback(() => {
    return state.prescriptions.filter((p) => p.status === 'expired');
  }, [state.prescriptions]);

  const searchPrescriptions = useCallback(
    (searchTerm: string) => {
      if (!searchTerm.trim()) return state.prescriptions;

      const term = searchTerm.toLowerCase();
      return state.prescriptions.filter((prescription) =>
        prescription.medications.some(
          (med) =>
            med.name.toLowerCase().includes(term) ||
            med.genericName.toLowerCase().includes(term) ||
            prescription.diagnosis.toLowerCase().includes(term) ||
            prescription.doctorName.toLowerCase().includes(term),
        ),
      );
    },
    [state.prescriptions],
  );

  // ============================================================================
  // EFECTOS
  // ============================================================================

  useEffect(() => {
    if (authState.isAuthenticated && authState.user) {
      fetchPrescriptions();
    }
  }, [authState.isAuthenticated, authState.user, fetchPrescriptions]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return {
    // Estado
    ...state,

    // Funciones principales
    fetchPrescriptions,
    createPrescription,
    updatePrescription,
    cancelPrescription,
    refillPrescription,

    // Funciones de consulta
    getPrescriptionById,
    getActivePrescriptions,
    getExpiredPrescriptions,
    searchPrescriptions,

    // Utilidades
    logDataAccess,
  };
};

export default usePrescriptionsHIPAA;
