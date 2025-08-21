export interface Company {
  id: string;
  name: string;
  description?: string;
  industry?: string;
  size?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  website?: string;
  logoUrl?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  isVerified: boolean;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobListing {
  id: string;
  companyId: string;
  title: string;
  description: string;
  department?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
    remote?: boolean;
  };
  employmentType: 'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary';
  salaryRange?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  requirements: string[];
  benefits?: string[];
  skills: string[];
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  status: 'draft' | 'published' | 'paused' | 'closed';
  applicationDeadline?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobApplication {
  id: string;
  listingId: string;
  applicantId: string;
  resumeUrl?: string;
  coverLetter?: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'interviewed' | 'rejected' | 'accepted';
  notes?: string;
  appliedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
}

export interface MarketplaceStats {
  totalCompanies: number;
  activeCompanies: number;
  totalListings: number;
  activeListings: number;
  totalApplications: number;
  recentApplications: number;
}