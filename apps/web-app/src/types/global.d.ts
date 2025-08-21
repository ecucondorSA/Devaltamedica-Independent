/// <reference types="react" />
/// <reference types="node" />

declare module '@/components/*';
declare module '@/contexts/*';

// MercadoPago Types
interface MercadoPagoConstructor {
  new (publicKey: string): MercadoPago;
}

interface MercadoPago {
  bricks(): {
    create: (component: string, containerId: string, settings: any) => Promise<any>;
  };
  checkout: any;
  // Add more methods as needed
}

declare global {
  interface Window {
    MercadoPago: MercadoPagoConstructor;
  }
}

// Leaflet extensions
declare module 'leaflet' {
  namespace Icon {
    interface Default {
      _getIconUrl?: string;
    }
  }
}

// Module declarations for missing packages
declare module '@altamedica/firebase' {
  export const auth: any;
  export const db: any;
  export const storage: any;
  export const analytics: any;
  export const initializeFirebase: () => void;
}

declare module '@altamedica/api-client/hooks' {
  export * from '@altamedica/api-client';
}

declare module '@altamedica/diagnostic-engine/dist/types' {
  export interface DiagnosticResult {
    diagnosis: string;
    confidence: number;
    recommendations: string[];
  }
}

declare module 'leaflet/dist/leaflet.css' {
  const content: any;
  export default content;
}

declare module '@testing-library/react' {
  export const render: any;
  export const screen: any;
  export const waitFor: any;
  export const fireEvent: any;
}

// Extend HTMLDivElement for Leaflet
interface HTMLDivElement {
  _leaflet_id?: number;
}

export {};