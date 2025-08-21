import { useState, useCallback, useEffect } from 'react';
import { Prescription } from '../types';

export function usePrescriptions(options: { initialFetch?: boolean } = {}) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<unknown>(null);

  const searchPrescriptions = useCallback(async (filters: Record<string, unknown> = {}) => {
    setLoading(true);
    setError(null);
    try {
      // Aquí iría la llamada real a la API
      // Simulación de datos
      const mock: Prescription[] = [
        {
          id: '1',
          medicationName: 'Paracetamol',
          dosage: '500mg',
          frequency: '2/día',
          instructions: 'Tomar después de las comidas.',
          prescribedBy: 'Dra. López',
          date: '2024-07-01',
          status: 'active',
          attachments: [],
        },
      ];
      setPrescriptions(mock);
      setPagination({ page: 1, totalPages: 1, total: 1 });
    } catch (e) {
      setError('Error al cargar prescripciones');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch inicial si se requiere
  useEffect(() => {
    if (options.initialFetch) {
      void searchPrescriptions();
    }
  }, [options.initialFetch, searchPrescriptions]);

  return { prescriptions, loading, error, pagination, searchPrescriptions };
}

export function usePrescription(id: string) {
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrescription = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Aquí iría la llamada real a la API
      // Simulación de datos
      setPrescription({
        id,
        medicationName: 'Paracetamol',
        dosage: '500mg',
        frequency: '2/día',
        instructions: 'Tomar después de las comidas.',
        prescribedBy: 'Dra. López',
        date: '2024-07-01',
        status: 'active',
        attachments: [],
      });
    } catch (e) {
      setError('Error al cargar prescripción');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Fetch inicial
  useEffect(() => {
    void fetchPrescription();
  }, [fetchPrescription]);

  return { prescription, loading, error };
}
