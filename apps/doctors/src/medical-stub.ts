// Stub temporal para @altamedica/medical hasta que se resuelva el problema de resolución de módulos

export const useMedicalData = () => {
  return {
    data: null,
    isLoading: false,
    error: null,
    refetch: () => Promise.resolve(),
  };
};

export const useMedicalRecords = () => {
  return {
    records: [],
    isLoading: false,
    error: null,
    refetch: () => Promise.resolve(),
  };
};
