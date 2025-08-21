// ==================== UTILITY HOOKS ====================

// Debounce hooks
export * from './useDebounce';

// Storage hooks
export * from './useLocalStorage';

// Media query hooks
export * from './useMediaQuery';

// ==================== RE-EXPORTS FOR CONVENIENCE ====================

// Most commonly used hooks
export {
  useDebounce,
  useDebounceSearch,
  useDebounceCallback,
} from './useDebounce';

export {
  useLocalStorage,
  useSessionStorage,
  usePatientData,
  useMedicalRecords,
} from './useLocalStorage';

export {
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useBreakpoint,
  useViewportSize,
  useDeviceInfo,
} from './useMediaQuery';