// Stub temporal para @altamedica/marketplace-hooks hasta que se resuelva el problema de resolución de módulos

export const useMarketplaceJobs = () => {
  return {
    jobs: [],
    isLoading: false,
    error: null,
    searchJobs: () => Promise.resolve(),
  };
};

export const useJobApplications = (userId?: string) => {
  return {
    applications: [],
    isLoading: false,
    error: null,
    submitApplication: () => Promise.resolve(),
  };
};
