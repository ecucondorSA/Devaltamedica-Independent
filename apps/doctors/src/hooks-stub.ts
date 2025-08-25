// Stub temporal para @altamedica/hooks hasta que se resuelva el problema de resolución de módulos

export const usePatientPredictor = (patientId?: string) => {
  return {
    predictions: [],
    isLoading: false,
    error: null,
    refetch: () => Promise.resolve(),
  };
};

export const usePatientData = (patientId?: string) => {
  return {
    patient: null,
    isLoading: false,
    error: null,
    refetch: () => Promise.resolve(),
  };
};
