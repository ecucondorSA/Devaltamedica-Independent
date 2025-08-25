import { useState, useCallback } from 'react';

export interface Redistribution {
  id: string;
  fromHospital: string;
  toHospital: string;
  patients: number;
  status: 'pending' | 'in_progress' | 'completed';
  timestamp: Date;
}

export function useRedistributionLogic() {
  const [redistributions, setRedistributions] = useState<Redistribution[]>([
    {
      id: '1',
      fromHospital: 'Hospital Central',
      toHospital: 'Hospital Norte',
      patients: 5,
      status: 'in_progress',
      timestamp: new Date(),
    },
  ]);

  const createRedistribution = useCallback((data: Partial<Redistribution>) => {
    const newRedistribution: Redistribution = {
      id: Date.now().toString(),
      fromHospital: data.fromHospital || '',
      toHospital: data.toHospital || '',
      patients: data.patients || 1,
      status: 'pending',
      timestamp: new Date(),
    };

    setRedistributions((prev) => [...prev, newRedistribution]);
    return newRedistribution;
  }, []);

  const updateRedistributionStatus = useCallback((id: string, status: Redistribution['status']) => {
    setRedistributions((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }, []);

  return {
    redistributions,
    createRedistribution,
    updateRedistributionStatus,
    totalActiveRedistributions: redistributions.filter((r) => r.status !== 'completed').length,
  };
}
