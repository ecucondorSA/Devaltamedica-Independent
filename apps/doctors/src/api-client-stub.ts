// Stub temporal para @altamedica/api-client hasta que se resuelva el problema de resolución de módulos

export const useAppointments = () => {
  return {
    data: [],
    appointments: [], // Keep for backward compatibility
    isLoading: false,
    error: null,
    refetch: () => Promise.resolve(),
  };
};

export const usePatients = () => {
  return {
    data: [],
    patients: [], // Keep for backward compatibility
    isLoading: false,
    error: null,
    refetch: () => Promise.resolve(),
  };
};

// Add missing exports for compatibility
export const useAppointment = () => useAppointments();
export const useAvailableSlots = () => ({ data: [], isLoading: false, error: null });
export const useCancelAppointment = () => ({ mutate: () => {}, isLoading: false });
export const useCompleteAppointment = () => ({ mutate: () => {}, isLoading: false });
export const useConfirmAppointment = () => ({ mutate: () => {}, isLoading: false });
export const useCreateAppointment = () => ({ mutate: () => {}, isLoading: false });
export const useRescheduleAppointment = () => ({ mutate: () => {}, isLoading: false });
export const useUpdateAppointment = () => ({ mutate: () => {}, isLoading: false });
