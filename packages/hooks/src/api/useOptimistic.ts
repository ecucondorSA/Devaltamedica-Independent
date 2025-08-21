/**
 * @fileoverview Hook para updates optimistas
 */

import { useState, useCallback } from 'react';

export interface UseOptimisticOptions<T> {
  initialData?: T;
}

export function useOptimistic<T>(
  data: T,
  options: UseOptimisticOptions<T> = {}
) {
  const [optimisticData, setOptimisticData] = useState<T>(data);
  const [isPending, setIsPending] = useState(false);

  const addOptimistic = useCallback(async <P>(
    action: (data: T) => T,
    asyncOperation: () => Promise<P>
  ): Promise<P> => {
    const newData = action(data);
    setOptimisticData(newData);
    setIsPending(true);

    try {
      const result = await asyncOperation();
      setIsPending(false);
      return result;
    } catch (error) {
      // Revert to original data on error
      setOptimisticData(data);
      setIsPending(false);
      throw error;
    }
  }, [data]);

  return [optimisticData, addOptimistic, isPending] as const;
}