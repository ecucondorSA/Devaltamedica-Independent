import { useCallback, useRef } from 'react';

export type CallbackRefHandler<T> = (node: T | null) => void;

/**
 * Hook que combina useRef y useCallback para crear refs que ejecutan callbacks
 * cuando el elemento cambia. Útil para medir elementos DOM o configurar observers.
 */
export const useCallbackRef = <T extends Element = Element>(
  callback?: (node: T | null) => void | (() => void)
): [T | null, CallbackRefHandler<T>] => {
  const ref = useRef<T | null>(null);
  const cleanupRef = useRef<(() => void) | void>();

  const setRef = useCallback(
    (node: T | null) => {
      // Cleanup previous callback if it returned a cleanup function
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = undefined;
      }

      // Update ref
      ref.current = node;

      // Call callback with new node
      if (callback) {
        const cleanup = callback(node);
        if (typeof cleanup === 'function') {
          cleanupRef.current = cleanup;
        }
      }
    },
    [callback]
  );

  return [ref.current, setRef];
};

/**
 * Hook que combina múltiples refs en uno solo
 * Útil cuando necesitas usar tanto forwardRef como un ref interno
 */
export const useCombinedRefs = <T extends Element = Element>(
  ...refs: Array<React.RefObject<T> | CallbackRefHandler<T> | null | undefined>
): CallbackRefHandler<T> => {
  return useCallback(
    (node: T | null) => {
      refs.forEach(ref => {
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref && 'current' in ref) {
          (ref as React.MutableRefObject<T | null>).current = node;
        }
      });
    },
    refs
  );
};

/**
 * Hook que crea un callback ref con memoización
 * El callback solo se ejecuta cuando el elemento DOM realmente cambia
 */
export const useMemoizedCallbackRef = <T extends Element = Element>(
  callback?: (node: T | null) => void | (() => void),
  deps?: React.DependencyList
): CallbackRefHandler<T> => {
  const callbackRef = useRef(callback);
  const cleanupRef = useRef<(() => void) | void>();
  const nodeRef = useRef<T | null>(null);

  // Update callback ref when dependencies change
  const memoizedCallback = useCallback(() => {
    return callback;
  }, deps || []);

  callbackRef.current = memoizedCallback();

  return useCallback((node: T | null) => {
    // Only execute if node actually changed
    if (nodeRef.current === node) {
      return;
    }

    // Cleanup previous
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = undefined;
    }

    // Update node ref
    nodeRef.current = node;

    // Execute callback
    if (callbackRef.current) {
      const cleanup = callbackRef.current(node);
      if (typeof cleanup === 'function') {
        cleanupRef.current = cleanup;
      }
    }
  }, []);
};