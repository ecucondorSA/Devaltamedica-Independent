import { useState, useCallback, useRef } from 'react';

export interface UseControllableStateOptions<T> {
  value?: T;
  defaultValue?: T;
  onChange?: (value: T) => void;
}

export interface UseControllableStateReturn<T> {
  value: T;
  setValue: (value: T | ((prevValue: T) => T)) => void;
}

/**
 * Hook que permite crear componentes controlados y no controlados
 * Funciona similar a useState pero acepta props value y onChange
 */
export const useControllableState = <T>(
  options: UseControllableStateOptions<T>
): UseControllableStateReturn<T> => {
  const { value, defaultValue, onChange } = options;
  
  const [internalValue, setInternalValue] = useState<T>(
    value !== undefined ? value : (defaultValue as T)
  );
  
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;
  
  // Track previous controlled value to detect changes
  const prevValueRef = useRef<T | undefined>(value);
  
  // Update internal state when controlled value changes
  if (isControlled && value !== prevValueRef.current) {
    setInternalValue(value);
    prevValueRef.current = value;
  }

  const setValue = useCallback(
    (nextValue: T | ((prevValue: T) => T)) => {
      const resolvedValue = typeof nextValue === 'function'
        ? (nextValue as (prevValue: T) => T)(currentValue)
        : nextValue;

      // Update internal state if not controlled
      if (!isControlled) {
        setInternalValue(resolvedValue);
      }

      // Always call onChange if provided
      onChange?.(resolvedValue);
    },
    [currentValue, isControlled, onChange]
  );

  return {
    value: currentValue,
    setValue,
  };
};

/**
 * Hook simplificado para boolean states controlables
 */
export const useControllableBoolean = (
  options: UseControllableStateOptions<boolean>
): UseControllableStateReturn<boolean> & {
  toggle: () => void;
  setTrue: () => void;
  setFalse: () => void;
} => {
  const { value, setValue } = useControllableState<boolean>({
    ...options,
    defaultValue: options.defaultValue ?? false,
  });

  const toggle = useCallback(() => {
    setValue(prev => !prev);
  }, [setValue]);

  const setTrue = useCallback(() => {
    setValue(true);
  }, [setValue]);

  const setFalse = useCallback(() => {
    setValue(false);
  }, [setValue]);

  return {
    value,
    setValue,
    toggle,
    setTrue,
    setFalse,
  };
};