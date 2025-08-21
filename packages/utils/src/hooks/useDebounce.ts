import { useState, useEffect, useCallback } from "react";

// ==================== USE DEBOUNCE HOOK ====================

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ==================== USE DEBOUNCE CALLBACK ====================

export function useDebounceCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      const timer = setTimeout(() => {
        callback(...args);
      }, delay);

      setDebounceTimer(timer);
    },
    [callback, delay, debounceTimer]
  ) as T;

  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return debouncedCallback;
}

// ==================== USE DEBOUNCE SEARCH ====================

export function useDebounceSearch(
  initialValue: string = "",
  delay: number = 300
): [string, string, (value: string) => void] {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const debouncedSearchTerm = useDebounce(searchTerm, delay);

  return [searchTerm, debouncedSearchTerm, setSearchTerm];
}

// ==================== USE DEBOUNCE SCROLL ====================

export function useDebounceScroll(
  delay: number = 100
): [number, (value: number) => void] {
  const [scrollPosition, setScrollPosition] = useState(0);
  const debouncedScrollPosition = useDebounce(scrollPosition, delay);

  return [debouncedScrollPosition, setScrollPosition];
}

// ==================== USE DEBOUNCE RESIZE ====================

export function useDebounceResize(
  delay: number = 250
): [
  { width: number; height: number },
  (dimensions: { width: number; height: number }) => void,
] {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const debouncedDimensions = useDebounce(dimensions, delay);

  return [debouncedDimensions, setDimensions];
}

// ==================== USE DEBOUNCE API CALL ====================

export function useDebounceApiCall<T>(
  apiCall: (params: any) => Promise<T>,
  delay: number = 500
): [(params: any) => void, T | null, boolean, string | null] {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  const debouncedApiCall = useCallback(
    (params: any) => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      const timer = setTimeout(async () => {
        try {
          setLoading(true);
          setError(null);
          const result = await apiCall(params);
          setData(result);
        } catch (err) {
          setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
          setLoading(false);
        }
      }, delay);

      setDebounceTimer(timer);
    },
    [apiCall, delay, debounceTimer]
  );

  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return [debouncedApiCall, data, loading, error];
}

// ==================== USE DEBOUNCE FORM ====================

export function useDebounceForm<T extends Record<string, any>>(
  initialValues: T,
  delay: number = 300
): [T, T, (values: Partial<T>) => void, () => void] {
  const [formValues, setFormValues] = useState<T>(initialValues);
  const debouncedFormValues = useDebounce(formValues, delay);

  const updateForm = useCallback((values: Partial<T>) => {
    setFormValues((prev) => ({ ...prev, ...values }));
  }, []);

  const resetForm = useCallback(() => {
    setFormValues(initialValues);
  }, [initialValues]);

  return [formValues, debouncedFormValues, updateForm, resetForm];
}

// ==================== USE DEBOUNCE VALIDATION ====================

export function useDebounceValidation<T>(
  validator: (value: T) => string | null,
  delay: number = 300
): [(value: T) => void, string | null, boolean] {
  const [value, setValue] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  const validate = useCallback(
    (newValue: T) => {
      setValue(newValue);
      setIsValidating(true);

      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      const timer = setTimeout(() => {
        const validationError = validator(newValue);
        setError(validationError);
        setIsValidating(false);
      }, delay);

      setDebounceTimer(timer);
    },
    [validator, delay, debounceTimer]
  );

  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return [validate, error, isValidating];
}

// ==================== USE DEBOUNCE AUTO SAVE ====================

export function useDebounceAutoSave<T>(
  saveFunction: (data: T) => Promise<void>,
  delay: number = 1000
): [(data: T) => void, boolean, string | null] {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  const autoSave = useCallback(
    (data: T) => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      const timer = setTimeout(async () => {
        try {
          setSaving(true);
          setError(null);
          await saveFunction(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Auto-save failed");
        } finally {
          setSaving(false);
        }
      }, delay);

      setDebounceTimer(timer);
    },
    [saveFunction, delay, debounceTimer]
  );

  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return [autoSave, saving, error];
}