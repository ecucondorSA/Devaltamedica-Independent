// ============================================================================
// LEGACY MARKETPLACE SERVICE - NOW RE-EXPORTS FROM UNIFIED SYSTEM
// ============================================================================
//
// Este archivo ha sido migrado al UnifiedMarketplaceSystem para consolidar
// múltiples implementaciones duplicadas en una sola API coherente.
//
// COMPATIBILIDAD: Este archivo mantiene la API legacy para retrocompatibilidad
// ============================================================================

import UnifiedMarketplaceService, {
  type Company,
  type MarketplaceListing,
  type JobApplication as MarketplaceApplication,
  marketplaceService
} from '../marketplace/UnifiedMarketplaceSystem';

// Re-export interfaces para compatibilidad
export { Company, MarketplaceListing, MarketplaceApplication };

// Re-export de la clase como legacy MarketplaceService
class MarketplaceService {
  // Company Management
  static async createCompany(data: Omit<Company, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'isVerified'>): Promise<Company> {
    return UnifiedMarketplaceService.createCompany({
      ...data,
      contactInfo: data.contactEmail ? { email: data.contactEmail, phone: data.phone } : undefined
    } as any);
  }

  static async getCompany(companyId: string): Promise<Company | null> {
    return UnifiedMarketplaceService.getCompany(companyId);
  }

  static async getCompanies(filters: any = {}): Promise<{ companies: Company[]; count: number }> {
    return UnifiedMarketplaceService.getCompanies(filters);
  }

  static async updateCompany(companyId: string, data: Partial<Company>): Promise<Company> {
    return UnifiedMarketplaceService.updateCompany(companyId, data);
  }

  // Listing Management (mapped to new interface)
  static async createListing(data: Omit<MarketplaceListing, 'id' | 'createdAt' | 'updatedAt' | 'viewCount' | 'applicationCount'>): Promise<MarketplaceListing> {
    return UnifiedMarketplaceService.createListing(data);
  }

  static async getListing(listingId: string): Promise<MarketplaceListing | null> {
    return UnifiedMarketplaceService.getListing(listingId);
  }

  static async getListings(filters: any = {}): Promise<{ listings: MarketplaceListing[]; count: number }> {
    return UnifiedMarketplaceService.getListings(filters);
  }

  static async updateListing(listingId: string, data: Partial<MarketplaceListing>): Promise<MarketplaceListing> {
    return UnifiedMarketplaceService.updateListing(listingId, data);
  }

  static async deleteListing(listingId: string): Promise<void> {
    return UnifiedMarketplaceService.deleteListing(listingId);
  }

  static async incrementListingViews(listingId: string): Promise<void> {
    return UnifiedMarketplaceService.incrementListingViews(listingId);
  }

  // Application Management
  static async createApplication(data: Omit<MarketplaceApplication, 'id' | 'appliedAt' | 'createdAt' | 'updatedAt'>): Promise<MarketplaceApplication> {
    return UnifiedMarketplaceService.createApplication({
      ...data,
      resumeUrl: data.resume, // Map resume to resumeUrl
      status: data.status || 'pending'
    });
  }

  static async getApplication(applicationId: string): Promise<MarketplaceApplication | null> {
    return UnifiedMarketplaceService.getApplication(applicationId);
  }

  static async getApplicationByUserAndListing(userId: string, listingId: string): Promise<MarketplaceApplication | null> {
    return UnifiedMarketplaceService.getApplicationByUserAndListing(userId, listingId);
  }

  static async getApplicationsForListing(listingId: string, filters: any = {}): Promise<{ applications: MarketplaceApplication[]; count: number; total: number }> {
    return UnifiedMarketplaceService.getApplicationsByListing(listingId, filters);
  }

  static async updateApplication(applicationId: string, data: Partial<MarketplaceApplication>): Promise<MarketplaceApplication> {
    return UnifiedMarketplaceService.updateApplication(applicationId, data);
  }

  // Marketplace Overview
  static async getMarketplaceOverview(filters: any = {}): Promise<any> {
    return UnifiedMarketplaceService.getMarketplaceOverview(filters);
  }

  // Notifications
  static async notifyApplicantStatusChange(application: MarketplaceApplication): Promise<void> {
    return UnifiedMarketplaceService.notifyApplicantStatusChange(application);
  }
}

export default MarketplaceService;