import { useMemo } from 'react';

export type ReactRef<T> = 
  | React.RefCallback<T>
  | React.RefObject<T>
  | React.MutableRefObject<T>
  | null
  | undefined;

/**
 * Combina múltiples refs en una sola función de callback ref
 * Útil cuando necesitas usar forwardRef junto con refs internos
 */
export const useMergeRefs = <T = any>(
  ...refs: Array<ReactRef<T>>
): React.RefCallback<T> => {
  return useMemo(
    () => (node: T | null) => {
      refs.forEach((ref) => {
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref != null) {
          (ref as React.MutableRefObject<T | null>).current = node;
        }
      });
    },
    refs
  );
};

/**
 * Versión que acepta refs opcionales y maneja null/undefined de forma segura
 */
export const useMergeRefsSafe = <T = any>(
  ...refs: Array<ReactRef<T> | null | undefined>
): React.RefCallback<T> => {
  return useMemo(
    () => (node: T | null) => {
      refs
        .filter((ref): ref is NonNullable<ReactRef<T>> => ref != null)
        .forEach((ref) => {
          try {
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref && 'current' in ref) {
              (ref as React.MutableRefObject<T | null>).current = node;
            }
          } catch (error) {
            logger.warn('Error setting ref:', error);
          }
        });
    },
    refs
  );
};

/**
 * Utilidad para crear un ref combinado sin el hook (útil fuera de componentes)
 */
export const mergeRefs = <T = any>(
  ...refs: Array<ReactRef<T>>
): React.RefCallback<T> => {
  return (node: T | null) => {
    refs.forEach((ref) => {
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref != null) {
        (ref as React.MutableRefObject<T | null>).current = node;
      }
    });
  };
};

/**
 * Hook que devuelve tanto el ref combinado como el elemento actual
 */
export const useMergeRefsWithValue = <T = any>(
  ...refs: Array<ReactRef<T>>
): [React.RefCallback<T>, T | null] => {
  const [currentNode, setCurrentNode] = React.useState<T | null>(null);
  
  const mergedRef = useMemo(
    () => (node: T | null) => {
      setCurrentNode(node);
      refs.forEach((ref) => {
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref != null) {
          (ref as React.MutableRefObject<T | null>).current = node;
        }
      });
    },
    refs
  );

  return [mergedRef, currentNode];
};

// Import React for useState in the last hook
import React from 'react';
import { logger } from '@altamedica/shared/services/logger.service';