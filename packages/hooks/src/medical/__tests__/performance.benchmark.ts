/**
 * Performance Benchmarks para Hooks Médicos
 * Tests de rendimiento con Vitest bench
 */

import { bench, describe, beforeAll } from 'vitest';
import { renderHook, act } from '@testing-library/react-hooks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePatients } from '../usePatients';
import { useMedicalRecords } from '../useMedicalRecords';
import { usePrescriptions } from '../usePrescriptions';
import { useVitalSigns } from '../useVitalSigns';
import React from 'react';

// Mock de datos para benchmarks

const mockMedicalRecords = Array.from({ length: 5000 }, (_, i) => ({
  id: `record-${i}`,
  patientId: `patient-${i % 1000}`,
  date: new Date(Date.now() - Math.random() * 31536000000),
  diagnosis: `Diagnosis ${i}`,
  treatment: `Treatment ${i}`,
}));

describe('Hook Performance Benchmarks', () => {
  let queryClient: QueryClient;

  beforeAll(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: Infinity,
        },
      },
    });
  });

  bench('usePatients - Initial render', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    renderHook(() => usePatients(), { wrapper });
  });

  bench('usePatients - With pagination (100 items)', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    renderHook(() => usePatients({ limit: 100, offset: 0 }), { wrapper });

    // Simular respuesta
    act(() => {
      // Simular refetch
    });
  });

  bench('usePatients - With complex filters', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    renderHook(
      () =>
        usePatients({
          filters: {
            ageMin: 30,
            ageMax: 60,
            conditions: ['diabetes', 'hypertension'],
            gender: 'male',
            searchTerm: 'test',
          },
        }),
      { wrapper },
    );
  });

  bench('useMedicalRecords - Large dataset (5000 records)', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    renderHook(() => useMedicalRecords('patient-1'), { wrapper });

    // Simular procesamiento de datos grandes
    act(() => {
      const records = mockMedicalRecords.filter((r) => r.patientId === 'patient-1');
      // Procesar records
      records.sort((a, b) => b.date.getTime() - a.date.getTime());
    });
  });

  bench('usePrescriptions - Concurrent updates', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => usePrescriptions('patient-1'), { wrapper });

    // Simular múltiples actualizaciones concurrentes
    const updates = Array.from({ length: 10 }, (_, i) =>
      act(() => {
        if (result.current.addPrescription) {
          result.current.addPrescription({
            medication: `Med ${i}`,
            dosage: '100mg',
            frequency: 'daily',
          });
        }
      }),
    );

    await Promise.all(updates);
  });

  bench('useVitalSigns - Real-time updates simulation', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useVitalSigns('patient-1'), { wrapper });

    // Simular actualizaciones en tiempo real
    for (let i = 0; i < 100; i++) {
      act(() => {
        if (result.current.updateVitalSign) {
          result.current.updateVitalSign({
            heartRate: 60 + Math.random() * 40,
            bloodPressure: {
              systolic: 110 + Math.random() * 30,
              diastolic: 70 + Math.random() * 20,
            },
            temperature: 36 + Math.random() * 2,
            timestamp: new Date(),
          });
        }
      });
    }
  });

  bench('Cache performance - Multiple hooks same data', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    // Renderizar múltiples hooks que acceden a los mismos datos
    const hooks = Array.from({ length: 10 }, () =>
      renderHook(() => usePatients({ limit: 20 }), { wrapper }),
    );

    // Verificar que el cache funciona eficientemente
    hooks.forEach((hook) => {
      expect(hook.result.current.isLoading).toBe(false);
    });
  });

  bench('Data transformation performance', () => {
    const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      value: Math.random(),
      nested: {
        deep: {
          value: Math.random(),
        },
      },
    }));

    // Transformaciones comunes en hooks médicos
    const transformed = largeDataset
      .filter((item) => item.value > 0.5)
      .map((item) => ({
        ...item,
        computed: item.value * item.nested.deep.value,
      }))
      .sort((a, b) => b.computed - a.computed)
      .slice(0, 100);

    expect(transformed).toHaveLength(100);
  });

  bench('Memoization effectiveness', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    const { result, rerender } = renderHook(({ patientId }) => useMedicalRecords(patientId), {
      wrapper,
      initialProps: { patientId: 'patient-1' },
    });

    // Re-renderizar con los mismos props múltiples veces
    for (let i = 0; i < 100; i++) {
      rerender({ patientId: 'patient-1' });
    }

    // El hook debe usar memoización para evitar re-computaciones
    expect(result.current).toBeDefined();
  });

  bench('Optimistic updates performance', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => usePrescriptions('patient-1'), { wrapper });

    // Simular actualización optimista
    act(() => {
      if (result.current.updatePrescriptionOptimistic) {
        result.current.updatePrescriptionOptimistic({
          id: 'prescription-1',
          status: 'active',
        });
      }
    });

    // Simular rollback en caso de error
    act(() => {
      if (result.current.rollbackOptimisticUpdate) {
        result.current.rollbackOptimisticUpdate('prescription-1');
      }
    });
  });
});

describe('Memory Performance', () => {
  bench('Memory usage - Large patient list', () => {
    const patients = Array.from({ length: 10000 }, (_, i) => ({
      id: `patient-${i}`,
      name: `Patient ${i}`,
      medicalHistory: Array.from({ length: 100 }, () => ({
        date: new Date(),
        diagnosis: 'Diagnosis',
        treatment: 'Treatment',
      })),
    }));

    // Simular procesamiento que podría causar memory leaks
    const processed = patients.map((p) => ({
      ...p,
      computed: p.medicalHistory.length,
    }));

    // Limpiar referencias
    patients.length = 0;
    expect(processed).toHaveLength(10000);
  });

  bench('Cleanup performance - Hook unmounting', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: new QueryClient() }, children);

    const hooks = Array.from({ length: 100 }, () => renderHook(() => usePatients(), { wrapper }));

    // Desmontar todos los hooks
    hooks.forEach((hook) => hook.unmount());
  });
});
