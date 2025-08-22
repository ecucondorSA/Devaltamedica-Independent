/**
 * @fileoverview Hooks de UI centralizados
 * @module @altamedica/hooks/ui
 * @description Hooks para interacciones de UI, componentes y experiencia de usuario
 */

// Hooks de interacción básica
export { useDisclosure } from './useDisclosure';
export { useModal } from './useModal';
export { useToast } from './useToast';
export { useClipboard } from './useClipboard';

// Hooks de navegación y routing
export { useRouter } from './useRouter';
export { useBreadcrumbs } from './useBreadcrumbs';
export { useParams } from './useParams';

// Hooks de estado visual
export { useTheme } from './useTheme';
export { useColor } from './useColor';
export { useBreakpoint } from './useBreakpoint';
export { useSize } from './useSize';

// Hooks de animación y transiciones
export { useAnimation } from './useAnimation';
export { useSpring } from './useSpring';
export { useScroll } from './useScroll';

// Hooks de interacción avanzada
export { useDragDrop } from './useDragDrop';
export { useResizable } from './useResizable';
export { useHotkeys } from './useHotkeys';
export { useEventListener } from './useEventListener';

// Hooks de estado de componentes
export { useControllableState } from './useControllableState';
export { useCallbackRef } from './useCallbackRef';
export { useMergeRefs } from './useMergeRefs';

// Hooks médicos especializados
export { useMedicalTheme } from './useMedicalTheme';
export { useMedicalDashboard } from './useMedicalDashboard';
export { useTelemedicineUI } from './useTelemedicineUI';

// Hooks de accesibilidad
export { useAccessibility } from './useAccessibility';

// Hooks de debugging CSS (migrado desde companies app)
// export { useCSSDebugger } from './useCSSDebugger';

// Tipos principales
export type { DisclosureState, ModalOptions, ToastOptions, ThemeMode, Breakpoint } from './types';

// Constantes y utilidades
export { BREAKPOINTS, THEME_COLORS, ANIMATION_DURATION } from './constants';
export { DEFAULT_UI_CONFIG } from './config';
