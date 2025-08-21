// Minimal ambient module to satisfy TS in this workspace
declare module '@altamedica/marketplace-hooks' {
  export function useCompanyProfile(companyId: string): any;
  export function useMarketplaceJobs(): any;
  export function useJobApplications(companyId: string): any;
  export function useDoctorSearch(): any;
}
