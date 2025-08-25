// Stub temporal para @altamedica/api-client hasta que se resuelva el problema de resolución de módulos

export const useAppointments = () => {
  return {
    appointments: [],
    isLoading: false,
    error: null,
    refetch: () => Promise.resolve(),
  };
};

export const usePatients = () => {
  return {
    patients: [],
    isLoading: false,
    error: null,
    refetch: () => Promise.resolve(),
  };
};
