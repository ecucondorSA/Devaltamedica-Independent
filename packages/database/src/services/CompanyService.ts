/**
 * 🏢 COMPANY SERVICE - ALTAMEDICA DATABASE
 * Servicios de gestión de empresas, marketplace y analíticas
 * 
 * @deprecated Este servicio está obsoleto. Use CompanyRepository y MarketplaceRepository en su lugar.
 * Este servicio viola las mejores prácticas usando Firebase Client SDK sin ServiceContext.
 * Será eliminado en la próxima versión.
 * 
 * @note TEMPORARILY DISABLED for build compatibility. All methods return mock data.
 */

// Stub exports to maintain compatibility
export const companiesService = {
  getCompanies: () => Promise.resolve([]),
  getCompanyById: () => Promise.resolve(null),
  createCompany: () => Promise.resolve(null),
  updateCompany: () => Promise.resolve(null),
  deleteCompany: () => Promise.resolve(null),
  getCompaniesByIndustry: () => Promise.resolve([]),
  searchCompanies: () => Promise.resolve([]),
};

export const marketplaceService = {
  getListings: () => Promise.resolve([]),
  createListing: () => Promise.resolve(null),
  updateListing: () => Promise.resolve(null),
  deleteListing: () => Promise.resolve(null),
};

export const analyticsService = {
  getCompanyStats: () => Promise.resolve({}),
  getMarketplaceMetrics: () => Promise.resolve({}),
  generateReport: () => Promise.resolve(null),
};