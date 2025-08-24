/**
 * @fileoverview Exports para componentes de emergencia médica
 * @module @altamedica/ui/emergency
 */

export { EmergencyBanner } from './EmergencyBanner';
export type { EmergencyBannerProps } from './EmergencyBanner';

export { EmergencyProtocol } from './EmergencyProtocol';

// Re-export legacy default if consumers import default
export { default as EmergencyBannerDefault } from './EmergencyBanner';
export type { EmergencyProtocolProps, ProtocolStep } from './EmergencyProtocol';

export { EmergencyButton } from './EmergencyButton';
export type { EmergencyButtonProps, EmergencyType } from './EmergencyButton';
