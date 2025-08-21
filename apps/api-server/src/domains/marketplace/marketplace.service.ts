// ============================================================================
// DOMAINS MARKETPLACE SERVICE - NOW RE-EXPORTS FROM UNIFIED SYSTEM  
// ============================================================================
//
// Este archivo ha sido migrado al UnifiedMarketplaceSystem para consolidar
// múltiples implementaciones duplicadas en una sola API coherente.
//
// COMPATIBILIDAD: Este archivo mantiene la API domains para retrocompatibilidad
// ============================================================================

import UnifiedMarketplaceService from '../../marketplace/UnifiedMarketplaceSystem';
import { Company, JobListing, JobApplication, MarketplaceStats } from './marketplace.types';

export class MarketplaceService {
  // Company Management
  static async createCompany(data: Omit<Company, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'isVerified'>): Promise<Company> {
    return UnifiedMarketplaceService.createCompany(data);
  }

  static async getCompany(companyId: string): Promise<Company | null> {
    return UnifiedMarketplaceService.getCompany(companyId);
  }

  static async getCompanies(filters: any = {}): Promise<Company[]> {
    const result = await UnifiedMarketplaceService.getCompanies(filters);
    return result.companies;
  }

  static async updateCompany(companyId: string, data: Partial<Company>): Promise<Company> {
    return UnifiedMarketplaceService.updateCompany(companyId, data);
  }

  // Job Listing Management  
  static async createJobListing(data: Omit<JobListing, 'id' | 'createdAt' | 'updatedAt'>): Promise<JobListing> {
    return UnifiedMarketplaceService.createListing({
      ...data,
      employmentType: data.employmentType,
      department: data.department
    });
  }

  static async getJobListing(listingId: string): Promise<JobListing | null> {
    return UnifiedMarketplaceService.getListing(listingId);
  }

  static async getJobListings(filters: any = {}): Promise<JobListing[]> {
    const result = await UnifiedMarketplaceService.getListings(filters);
    return result.listings;
  }

  static async updateJobListing(listingId: string, data: Partial<JobListing>): Promise<JobListing> {
    return UnifiedMarketplaceService.updateListing(listingId, data);
  }

  static async deleteJobListing(listingId: string): Promise<void> {
    return UnifiedMarketplaceService.deleteListing(listingId);
  }

  // Application Management
  static async createJobApplication(data: Omit<JobApplication, 'id' | 'appliedAt' | 'status'>): Promise<JobApplication> {
    return UnifiedMarketplaceService.createApplication({
      ...data,
      status: 'pending'
    });
  }

  static async getJobApplication(applicationId: string): Promise<JobApplication | null> {
    return UnifiedMarketplaceService.getApplication(applicationId);
  }

  static async getJobApplicationsByListing(listingId: string, filters: any = {}): Promise<JobApplication[]> {
    const result = await UnifiedMarketplaceService.getApplicationsByListing(listingId, filters);
    return result.applications;
  }

  static async getJobApplicationsByApplicant(applicantId: string): Promise<JobApplication[]> {
    return UnifiedMarketplaceService.getApplicationsByApplicant(applicantId);
  }

  static async updateJobApplication(applicationId: string, data: Partial<JobApplication>): Promise<JobApplication> {
    return UnifiedMarketplaceService.updateApplication(applicationId, data);
  }

  // Statistics
  static async getMarketplaceStats(): Promise<MarketplaceStats> {
    return UnifiedMarketplaceService.getMarketplaceStats();
  }
}