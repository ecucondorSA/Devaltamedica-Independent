import { useState, useEffect } from 'react';

/**
 * Mock hook for medical records - to be replaced with actual implementation
 */
export function useMedicalRecords(patientId?: string) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!patientId) return;

    setLoading(true);
    // Mock implementation - replace with actual API call
    setTimeout(() => {
      setRecords([
        {
          id: '1',
          patientId,
          date: new Date().toISOString(),
          type: 'consultation',
          description: 'General consultation'
        }
      ]);
      setLoading(false);
    }, 100);
  }, [patientId]);

  return { records, loading, error };
}

export default useMedicalRecords;