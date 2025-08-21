/**
 * 🏢 COMPANY API CLIENT - OPTIMIZED
 * Cliente API especializado para operaciones de empresas
 */

import type { APIResponse } from '@altamedica/shared'
import { BaseAPIClient, buildQueryParams } from '@altamedica/shared'
import {
  Company,
  CompanyAnalytics,
  CompanyFilters,
  CreateCompanyData,
  UpdateCompanyData
} from '@altamedica/types'

export class CompanyAPIClient extends BaseAPIClient {
  constructor() {
    super('/companies')
  }

  // =====================================
  // OPERACIONES BÁSICAS CRUD
  // =====================================

  async getCompanies(filters?: CompanyFilters): Promise<APIResponse<Company[]>> {
    const queryString = filters ? buildQueryParams(filters) : ''
    return this.get<Company[]>(queryString)
  }

  async getCompany(id: string): Promise<APIResponse<Company>> {
    return this.get<Company>(`/${id}`)
  }

  async createCompany(data: CreateCompanyData): Promise<APIResponse<Company>> {
    return this.post<Company>(data)
  }

  async updateCompany(id: string, data: UpdateCompanyData): Promise<APIResponse<Company>> {
    return this.put<Company>(data, `/${id}`)
  }

  async deleteCompany(id: string): Promise<APIResponse<{ success: boolean }>> {
    return this.delete<{ success: boolean }>(`/${id}`)
  }

  // =====================================
  // ANALÍTICAS Y REPORTES
  // =====================================

  async getCompanyAnalytics(
    companyId: string,
    period: string = 'monthly'
  ): Promise<APIResponse<CompanyAnalytics>> {
    return this.get<CompanyAnalytics>(`/${companyId}/analytics?period=${period}`)
  }

  async getCompanyStats(): Promise<APIResponse<{
    totalCompanies: number
    totalDoctors: number
    totalJobOffers: number
    totalApplications: number
    averageRating: number
    topSpecialties: string[]
    companiesByType: Record<string, number>
    companiesByRegion: Record<string, number>
  }>> {
    return this.get('/stats')
  }

  // =====================================
  // BÚSQUEDA Y UBICACIÓN
  // =====================================

  async getNearbyCompanies(
    latitude: number,
    longitude: number,
    radius: number = 50
  ): Promise<APIResponse<Company[]>> {
    const params = buildQueryParams({ lat: latitude, lng: longitude, radius })
    return this.get<Company[]>(`/nearby${params}`)
  }

  async searchCompanies(query: string): Promise<APIResponse<Company[]>> {
    const params = buildQueryParams({ q: query })
    return this.get<Company[]>(`/search${params}`)
  }

  // =====================================
  // FAVORITOS Y PREFERENCIAS
  // =====================================

  async getFavoriteCompanies(): Promise<APIResponse<Company[]>> {
    return this.get<Company[]>('/favorites')
  }

  async toggleFavoriteCompany(companyId: string): Promise<APIResponse<{ isFavorite: boolean }>> {
    return this.post<{ isFavorite: boolean }>({}, `/${companyId}/favorite`)
  }

  // =====================================
  // VERIFICACIÓN Y VALIDACIÓN
  // =====================================

  async verifyCompany(companyId: string): Promise<APIResponse<{ isVerified: boolean }>> {
    return this.post<{ isVerified: boolean }>({}, `/${companyId}/verify`)
  }

  async validateCompanyData(data: CreateCompanyData | UpdateCompanyData): Promise<APIResponse<{
    isValid: boolean
    errors: string[]
    warnings: string[]
  }>> {
  // BaseAPIClient.post firma: post<T>(data, endpoint?)
  return this.post<{ isValid: boolean; errors: string[]; warnings: string[] }>(data, '/validate')
  }
}