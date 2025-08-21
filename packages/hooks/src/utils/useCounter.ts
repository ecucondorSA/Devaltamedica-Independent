/**
 * @fileoverview Hook useCounter para contadores
 */

import { useState, useCallback } from 'react';
import type { CounterActions } from './types';

export function useCounter(
  initialValue: number = 0,
  options: { min?: number; max?: number } = {}
): [number, CounterActions] {
  const { min, max } = options;
  const [count, setCount] = useState(initialValue);

  const increment = useCallback((step: number = 1) => {
    setCount(prev => {
      const newValue = prev + step;
      if (max !== undefined && newValue > max) return max;
      return newValue;
    });
  }, [max]);

  const decrement = useCallback((step: number = 1) => {
    setCount(prev => {
      const newValue = prev - step;
      if (min !== undefined && newValue < min) return min;
      return newValue;
    });
  }, [min]);

  const reset = useCallback(() => setCount(initialValue), [initialValue]);
  
  const set = useCallback((value: number) => {
    setCount(() => {
      if (min !== undefined && value < min) return min;
      if (max !== undefined && value > max) return max;
      return value;
    });
  }, [min, max]);

  return [count, { increment, decrement, reset, set }];
}