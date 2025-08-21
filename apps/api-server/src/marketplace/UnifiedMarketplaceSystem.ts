import { v4 as uuidv4 } from 'uuid';
import { adminDb } from '@/lib/firebase-admin';
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp,
  increment
} from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { logger } from '@altamedica/shared/services/logger.service';
// =============================================================================
// INTERFACES Y TIPOS CONSOLIDADOS
// =============================================================================

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
    address?: string;
  };
  website?: string;
  logoUrl?: string;
  contactInfo?: {
    email: string;
    phone?: string;
    address?: string;
  };
  
  // Campos consolidados de ambas implementaciones
  specialties?: string[];
  ownerId?: string; // De la implementación legacy
  
  // Estado y verificación
  isVerified: boolean;
  isActive: boolean;
  status?: 'active' | 'inactive' | 'suspended'; // Compatibilidad legacy
  
  // Metadatos
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketplaceListing {
  id: string;
  companyId: string;
  title: string;
  description: string;
  
  // Categorización consolidada
  category?: 'job' | 'service' | 'equipment' | 'consultation'; // Legacy
  department?: string; // Nuevo
  
  // Tipo de empleo/servicio
  type?: 'full-time' | 'part-time' | 'contract' | 'consultation' | 'one-time'; // Legacy
  employmentType?: 'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary'; // Nuevo
  
  // Ubicación consolidada
  location?: {
    city?: string;
    state?: string;
    country?: string;
    remote?: boolean;
  };
  remote?: boolean; // Legacy compatibility
  
  // Requisitos y beneficios
  requirements: string[];
  benefits?: string[];
  skills?: string[];
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive';
  
  // Compensación
  salaryRange?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  
  // Fechas y metadata
  applicationDeadline?: Date;
  
  // Tags y prioridad
  tags?: string[];
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  
  // Estado
  status: 'draft' | 'active' | 'published' | 'paused' | 'closed';
  
  // Métricas
  viewCount?: number;
  applicationCount?: number;
  
  // Metadatos
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobApplication {
  id: string;
  listingId: string;
  applicantId: string;
  
  // Contenido de aplicación
  resumeUrl?: string;
  coverLetter?: string;
  additionalInfo?: string;
  
  // Información adicional
  availabilityDate?: Date;
  expectedSalary?: number;
  
  // Estado y revisión
  status: 'pending' | 'reviewing' | 'reviewed' | 'shortlisted' | 'interviewed' | 'accepted' | 'rejected';
  notes?: string;
  reviewNotes?: string;
  rejectionReason?: string;
  
  // Fechas y revisor
  appliedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  interviewDate?: Date;
  
  // Metadatos
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MarketplaceStats {
  totalCompanies: number;
  activeCompanies: number;
  totalListings: number;
  activeListings: number;
  totalApplications: number;
  recentApplications: number;
}

// =============================================================================
// SCHEMAS DE VALIDACIÓN ZOD
// =============================================================================

export const CreateCompanySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  industry: z.string().optional(),
  size: z.enum(['startup', 'small', 'medium', 'large', 'enterprise']).optional(),
  location: z.object({
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    address: z.string().optional()
  }).optional(),
  website: z.string().url().optional(),
  logoUrl: z.string().url().optional(),
  contactInfo: z.object({
    email: z.string().email(),
    phone: z.string().optional(),
    address: z.string().optional()
  }).optional(),
  specialties: z.array(z.string()).optional(),
  ownerId: z.string().optional()
});

export const CreateListingSchema = z.object({
  companyId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(['job', 'service', 'equipment', 'consultation']).optional(),
  department: z.string().optional(),
  type: z.enum(['full-time', 'part-time', 'contract', 'consultation', 'one-time']).optional(),
  employmentType: z.enum(['full-time', 'part-time', 'contract', 'internship', 'temporary']).optional(),
  location: z.object({
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    remote: z.boolean().optional()
  }).optional(),
  remote: z.boolean().optional(),
  requirements: z.array(z.string()).default([]),
  benefits: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive']).optional(),
  salaryRange: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    currency: z.string().optional()
  }).optional(),
  applicationDeadline: z.string().or(z.date()).optional(),
  tags: z.array(z.string()).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['draft', 'active', 'published', 'paused', 'closed']).default('active')
});

export const CreateApplicationSchema = z.object({
  listingId: z.string().min(1),
  applicantId: z.string().min(1),
  resumeUrl: z.string().url().optional(),
  coverLetter: z.string().optional(),
  additionalInfo: z.string().optional(),
  availabilityDate: z.string().or(z.date()).optional(),
  expectedSalary: z.number().optional()
});

// =============================================================================
// SERVICIO UNIFICADO DE MARKETPLACE
// =============================================================================

export class UnifiedMarketplaceService {
  private static db = adminDb;
  private static companiesCollection = 'marketplace_companies';
  private static listingsCollection = 'marketplace_listings';
  private static applicationsCollection = 'marketplace_applications';

  // =========================================================================
  // GESTIÓN DE EMPRESAS
  // =========================================================================

  static async createCompany(data: Omit<Company, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'isVerified'>): Promise<Company> {
    try {
      const companyData = {
        ...data,
        isActive: true,
        isVerified: false,
        status: 'active' as const,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(this.db, this.companiesCollection), companyData);
      
      logger.info(`✅ Company created: ${data.name} (ID: ${docRef.id})`);
      
      return {
        id: docRef.id,
        ...data,
        isActive: true,
        isVerified: false,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      logger.error('Error creating company:', undefined, error);
      throw new Error('Failed to create company');
    }
  }

  static async getCompany(companyId: string): Promise<Company | null> {
    try {
      const docRef = doc(this.db, this.companiesCollection, companyId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return this.convertFirestoreToCompany({ id: docSnap.id, ...data });
    } catch (error) {
      logger.error('Error getting company:', undefined, error);
      throw new Error('Failed to get company');
    }
  }

  static async getCompanies(filters: any = {}): Promise<{ companies: Company[]; count: number }> {
    try {
      let q = query(
        collection(this.db, this.companiesCollection),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );

      // Aplicar filtros
      if (filters.industry) {
        q = query(q, where('industry', '==', filters.industry));
      }
      
      if (filters.size) {
        q = query(q, where('size', '==', filters.size));
      }
      
      if (filters.verified !== undefined) {
        q = query(q, where('isVerified', '==', filters.verified));
      }
      
      if (filters.location) {
        q = query(q, where('location.city', '==', filters.location));
      }
      
      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }

      const querySnapshot = await getDocs(q);
      const companies = querySnapshot.docs.map(d => this.convertFirestoreToCompany({ id: d.id, ...d.data() }));

      return {
        companies,
        count: companies.length
      };
    } catch (error) {
      logger.error('Error getting companies:', undefined, error);
      throw new Error('Failed to get companies');
    }
  }

  static async updateCompany(companyId: string, data: Partial<Company>): Promise<Company> {
    try {
      const docRef = doc(this.db, this.companiesCollection, companyId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Company not found');
      }

      const updateData: any = {
        ...data,
        updatedAt: serverTimestamp()
      };

      await updateDoc(docRef, updateData);
      const updatedDoc = await getDoc(docRef);
      
      logger.info(`✅ Company updated: ${companyId}`);
      
      return this.convertFirestoreToCompany({ id: updatedDoc.id, ...updatedDoc.data() });
    } catch (error) {
      logger.error('Error updating company:', undefined, error);
      throw error;
    }
  }

  // =========================================================================
  // GESTIÓN DE LISTADOS
  // =========================================================================

  static async createListing(data: Omit<MarketplaceListing, 'id' | 'createdAt' | 'updatedAt' | 'viewCount' | 'applicationCount'>): Promise<MarketplaceListing> {
    try {
      const listingData = {
        ...data,
        viewCount: 0,
        applicationCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        applicationDeadline: data.applicationDeadline ? Timestamp.fromDate(
          typeof data.applicationDeadline === 'string' ? new Date(data.applicationDeadline) : data.applicationDeadline
        ) : null
      };

      const docRef = await addDoc(collection(this.db, this.listingsCollection), listingData);
      
      logger.info(`✅ Listing created: ${data.title} (ID: ${docRef.id})`);
      
      return {
        id: docRef.id,
        ...data,
        viewCount: 0,
        applicationCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      logger.error('Error creating listing:', undefined, error);
      throw new Error('Failed to create listing');
    }
  }

  static async getListing(listingId: string): Promise<MarketplaceListing | null> {
    try {
      const docRef = doc(this.db, this.listingsCollection, listingId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return this.convertFirestoreToListing({ id: docSnap.id, ...data });
    } catch (error) {
      logger.error('Error getting listing:', undefined, error);
      throw new Error('Failed to get listing');
    }
  }

  static async getListings(filters: any = {}): Promise<{ listings: MarketplaceListing[]; count: number }> {
    try {
      let q = query(
        collection(this.db, this.listingsCollection),
        where('status', 'in', ['active', 'published']),
        orderBy('createdAt', 'desc')
      );

      // Aplicar filtros
      if (filters.companyId) {
        q = query(q, where('companyId', '==', filters.companyId));
      }
      
      if (filters.category) {
        q = query(q, where('category', '==', filters.category));
      }
      
      if (filters.employmentType) {
        q = query(q, where('employmentType', '==', filters.employmentType));
      }
      
      if (filters.type) {
        q = query(q, where('type', '==', filters.type));
      }
      
      if (filters.experienceLevel) {
        q = query(q, where('experienceLevel', '==', filters.experienceLevel));
      }
      
      if (filters.department) {
        q = query(q, where('department', '==', filters.department));
      }
      
      if (filters.remote !== undefined) {
        q = query(q, where('remote', '==', filters.remote));
      }
      
      if (filters.location) {
        q = query(q, where('location.city', '==', filters.location));
      }
      
      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }

      const querySnapshot = await getDocs(q);
      const listings = querySnapshot.docs.map(d => this.convertFirestoreToListing({ id: d.id, ...d.data() }));

      return {
        listings,
        count: listings.length
      };
    } catch (error) {
      logger.error('Error getting listings:', undefined, error);
      throw new Error('Failed to get listings');
    }
  }

  static async updateListing(listingId: string, data: Partial<MarketplaceListing>): Promise<MarketplaceListing> {
    try {
      const docRef = doc(this.db, this.listingsCollection, listingId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Listing not found');
      }

      const updateData: any = {
        ...data,
        updatedAt: serverTimestamp()
      };

      if (data.applicationDeadline) {
        const deadline = typeof data.applicationDeadline === 'string' ? 
          new Date(data.applicationDeadline) : data.applicationDeadline;
        updateData.applicationDeadline = Timestamp.fromDate(deadline);
      }

      await updateDoc(docRef, updateData);
      const updatedDoc = await getDoc(docRef);
      
      logger.info(`✅ Listing updated: ${listingId}`);
      
      return this.convertFirestoreToListing({ id: updatedDoc.id, ...updatedDoc.data() });
    } catch (error) {
      logger.error('Error updating listing:', undefined, error);
      throw error;
    }
  }

  static async deleteListing(listingId: string): Promise<void> {
    try {
      const docRef = doc(this.db, this.listingsCollection, listingId);
      await deleteDoc(docRef);
      
      logger.info(`✅ Listing deleted: ${listingId}`);
    } catch (error) {
      logger.error('Error deleting listing:', undefined, error);
      throw new Error('Failed to delete listing');
    }
  }

  static async incrementListingViews(listingId: string): Promise<void> {
    try {
      const docRef = doc(this.db, this.listingsCollection, listingId);
      await updateDoc(docRef, {
        viewCount: increment(1)
      });
    } catch (error) {
      logger.error('Error incrementing listing views:', undefined, error);
      // No throw error ya que no es crítico
    }
  }

  // =========================================================================
  // GESTIÓN DE APLICACIONES
  // =========================================================================

  static async createApplication(data: Omit<JobApplication, 'id' | 'appliedAt' | 'createdAt' | 'updatedAt'>): Promise<JobApplication> {
    try {
      const applicationData = {
        ...data,
        status: data.status || 'pending' as const,
        appliedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        availabilityDate: data.availabilityDate ? Timestamp.fromDate(
          typeof data.availabilityDate === 'string' ? new Date(data.availabilityDate) : data.availabilityDate
        ) : null
      };

      const docRef = await addDoc(collection(this.db, this.applicationsCollection), applicationData);
      
      // Incrementar contador de aplicaciones en el listing
      const listingRef = doc(this.db, this.listingsCollection, data.listingId);
      await updateDoc(listingRef, {
        applicationCount: increment(1)
      });

      logger.info(`✅ Application created: ${data.applicantId} -> ${data.listingId}`);
      
      return {
        id: docRef.id,
        ...data,
        status: data.status || 'pending',
        appliedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      logger.error('Error creating application:', undefined, error);
      throw new Error('Failed to create application');
    }
  }

  static async getApplication(applicationId: string): Promise<JobApplication | null> {
    try {
      const docRef = doc(this.db, this.applicationsCollection, applicationId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return this.convertFirestoreToApplication({ id: docSnap.id, ...data });
    } catch (error) {
      logger.error('Error getting application:', undefined, error);
      throw new Error('Failed to get application');
    }
  }

  static async getApplicationsByListing(listingId: string, filters: any = {}): Promise<{ applications: JobApplication[]; count: number; total: number }> {
    try {
      let q = query(
        collection(this.db, this.applicationsCollection),
        where('listingId', '==', listingId),
        orderBy('appliedAt', 'desc')
      );

      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      
      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }

      const querySnapshot = await getDocs(q);
      const applications = querySnapshot.docs.map(d => this.convertFirestoreToApplication({ id: d.id, ...d.data() }));

      // Contar total sin límite
      const totalQuery = query(
        collection(this.db, this.applicationsCollection),
        where('listingId', '==', listingId)
      );
      const totalSnapshot = await getDocs(totalQuery);

      return {
        applications,
        count: applications.length,
        total: totalSnapshot.size
      };
    } catch (error) {
      logger.error('Error getting applications by listing:', undefined, error);
      throw new Error('Failed to get applications');
    }
  }

  static async getApplicationsByApplicant(applicantId: string): Promise<JobApplication[]> {
    try {
      const q = query(
        collection(this.db, this.applicationsCollection),
        where('applicantId', '==', applicantId),
        orderBy('appliedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(d => this.convertFirestoreToApplication({ id: d.id, ...d.data() }));
    } catch (error) {
      logger.error('Error getting applications by applicant:', undefined, error);
      throw new Error('Failed to get applications');
    }
  }

  static async getApplicationByUserAndListing(userId: string, listingId: string): Promise<JobApplication | null> {
    try {
      const q = query(
        collection(this.db, this.applicationsCollection),
        where('applicantId', '==', userId),
        where('listingId', '==', listingId),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return null;
      }

      const docData = querySnapshot.docs[0];
      return this.convertFirestoreToApplication({ id: docData.id, ...docData.data() });
    } catch (error) {
      logger.error('Error getting application by user and listing:', undefined, error);
      throw new Error('Failed to get application');
    }
  }

  static async updateApplication(applicationId: string, data: Partial<JobApplication>): Promise<JobApplication> {
    try {
      const docRef = doc(this.db, this.applicationsCollection, applicationId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Application not found');
      }

      const updateData: any = {
        ...data,
        updatedAt: serverTimestamp()
      };

      // Convertir fechas si es necesario
      if (data.availabilityDate) {
        const availDate = typeof data.availabilityDate === 'string' ? 
          new Date(data.availabilityDate) : data.availabilityDate;
        updateData.availabilityDate = Timestamp.fromDate(availDate);
      }
      
      if (data.interviewDate) {
        const intDate = typeof data.interviewDate === 'string' ? 
          new Date(data.interviewDate) : data.interviewDate;
        updateData.interviewDate = Timestamp.fromDate(intDate);
      }
      
      if (data.reviewedAt) {
        const revDate = typeof data.reviewedAt === 'string' ? 
          new Date(data.reviewedAt) : data.reviewedAt;
        updateData.reviewedAt = Timestamp.fromDate(revDate);
      }

      await updateDoc(docRef, updateData);
      const updatedDoc = await getDoc(docRef);
      
      logger.info(`✅ Application updated: ${applicationId} -> ${data.status}`);
      
      return this.convertFirestoreToApplication({ id: updatedDoc.id, ...updatedDoc.data() });
    } catch (error) {
      logger.error('Error updating application:', undefined, error);
      throw error;
    }
  }

  // =========================================================================
  // ESTADÍSTICAS Y OVERVIEW
  // =========================================================================

  static async getMarketplaceStats(): Promise<MarketplaceStats> {
    try {
      const [companiesQuery, listingsQuery, applicationsQuery] = await Promise.all([
        getDocs(collection(this.db, this.companiesCollection)),
        getDocs(collection(this.db, this.listingsCollection)),
        getDocs(collection(this.db, this.applicationsCollection))
      ]);

      const companies = companiesQuery.docs.map(doc => doc.data());
      const listings = listingsQuery.docs.map(doc => doc.data());
      const applications = applicationsQuery.docs.map(doc => doc.data());

      const totalCompanies = companies.length;
      const activeCompanies = companies.filter(c => c.isActive !== false).length;
      const totalListings = listings.length;
      const activeListings = listings.filter(l => ['active', 'published'].includes(l.status)).length;
      const totalApplications = applications.length;

      // Aplicaciones de los últimos 30 días
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentApplications = applications.filter(a => 
        a.appliedAt && a.appliedAt.toDate() > thirtyDaysAgo
      ).length;

      return {
        totalCompanies,
        activeCompanies,
        totalListings,
        activeListings,
        totalApplications,
        recentApplications
      };
    } catch (error) {
      logger.error('Error getting marketplace stats:', undefined, error);
      throw new Error('Failed to get marketplace statistics');
    }
  }

  static async getMarketplaceOverview(filters: any = {}): Promise<any> {
    try {
      const [companiesResult, listingsResult] = await Promise.all([
        this.getCompanies(filters),
        this.getListings(filters)
      ]);

      return {
        companies: companiesResult.companies,
        listings: listingsResult.listings,
        totalCompanies: companiesResult.count,
        totalListings: listingsResult.count
      };
    } catch (error) {
      logger.error('Error getting marketplace overview:', undefined, error);
      throw new Error('Failed to get marketplace overview');
    }
  }

  // =========================================================================
  // MÉTODOS HELPER DE CONVERSIÓN
  // =========================================================================

  private static convertFirestoreToCompany(data: any): Company {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      industry: data.industry,
      size: data.size,
      location: data.location || {
        city: data.location,
        state: data.state,
        country: data.country,
        address: data.address
      },
      website: data.website,
      logoUrl: data.logoUrl,
      contactInfo: data.contactInfo || {
        email: data.contactEmail,
        phone: data.phone,
        address: data.address
      },
      specialties: data.specialties || [],
      ownerId: data.ownerId,
      isVerified: data.isVerified || false,
      isActive: data.isActive !== false,
      status: data.status || (data.isActive !== false ? 'active' : 'inactive'),
      createdBy: data.createdBy,
      updatedBy: data.updatedBy,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    };
  }

  private static convertFirestoreToListing(data: any): MarketplaceListing {
    return {
      id: data.id,
      companyId: data.companyId,
      title: data.title,
      description: data.description,
      category: data.category,
      department: data.department,
      type: data.type,
      employmentType: data.employmentType,
      location: data.location || {
        city: data.location,
        remote: data.remote
      },
      remote: data.remote || data.location?.remote || false,
      requirements: data.requirements || [],
      benefits: data.benefits || [],
      skills: data.skills || [],
      experienceLevel: data.experienceLevel,
      salaryRange: data.salaryRange,
      applicationDeadline: data.applicationDeadline?.toDate(),
      tags: data.tags || [],
      priority: data.priority,
      status: data.status,
      viewCount: data.viewCount || 0,
      applicationCount: data.applicationCount || 0,
      createdBy: data.createdBy,
      updatedBy: data.updatedBy,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    };
  }

  private static convertFirestoreToApplication(data: any): JobApplication {
    return {
      id: data.id,
      listingId: data.listingId,
      applicantId: data.applicantId,
      resumeUrl: data.resumeUrl,
      coverLetter: data.coverLetter,
      additionalInfo: data.additionalInfo,
      availabilityDate: data.availabilityDate?.toDate(),
      expectedSalary: data.expectedSalary,
      status: data.status,
      notes: data.notes,
      reviewNotes: data.reviewNotes,
      rejectionReason: data.rejectionReason,
      appliedAt: data.appliedAt?.toDate() || new Date(),
      reviewedAt: data.reviewedAt?.toDate(),
      reviewedBy: data.reviewedBy,
      interviewDate: data.interviewDate?.toDate(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    };
  }

  // =========================================================================
  // MÉTODOS DE NOTIFICACIÓN
  // =========================================================================

  static async notifyApplicantStatusChange(application: JobApplication): Promise<void> {
    try {
      logger.info(`📧 Notifying applicant ${application.applicantId} about status change to ${application.status}`);
      
      // Integración futura con UnifiedNotificationSystem
      // await notificationService.createNotificationFromTemplate(
      //   'application_status_change',
      //   application.applicantId,
      //   { status: application.status, listingTitle: '...' }
      // );
    } catch (error) {
      logger.error('Error sending notification:', undefined, error);
      // No throw error ya que no es crítico
    }
  }
}

// =============================================================================
// INSTANCIA SINGLETON
// =============================================================================

export const marketplaceService = new UnifiedMarketplaceService();
export default UnifiedMarketplaceService;