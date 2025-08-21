/**
 * 🌐 ALTAMEDICA COMPANIES - SERVICIO API OPTIMIZADO
 * Servicio principal que orquesta los clientes API especializados
 */

import {
  Company,
  CompanyFilters,
  CreateCompanyData,
  UpdateCompanyData,
  CompanyDoctor,
  JobOffer,
  JobApplication,
  CompanyAnalytics
} from '@altamedica/types'
import type { APIResponse } from '@altamedica/shared'

import { logger } from '@altamedica/shared/services/logger.service';
import { 
  companyAPI, 
  companyDoctorsAPI, 
  jobOffersAPI 
} from './api'

export const companyService = {
  // =====================================
  // GESTIÓN DE EMPRESAS - Delegado a CompanyAPIClient
  // =====================================
  
  getCompanies: (filters?: CompanyFilters) => companyAPI.getCompanies(filters),
  getCompany: (id: string) => companyAPI.getCompany(id),
  createCompany: (data: CreateCompanyData) => companyAPI.createCompany(data),
  updateCompany: (id: string, data: UpdateCompanyData) => companyAPI.updateCompany(id, data),
  deleteCompany: (id: string) => companyAPI.deleteCompany(id),
  
  // Analíticas
  getCompanyAnalytics: (companyId: string, period?: string) => companyAPI.getCompanyAnalytics(companyId, period),
  getCompanyStats: () => companyAPI.getCompanyStats(),
  
  // Búsqueda
  getNearbyCompanies: (lat: number, lng: number, radius?: number) => companyAPI.getNearbyCompanies(lat, lng, radius),
  searchCompanies: (query: string) => companyAPI.searchCompanies(query),
  
  // Favoritos
  getFavoriteCompanies: () => companyAPI.getFavoriteCompanies(),
  toggleFavoriteCompany: (companyId: string) => companyAPI.toggleFavoriteCompany(companyId),
  
  // Verificación
  verifyCompany: (companyId: string) => companyAPI.verifyCompany(companyId),
  validateCompanyData: (data: CreateCompanyData | UpdateCompanyData) => companyAPI.validateCompanyData(data),

  // =====================================
  // GESTIÓN DE DOCTORES - Delegado a CompanyDoctorsAPIClient
  // =====================================
  
  getCompanyDoctors: (companyId: string) => companyDoctorsAPI.getCompanyDoctors(companyId),
  addDoctorToCompany: (companyId: string, doctorData: Partial<CompanyDoctor>) => 
    companyDoctorsAPI.addDoctorToCompany(companyId, doctorData),
  updateDoctorInCompany: (companyId: string, doctorId: string, data: Partial<CompanyDoctor>) => 
    companyDoctorsAPI.updateDoctorInCompany(companyId, doctorId, data),
  removeDoctorFromCompany: (companyId: string, doctorId: string) => 
    companyDoctorsAPI.removeDoctorFromCompany(companyId, doctorId),

  // =====================================
  // OFERTAS DE TRABAJO - Delegado a JobOffersAPIClient
  // =====================================
  
  getJobOffers: (companyId?: string) => jobOffersAPI.getJobOffers(companyId),
  getJobOffer: (id: string) => jobOffersAPI.getJobOffer(id),
  createJobOffer: (data: Partial<JobOffer>) => jobOffersAPI.createJobOffer(data),
  updateJobOffer: (id: string, data: Partial<JobOffer>) => jobOffersAPI.updateJobOffer(id, data),
  deleteJobOffer: (id: string) => jobOffersAPI.deleteJobOffer(id),
  
  // Aplicaciones
  getJobApplications: (jobOfferId?: string) => jobOffersAPI.getJobApplications(jobOfferId),
  updateApplicationStatus: (applicationId: string, status: string) => 
    jobOffersAPI.updateApplicationStatus(applicationId, status),

  // =====================================
  // FUNCIONES ESPECIALIZADAS HEREDADAS
  // =====================================
  
  // TODO: Migrar estas funciones a clientes especializados en futuras versiones
  async getCompanyPermissions(companyId: string): Promise<APIResponse<{
    canEdit: boolean
    canDelete: boolean
    canManageDoctors: boolean
    canManageJobOffers: boolean
    canViewAnalytics: boolean
    role: string
  }>> {
    return companyAPI.get(`/${companyId}/permissions`)
  },

  async uploadCompanyLogo(companyId: string, file: File): Promise<APIResponse<{ logoUrl: string }>> {
    const formData = new FormData()
    formData.append('logo', file)
    return companyAPI.post(formData, `/${companyId}/logo`)
  },

  async uploadCompanyImages(
    companyId: string, 
    files: File[]
  ): Promise<APIResponse<{ imageUrls: string[] }>> {
    const formData = new FormData()
    files.forEach((file, index) => formData.append(`image_${index}`, file))
    return companyAPI.post(formData, `/${companyId}/images`)
  }
}

// =====================================
// HOOKS DE UTILIDAD PARA SSR/SSG
// =====================================

export const companySSRUtils = {
  async getServerSideCompanies(filters?: CompanyFilters) {
    try {
      return await companyService.getCompanies(filters)
    } catch (error) {
      logger.error('SSR: Error fetching companies:', error)
      return { data: [], pagination: { page: 1, limit: 20, total: 0 } }
    }
  },

  async getServerSideCompany(id: string) {
    try {
      return await companyService.getCompany(id)
    } catch (error) {
      logger.error('SSR: Error fetching company:', error)
      return null
    }
  }
}

export default companyService
