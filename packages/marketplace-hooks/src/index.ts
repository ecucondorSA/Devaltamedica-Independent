export const useMarketplace = () => {
  return {
    doctors: [],
    companies: [],
    selectedDoctor: null,
    selectedCompany: null,
    filters: {},
    setFilters: () => {},
    setSelectedDoctor: () => {},
    setSelectedCompany: () => {},
  };
};

export const useMatching = () => {
  return {
    matchedProfiles: [],
    isMatching: false,
    performMatching: () => Promise.resolve([]),
  };
};

export const useMarketplaceNotifications = () => {
  return {
    notifications: [],
    unreadCount: 0,
    markAsRead: () => {},
  };
};

export const useCompanyProfile = () => {
  return {
    company: null,
    isLoading: false,
    error: null,
  };
};

export const useDoctorSearch = () => {
  return {
    doctors: [],
    isSearching: false,
    search: () => {},
  };
};

export const useJobApplications = () => {
  return {
    applications: [],
    isLoading: false,
    submitApplication: () => Promise.resolve(),
  };
};

export const useMarketplaceJobs = () => {
  return {
    jobs: [],
    isLoading: false,
    createJob: () => Promise.resolve(),
    updateJob: () => Promise.resolve(),
    deleteJob: () => Promise.resolve(),
  };
};
