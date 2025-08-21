/**
 * 🔗 API CLIENTS - INDEX
 * Exportación centralizada de todos los clientes API
 */

export { CompanyAPIClient } from './CompanyAPIClient'
export { CompanyDoctorsAPIClient } from './CompanyDoctorsAPIClient'
export { JobOffersAPIClient } from './JobOffersAPIClient'

// Instancias singleton para uso directo
export const companyAPI = new CompanyAPIClient()
export const companyDoctorsAPI = new CompanyDoctorsAPIClient()
export const jobOffersAPI = new JobOffersAPIClient()