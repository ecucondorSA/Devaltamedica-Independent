/**
 * 🏥 TIPOS DEL DASHBOARD DE RED HOSPITALARIA
 * Interfaces y tipos centralizados para el sistema de gestión hospitalaria
 */

export interface DashboardProps {
  hospitalId: string;
  config: {
    whatsapp: { enabled: boolean; phoneNumber: string; apiKey: string; };
    api: { enabled: boolean; endpoint: string; apiKey: string; };
    iot: { enabled: boolean; devices: string[]; };
  };
}

export interface NetworkStatus {
  healthy: number;
  warning: number;
  critical: number;
  total: number;
}

export interface RedistributionSuggestion {
  id: string;
  fromHospitalId: string;
  fromHospitalName: string;
  toHospitalId: string;
  toHospitalName: string;
  patientsToTransfer: number;
  estimatedTime: number; // minutes
  priority: 'critical' | 'high' | 'medium' | 'low';
  reason: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  createdAt: Date;
}

export interface StaffShortage {
  id: string;
  hospitalId: string;
  hospitalName: string;
  specialty: string;
  currentStaff: number;
  requiredStaff: number;
  shortage: number;
  severity: 'critical' | 'urgent' | 'moderate';
  impactDescription: string;
  estimatedWaitIncrease: number; // percentage
  suggestedActions: string[];
  autoJobPostingTriggered: boolean;
  detectedAt: Date;
}

export interface JobPosting {
  id: string;
  shortageId: string;
  title: string;
  specialty: string;
  hospitalName: string;
  urgencyLevel: 'critical' | 'urgent' | 'moderate';
  positions: number;
  salaryRange: string;
  benefits: string[];
  requirements: string[];
  status: 'draft' | 'published' | 'applications_open' | 'filled';
  postedAt: Date;
  applicationsCount: number;
}

export interface DashboardState {
  metrics: any | null;
  networkStatus: NetworkStatus;
  loading: boolean;
  lastUpdate: Date;
  dataSource: 'whatsapp' | 'api' | 'iot' | 'mixed';
  redistributionSuggestions: RedistributionSuggestion[];
  activeRedistributions: Set<string>;
  staffShortages: StaffShortage[];
  jobPostings: JobPosting[];
  autoRedistributionEnabled: boolean;
  autoJobPostingEnabled: boolean;
  emergencyMode: boolean;
  showMapView: boolean;
  mapHospitals: any[];
  selectedHospitalOnMap: any | null;
  expandedSections: {
    redistribution: boolean;
    staffShortages: boolean;
    jobPostings: boolean;
    metrics: boolean;
    controls: boolean;
  };
  isDarkMode: boolean;
  isCompactView: boolean;
}

export interface RedistributionAction {
  type: 'START_REDISTRIBUTION' | 'STOP_REDISTRIBUTION' | 'UPDATE_STATUS';
  payload: {
    suggestionId: string;
    status?: 'executing' | 'completed' | 'failed';
    metadata?: any;
  };
}

export interface StaffShortageAction {
  type: 'CREATE_JOB_POSTING' | 'UPDATE_SHORTAGE' | 'TRIGGER_AUTO_POSTING';
  payload: {
    shortageId: string;
    jobPosting?: Partial<JobPosting>;
    metadata?: any;
  };
}

export interface DashboardAction {
  type: 'TOGGLE_SECTION' | 'TOGGLE_MODE' | 'UPDATE_METRICS';
  payload: {
    section?: keyof DashboardState['expandedSections'];
    mode?: 'dark' | 'compact';
    metrics?: any;
  };
}
