/**
 * @altamedica/ui/corporate - Componentes corporativos especializados
 *
 * Estos componentes implementan el design system corporativo de AltaMedica
 * con variantes médicas específicas y estados avanzados.
 */

// ButtonCorporate exports
export { default as ButtonCorporate } from './ButtonCorporate';
export type { ButtonCorporateProps, ButtonVariant, ButtonSize } from './ButtonCorporate';

// CardCorporate exports - FIXING CRITICAL MISSING EXPORTS
export {
  CardCorporate,
  CardHeaderCorporate,
  CardContentCorporate,
  CardFooterCorporate,
} from './CardCorporate';
export type {
  CardCorporateProps,
  CardHeaderProps,
  CardContentProps,
  CardFooterProps,
  CardVariant,
  CardSize,
} from './CardCorporate';
