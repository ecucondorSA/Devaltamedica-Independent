/**
 * 💼 JOB OFFERS API CLIENT
 * Cliente API especializado para ofertas de trabajo
 */

import type { APIResponse } from '@altamedica/shared'
import { BaseAPIClient } from '@altamedica/shared'
import { JobApplication, JobOffer } from '@altamedica/types'

export class JobOffersAPIClient extends BaseAPIClient {
  constructor() {
    super('/job-offers')
  }

  // =====================================
  // GESTIÓN DE OFERTAS DE TRABAJO
  // =====================================

  async getJobOffers(companyId?: string): Promise<APIResponse<JobOffer[]>> {
    const endpoint = companyId ? `/companies/${companyId}/job-offers` : ''
    return this.get<JobOffer[]>(endpoint)
  }

  async getJobOffer(id: string): Promise<APIResponse<JobOffer>> {
    return this.get<JobOffer>(`/${id}`)
  }

  async createJobOffer(data: Partial<JobOffer>): Promise<APIResponse<JobOffer>> {
    return this.post<JobOffer>(data)
  }

  async updateJobOffer(id: string, data: Partial<JobOffer>): Promise<APIResponse<JobOffer>> {
    return this.put<JobOffer>(data, `/${id}`)
  }

  async deleteJobOffer(id: string): Promise<APIResponse<{ success: boolean }>> {
    return this.delete<{ success: boolean }>(`/${id}`)
  }

  // =====================================
  // GESTIÓN DE APLICACIONES
  // =====================================

  async getJobApplications(jobOfferId?: string): Promise<APIResponse<JobApplication[]>> {
    const endpoint = jobOfferId ? `/${jobOfferId}/applications` : '/applications'
    return this.get<JobApplication[]>(endpoint)
  }

  async updateApplicationStatus(
    applicationId: string,
    status: string
  ): Promise<APIResponse<JobApplication>> {
    return this.put<JobApplication>({ status }, `/applications/${applicationId}/status`)
  }

  // =====================================
  // ESTADÍSTICAS DE OFERTAS
  // =====================================

  async getJobOfferStats(companyId: string): Promise<APIResponse<{
    totalOffers: number
    activeOffers: number
    totalApplications: number
    averageApplicationsPerOffer: number
    topSkills: string[]
    offersByDepartment: Record<string, number>
  }>> {
    return this.get(`/companies/${companyId}/stats`)
  }
}