// Redirected to unified implementation
// Temporalmente exportamos un stub hasta que el path esté disponible
// export * from '@altamedica/hooks/medical/usePrescriptions';
// export { usePrescriptions as default } from '@altamedica/hooks/medical/usePrescriptions';

// Stub temporal para permitir compilación
export const usePrescriptions = () => ({
  data: [],
  isLoading: false,
  error: null,
  refetch: () => Promise.resolve(),
});

export default usePrescriptions;

// Hook individual para detalle de prescripción
export interface Prescription {
  id: string;
  medication?: string;
  [key: string]: unknown;
}

export function usePrescription(id: string) {
  const prescription: Prescription | null = id ? { id } : null;
  return {
    prescription,
    loading: false,
    error: null,
  };
}
