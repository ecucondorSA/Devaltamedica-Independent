/**
 * 🔗 B2C COMMUNICATION TYPES - ALTAMEDICA
 * Tipos TypeScript para comunicación Companies ↔ Doctors
 */

// =====================================
// JOB APPLICATIONS & OFFERS
// =====================================

export interface JobApplication {
  id: string
  jobOfferId: string
  doctorId: string
  companyId: string
  
  // Doctor Information
  doctorProfile: {
    fullName: string
    email: string
    phone: string
    specialties: string[]
    experience: number
    certifications: string[]
    resume?: string
    portfolioUrl?: string
  }
  
  // Application Details
  coverLetter?: string
  expectedSalary?: {
    amount: number
    currency: string
    period: 'hourly' | 'monthly' | 'annual'
  }
  availability: {
    startDate: Date
    schedule: string[]  // ['monday', 'tuesday', etc.]
    isFullTime: boolean
    maxHoursPerWeek?: number
  }
  
  // Status & Timeline
  status: 'pending' | 'reviewing' | 'interview_scheduled' | 'accepted' | 'rejected' | 'withdrawn'
  appliedAt: Date
  reviewedAt?: Date
  interviewDate?: Date
  responseDeadline?: Date
  
  // Communication
  messages: ApplicationMessage[]
  lastMessageAt?: Date
  
  // Metadata
  source: 'direct' | 'marketplace' | 'referral'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  tags?: string[]
  
  createdAt: Date
  updatedAt: Date
}

export interface ApplicationMessage {
  id: string
  applicationId: string
  senderId: string
  senderType: 'company' | 'doctor'
  content: string
  type: 'text' | 'interview_invite' | 'status_update' | 'document_request'
  attachments?: {
    filename: string
    url: string
    type: string
  }[]
  readAt?: Date
  sentAt: Date
}

// =====================================
// INTERVIEW MANAGEMENT
// =====================================

export interface Interview {
  id: string
  applicationId: string
  jobOfferId: string
  doctorId: string
  companyId: string
  
  // Interview Details
  type: 'phone' | 'video' | 'in_person' | 'panel'
  scheduledAt: Date
  duration: number // minutes
  location?: string
  meetingUrl?: string
  meetingId?: string
  
  // Participants
  interviewers: {
    id: string
    name: string
    role: string
    email: string
  }[]
  
  // Status & Results
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled'
  feedback?: {
    overallRating: number // 1-5
    technicalSkills: number
    communicationSkills: number
    culturalFit: number
    notes: string
    recommendation: 'hire' | 'reject' | 'maybe' | 'second_interview'
  }[]
  
  // Scheduling
  proposedTimes: Date[]
  confirmedTime?: Date
  timeZone: string
  remindersSent: Date[]
  
  createdAt: Date
  updatedAt: Date
}

// =====================================
// COMPANY-DOCTOR RELATIONSHIP
// =====================================

export interface CompanyDoctorRelationship {
  id: string
  companyId: string
  doctorId: string
  
  // Relationship Status
  status: 'potential' | 'interviewing' | 'hired' | 'rejected' | 'terminated'
  relationshipType: 'employee' | 'contractor' | 'consultant' | 'volunteer'
  
  // Employment Details
  position?: string
  department?: string
  startDate?: Date
  endDate?: Date
  
  // Communication Preferences
  preferredContactMethod: 'email' | 'phone' | 'sms' | 'app_notification'
  communicationFrequency: 'daily' | 'weekly' | 'monthly' | 'as_needed'
  
  // Interaction History
  interactions: {
    type: 'application' | 'interview' | 'meeting' | 'email' | 'call'
    date: Date
    summary: string
    outcome?: string
  }[]
  
  // Ratings & Reviews
  companyRating?: {
    overall: number
    workEnvironment: number
    management: number
    benefits: number
    growth: number
    notes?: string
  }
  doctorRating?: {
    overall: number
    skills: number
    professionalism: number
    reliability: number
    teamwork: number
    notes?: string
  }
  
  createdAt: Date
  updatedAt: Date
}

// =====================================
// REAL-TIME NOTIFICATIONS
// =====================================

export interface B2CNotification {
  id: string
  recipientId: string
  recipientType: 'company' | 'doctor'
  
  // Notification Content
  type: 'job_application' | 'interview_scheduled' | 'status_update' | 'message' | 'reminder'
  title: string
  message: string
  actionUrl?: string
  
  // Related Entities
  relatedId?: string  // applicationId, interviewId, etc.
  relatedType?: 'application' | 'interview' | 'job_offer' | 'message'
  
  // Status & Metadata
  isRead: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: 'hiring' | 'interview' | 'communication' | 'system'
  
  // Scheduling
  sendAt?: Date
  expiresAt?: Date
  
  createdAt: Date
  readAt?: Date
}

// =====================================
// SEARCH & FILTERING
// =====================================

export interface DoctorSearchFilters {
  // Basic Filters
  specialties?: string[]
  experience?: {
    min?: number
    max?: number
  }
  location?: {
    city?: string
    state?: string
    country?: string
    radius?: number
  }
  
  // Availability Filters
  availableFrom?: Date
  schedulePreference?: ('full_time' | 'part_time' | 'contract' | 'locum')[]
  maxHoursPerWeek?: number
  
  // Qualification Filters
  certifications?: string[]
  education?: string[]
  languages?: string[]
  
  // Preference Filters
  salaryRange?: {
    min?: number
    max?: number
    currency?: string
  }
  workEnvironment?: ('hospital' | 'clinic' | 'remote' | 'home_visits')[]
  
  // Status Filters
  isAvailable?: boolean
  isVerified?: boolean
  hasReferences?: boolean
  
  // Sorting
  sortBy?: 'relevance' | 'experience' | 'rating' | 'distance' | 'availability'
  sortOrder?: 'asc' | 'desc'
  
  // Pagination
  page?: number
  limit?: number
}

export interface CompanySearchFilters {
  // Basic Filters
  industry?: string[]
  size?: ('small' | 'medium' | 'large' | 'enterprise')[]
  location?: {
    city?: string
    state?: string
    country?: string
    radius?: number
  }
  
  // Job Filters
  hasActiveJobs?: boolean
  jobTypes?: ('full_time' | 'part_time' | 'contract' | 'locum')[]
  departments?: string[]
  
  // Company Filters
  benefits?: string[]
  workCulture?: string[]
  isVerified?: boolean
  rating?: {
    min?: number
    max?: number
  }
  
  // Sorting & Pagination
  sortBy?: 'relevance' | 'rating' | 'size' | 'distance' | 'jobs_count'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

// =====================================
// COMMUNICATION EVENTS
// =====================================

export interface CommunicationEvent {
  id: string
  type: 'application_submitted' | 'interview_scheduled' | 'status_changed' | 'message_sent' | 'document_uploaded'
  
  // Event Details
  triggeredBy: string  // userId
  triggeredFor: string // userId or companyId
  entityId: string     // applicationId, interviewId, etc.
  entityType: 'application' | 'interview' | 'job_offer' | 'message'
  
  // Event Data
  previousValue?: any
  currentValue?: any
  metadata?: Record<string, any>
  
  // Audit Trail
  timestamp: Date
  source: 'companies_app' | 'doctors_app' | 'api' | 'system'
  ipAddress?: string
  userAgent?: string
}

// =====================================
// HOOK RETURN TYPES
// =====================================

export interface UseCompanyDoctorCommunicationReturn {
  // Job Applications
  applications: JobApplication[]
  submitApplication: (application: Partial<JobApplication>) => Promise<void>
  updateApplicationStatus: (applicationId: string, status: JobApplication['status']) => Promise<void>
  
  // Interviews
  interviews: Interview[]
  scheduleInterview: (interview: Partial<Interview>) => Promise<void>
  updateInterview: (interviewId: string, updates: Partial<Interview>) => Promise<void>
  
  // Messaging
  sendMessage: (applicationId: string, message: string, type?: ApplicationMessage['type']) => Promise<void>
  markMessageAsRead: (messageId: string) => Promise<void>
  
  // Notifications
  notifications: B2CNotification[]
  markNotificationAsRead: (notificationId: string) => Promise<void>
  
  // Search
  searchDoctors: (filters: DoctorSearchFilters) => Promise<any[]>
  searchCompanies: (filters: CompanySearchFilters) => Promise<any[]>
  
  // Real-time Updates
  subscribeToUpdates: (callback: (event: CommunicationEvent) => void) => () => void
  
  // Loading States
  isLoading: boolean
  isError: boolean
  error?: Error
}