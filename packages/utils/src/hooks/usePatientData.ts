import { useState, useEffect } from 'react';

/**
 * Mock hook for patient data - to be replaced with actual implementation
 */
export function usePatientData(patientId?: string) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!patientId) return;

    setLoading(true);
    // Mock implementation - replace with actual API call
    setTimeout(() => {
      setData({
        id: patientId,
        name: 'Patient Name',
        age: 30,
        // Add more patient fields as needed
      });
      setLoading(false);
    }, 100);
  }, [patientId]);

  return { data, loading, error };
}

export default usePatientData;