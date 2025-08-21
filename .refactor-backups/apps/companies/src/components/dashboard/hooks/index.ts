/**
 * Dashboard Hooks Index
 * Barrel export for all custom dashboard hooks
 */

export { useRedistributionLogic } from './useRedistributionLogic';
export { useJobPostingLogic } from './useJobPostingLogic';
export { useNetworkStatusLogic } from './useNetworkStatusLogic';
export { useEmergencyModeLogic } from './useEmergencyModeLogic';

export type { 
  RedistributionSuggestion, 
  StaffShortage 
} from './useRedistributionLogic';

export type { 
  JobPosting 
} from './useJobPostingLogic';

export type { 
  MapHospital, 
  NetworkMetrics 
} from './useNetworkStatusLogic';

export type { 
  EmergencyActions, 
  EmergencyMetrics 
} from './useEmergencyModeLogic';