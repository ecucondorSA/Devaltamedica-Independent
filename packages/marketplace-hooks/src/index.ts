// packages/marketplace-hooks/src/index.ts

export const useDoctorProfile = () => {
  return {
    profile: {
      name: 'Dr. Juan Perez',
      specialty: 'Cardiología',
      license: '12345',
      // ... otros datos del perfil
    },
    loading: false,
    error: null,
  };
};

export const useMarketplaceJobs = (params?: any) => {
  return {
    jobs: [],
    loading: false,
    error: null,
    searchJobs: (query: string) => {},
    filterJobs: (filters: any) => {},
    applyToJob: (jobId: string) => Promise.resolve(),
  };
};

export const useJobApplications = () => {
  return {
    applications: [],
    loading: false,
    error: null,
    updateApplication: (id: string, data: any) => Promise.resolve(),
  };
};