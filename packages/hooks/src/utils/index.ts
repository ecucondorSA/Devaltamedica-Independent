/**
 * @fileoverview Hooks utilitarios generales
 * @module @altamedica/hooks/utils
 * @description Hooks de utilidad general para funcionalidades comunes
 */

// Re-exports consolidados de hooks utilitarios
export { useDebounce } from './useDebounce';
export { useLocalStorage } from './useLocalStorage';
export { useMediaQuery } from './useMediaQuery';
export { useAsync } from './useAsync';
export { useInterval } from './useInterval';
export { useTimeout } from './useTimeout';
export { usePrevious } from './usePrevious';
export { useToggle } from './useToggle';
export { useCounter } from './useCounter';
export { useCopyToClipboard } from './useCopyToClipboard';

// Hooks para hidratación SSR-safe (migrados desde companies app)
export {
  useIsClient,
  useHydrationSafe,
  useHydrationSafeLocalStorage,
  useHydrationSafeSessionStorage,
  useHydrationSafeWindow,
  useHydrationSafeDocument
} from './useHydrationSafe';

// Hooks de performance optimizada (migrados desde patients app)
export {
  useLazyComponent,
  useIntersectionObserver,
  useOptimizedState,
  usePrefetch,
  usePerformanceMonitor,
  useThrottle,
  useWhyDidYouUpdate,
  useLazyLoad,
  useImageOptimization
} from './useOptimizedPerformance';

// Tipos para los hooks utilitarios
export type {
  DebounceOptions,
  LocalStorageOptions,
  MediaQueryOptions,
  AsyncState,
  AsyncOptions,
  IntervalOptions,
  TimeoutOptions,
  ToggleActions,
  CounterActions,
  CopyToClipboardResult
} from './types';