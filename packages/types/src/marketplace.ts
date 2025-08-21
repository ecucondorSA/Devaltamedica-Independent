/**
 * Marketplace domain types for companies and doctors
 * Centralized definitions to avoid drift across apps
 */

// Reusable coordinate tuple without importing leaflet in the types package
export type Coordinates = [number, number];

export type MarketplaceWorkArrangement = 'remote' | 'hybrid' | 'on_site' | 'flexible';
export type MarketplaceDoctorVerificationStatus = 'verified' | 'pending' | 'unverified';

export interface MarketplaceDoctorService {
  id: string;
  title: string;
  description: string;
  category: 'consultation' | 'procedure' | 'second_opinion' | 'training';
  price: {
    amount: number;
    currency: 'USD' | 'ARS' | 'EUR';
    type: 'per_hour' | 'per_session' | 'fixed_price';
  };
  availability?: {
    schedule?: string;
    timeSlots?: string[];
  };
  deliveryMethod: 'telemedicine' | 'in_person' | 'hybrid';
  postedDate?: string;
  isActive?: boolean;
}

export interface MarketplaceDoctor {
  id: string;
  name: string;
  specialties: string[];
  location: {
    city: string;
    country: string;
    coordinates: Coordinates;
  };
  rating: number;
  experience: number; // years
  hourlyRate: number;
  availableForHiring: boolean;
  responseTime: number; // hours
  totalHires: number;
  isUrgentAvailable: boolean;
  profileImage?: string;
  isOnline: boolean;
  lastActive: string; // ISO date
  workArrangement: MarketplaceWorkArrangement;
  languages: string[];
  verificationStatus: MarketplaceDoctorVerificationStatus;
  publishedServices?: MarketplaceDoctorService[];
  offersDirectServices?: boolean;
}

export type MarketplaceCompanyType = 'hospital' | 'clinic' | 'laboratory' | 'pharmacy' | 'other';

export interface MarketplaceJobOffer {
  id: string;
  title: string;
  company: string;
  companyId: string;
  location: string;
  specialty: string;
  type: 'job' | 'contract' | 'consultation' | 'partnership';
  salary: string; // human readable
  postedDate: string; // ISO date
  applications: number;
  rating: number;
  urgent?: boolean;
  description: string;
  requirements: string[];
  benefits: string[];
  experience: string; // human readable
  schedule: string;
  remote?: boolean;
  status?: 'active' | 'paused' | 'closed';
}

export interface MarketplaceCompany {
  id: string;
  name: string;
  industry: string;
  location: {
    city: string;
    country: string;
    coordinates: Coordinates;
  };
  rating: number;
  size?: string;
  activeJobs: number;
  urgentJobs: number;
  isActivelyHiring: boolean;
  averageResponseTime: number; // hours
  totalHires: number;
  companyType: MarketplaceCompanyType;
  jobs?: MarketplaceJobOffer[];
}
