/**
 * @fileoverview Hook useToggle para valores booleanos
 */

import { useState, useCallback } from 'react';
import type { ToggleActions } from './types';

export function useToggle(initialValue: boolean = false): [boolean, ToggleActions] {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => setValue(prev => !prev), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);
  const setToggleValue = useCallback((value: boolean) => setValue(value), []);

  return [
    value,
    {
      toggle,
      setTrue,
      setFalse,
      setValue: setToggleValue
    }
  ];
}