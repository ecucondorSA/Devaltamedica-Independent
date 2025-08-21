// Migration Configuration for Phase 1-7 Refactoring
// Controls feature flags, routing, and migration status

interface EndpointMigrationStatus {
  name: string
  originalApp: 'web-app'
  targetApp: 'patients-app' | 'doctors-app' | 'companies-app' | 'admin-app' | 'distributed'
  phase: number
  migrated: boolean
  trafficPercentage: number // 0-100, percentage of traffic going to new app
  rollbackReady: boolean
}

interface AppMigrationConfig {
  currentPhase: number
  totalPhases: number
  endpoints: EndpointMigrationStatus[]
  featureFlags: {
    [key: string]: boolean
  }
}

// Phase 1: Gateway endpoints (legitimate)
const gatewayEndpoints: EndpointMigrationStatus[] = [
  { name: 'auth.login', originalApp: 'web-app', targetApp: 'patients-app', phase: 1, migrated: false, trafficPercentage: 0, rollbackReady: true },
  { name: 'auth.register', originalApp: 'web-app', targetApp: 'patients-app', phase: 1, migrated: false, trafficPercentage: 0, rollbackReady: true },
  { name: 'auth.me', originalApp: 'web-app', targetApp: 'patients-app', phase: 1, migrated: false, trafficPercentage: 0, rollbackReady: true },
  { name: 'auth.logout', originalApp: 'web-app', targetApp: 'patients-app', phase: 1, migrated: false, trafficPercentage: 0, rollbackReady: true },
  { name: 'auth.refresh', originalApp: 'web-app', targetApp: 'patients-app', phase: 1, migrated: false, trafficPercentage: 0, rollbackReady: true },
  { name: 'health.status', originalApp: 'web-app', targetApp: 'patients-app', phase: 1, migrated: false, trafficPercentage: 0, rollbackReady: true },
  { name: 'health.version', originalApp: 'web-app', targetApp: 'patients-app', phase: 1, migrated: false, trafficPercentage: 0, rollbackReady: true },
  { name: 'health.metrics', originalApp: 'web-app', targetApp: 'patients-app', phase: 1, migrated: false, trafficPercentage: 0, rollbackReady: true },
  { name: 'notifications.global', originalApp: 'web-app', targetApp: 'distributed', phase: 1, migrated: false, trafficPercentage: 0, rollbackReady: true },
  { name: 'notifications.markRead', originalApp: 'web-app', targetApp: 'distributed', phase: 1, migrated: false, trafficPercentage: 0, rollbackReady: true }
]

// Phase 2: Patient endpoints
const patientEndpoints: EndpointMigrationStatus[] = [
  { name: 'patients.list', originalApp: 'web-app', targetApp: 'patients-app', phase: 2, migrated: false, trafficPercentage: 0, rollbackReady: false },
  { name: 'patients.get', originalApp: 'web-app', targetApp: 'patients-app', phase: 2, migrated: false, trafficPercentage: 0, rollbackReady: false },
  { name: 'patients.create', originalApp: 'web-app', targetApp: 'patients-app', phase: 2, migrated: false, trafficPercentage: 0, rollbackReady: false },
  { name: 'patients.update', originalApp: 'web-app', targetApp: 'patients-app', phase: 2, migrated: false, trafficPercentage: 0, rollbackReady: false },
  { name: 'patients.appointments', originalApp: 'web-app', targetApp: 'patients-app', phase: 2, migrated: false, trafficPercentage: 0, rollbackReady: false },
  { name: 'locations.medical', originalApp: 'web-app', targetApp: 'patients-app', phase: 2, migrated: false, trafficPercentage: 0, rollbackReady: false },
  { name: 'locations.nearby', originalApp: 'web-app', targetApp: 'patients-app', phase: 2, migrated: false, trafficPercentage: 0, rollbackReady: false },
  { name: 'appointments.list.patient', originalApp: 'web-app', targetApp: 'patients-app', phase: 2, migrated: false, trafficPercentage: 0, rollbackReady: false },
  { name: 'appointments.get.patient', originalApp: 'web-app', targetApp: 'patients-app', phase: 2, migrated: false, trafficPercentage: 0, rollbackReady: false },
  { name: 'appointments.create', originalApp: 'web-app', targetApp: 'patients-app', phase: 2, migrated: false, trafficPercentage: 0, rollbackReady: false }
]

// Phase 3: Doctor endpoints  
const doctorEndpoints: EndpointMigrationStatus[] = [
  { name: 'doctors.list', originalApp: 'web-app', targetApp: 'doctors-app', phase: 3, migrated: false, trafficPercentage: 0, rollbackReady: false },
  { name: 'doctors.get', originalApp: 'web-app', targetApp: 'doctors-app', phase: 3, migrated: false, trafficPercentage: 0, rollbackReady: false },
  { name: 'doctors.create', originalApp: 'web-app', targetApp: 'doctors-app', phase: 3, migrated: false, trafficPercentage: 0, rollbackReady: false },
  { name: 'doctors.appointments', originalApp: 'web-app', targetApp: 'doctors-app', phase: 3, migrated: false, trafficPercentage: 0, rollbackReady: false },
  { name: 'doctors.availability', originalApp: 'web-app', targetApp: 'doctors-app', phase: 3, migrated: false, trafficPercentage: 0, rollbackReady: false },
  { name: 'prescriptions.list', originalApp: 'web-app', targetApp: 'doctors-app', phase: 3, migrated: false, trafficPercentage: 0, rollbackReady: false },
  { name: 'prescriptions.get', originalApp: 'web-app', targetApp: 'doctors-app', phase: 3, migrated: false, trafficPercentage: 0, rollbackReady: false },
  { name: 'prescriptions.create', originalApp: 'web-app', targetApp: 'doctors-app', phase: 3, migrated: false, trafficPercentage: 0, rollbackReady: false },
  { name: 'prescriptions.update', originalApp: 'web-app', targetApp: 'doctors-app', phase: 3, migrated: false, trafficPercentage: 0, rollbackReady: false },
  { name: 'medicalRecords.list', originalApp: 'web-app', targetApp: 'doctors-app', phase: 3, migrated: false, trafficPercentage: 0, rollbackReady: false },
  { name: 'medicalRecords.get', originalApp: 'web-app', targetApp: 'doctors-app', phase: 3, migrated: false, trafficPercentage: 0, rollbackReady: false },
  { name: 'medicalRecords.create', originalApp: 'web-app', targetApp: 'doctors-app', phase: 3, migrated: false, trafficPercentage: 0, rollbackReady: false },
  { name: 'medicalRecords.update', originalApp: 'web-app', targetApp: 'doctors-app', phase: 3, migrated: false, trafficPercentage: 0, rollbackReady: false },
  { name: 'ai.riskAssessment', originalApp: 'web-app', targetApp: 'doctors-app', phase: 3, migrated: false, trafficPercentage: 0, rollbackReady: false },
  { name: 'ai.diagnosis', originalApp: 'web-app', targetApp: 'doctors-app', phase: 3, migrated: false, trafficPercentage: 0, rollbackReady: false },
  { name: 'ai.recommendations', originalApp: 'web-app', targetApp: 'doctors-app', phase: 3, migrated: false, trafficPercentage: 0, rollbackReady: false },
  { name: 'appointments.update', originalApp: 'web-app', targetApp: 'doctors-app', phase: 3, migrated: false, trafficPercentage: 0, rollbackReady: false }
]

// Phase 4: Company endpoints
const companyEndpoints: EndpointMigrationStatus[] = [
  { name: 'companies.list', originalApp: 'web-app', targetApp: 'companies-app', phase: 4, migrated: false, trafficPercentage: 0, rollbackReady: false },
  { name: 'companies.get', originalApp: 'web-app', targetApp: 'companies-app', phase: 4, migrated: false, trafficPercentage: 0, rollbackReady: false },
  { name: 'companies.create', originalApp: 'web-app', targetApp: 'companies-app', phase: 4, migrated: false, trafficPercentage: 0, rollbackReady: false },
  { name: 'companies.update', originalApp: 'web-app', targetApp: 'companies-app', phase: 4, migrated: false, trafficPercentage: 0, rollbackReady: false },
  { name: 'jobs.list', originalApp: 'web-app', targetApp: 'companies-app', phase: 4, migrated: false, trafficPercentage: 0, rollbackReady: false },
  { name: 'jobs.get', originalApp: 'web-app', targetApp: 'companies-app', phase: 4, migrated: false, trafficPercentage: 0, rollbackReady: false },
  { name: 'jobs.create', originalApp: 'web-app', targetApp: 'companies-app', phase: 4, migrated: false, trafficPercentage: 0, rollbackReady: false },
  { name: 'jobs.applications.list', originalApp: 'web-app', targetApp: 'companies-app', phase: 4, migrated: false, trafficPercentage: 0, rollbackReady: false },
  { name: 'jobs.applications.get', originalApp: 'web-app', targetApp: 'companies-app', phase: 4, migrated: false, trafficPercentage: 0, rollbackReady: false }
]

// Phase 5: Admin endpoints
const adminEndpoints: EndpointMigrationStatus[] = [
  { name: 'analytics.patientStats', originalApp: 'web-app', targetApp: 'admin-app', phase: 5, migrated: false, trafficPercentage: 0, rollbackReady: false },
  { name: 'analytics.appointmentStats', originalApp: 'web-app', targetApp: 'admin-app', phase: 5, migrated: false, trafficPercentage: 0, rollbackReady: false },
  { name: 'analytics.revenue', originalApp: 'web-app', targetApp: 'admin-app', phase: 5, migrated: false, trafficPercentage: 0, rollbackReady: false }
]

// Phase 6: Distributed endpoints (messaging)
const distributedEndpoints: EndpointMigrationStatus[] = [
  { name: 'messages.list', originalApp: 'web-app', targetApp: 'distributed', phase: 6, migrated: false, trafficPercentage: 0, rollbackReady: false },
  { name: 'messages.send', originalApp: 'web-app', targetApp: 'distributed', phase: 6, migrated: false, trafficPercentage: 0, rollbackReady: false },
  { name: 'messages.get', originalApp: 'web-app', targetApp: 'distributed', phase: 6, migrated: false, trafficPercentage: 0, rollbackReady: false }
]

// Complete migration configuration
export const migrationConfig: AppMigrationConfig = {
  currentPhase: 1,
  totalPhases: 7, // Phase 7 is cleanup
  endpoints: [
    ...gatewayEndpoints,
    ...patientEndpoints,
    ...doctorEndpoints,
    ...companyEndpoints,
    ...adminEndpoints,
    ...distributedEndpoints
  ],
  featureFlags: {
    // Phase 1 flags
    'gateway.backend.enabled': true,
    'gateway.auth.enabled': true,
    'gateway.health.enabled': true,
    'gateway.notifications.enabled': true,
    
    // Phase 2+ flags (disabled initially)
    'patients.migration.enabled': false,
    'doctors.migration.enabled': false,
    'companies.migration.enabled': false,
    'admin.migration.enabled': false,
    'messaging.distributed.enabled': false,
    
    // Development flags
    'development.testing.enabled': process.env.NODE_ENV === 'development',
    'development.migration.dashboard': process.env.NODE_ENV === 'development'
  }
}

// Helper functions
export const getCurrentPhaseEndpoints = () => {
  return migrationConfig.endpoints.filter(ep => ep.phase === migrationConfig.currentPhase)
}

export const getEndpointStatus = (endpointName: string) => {
  return migrationConfig.endpoints.find(ep => ep.name === endpointName)
}

export const updateEndpointMigration = (endpointName: string, updates: Partial<EndpointMigrationStatus>) => {
  const endpoint = migrationConfig.endpoints.find(ep => ep.name === endpointName)
  if (endpoint) {
    Object.assign(endpoint, updates)
  }
}

export const getPhaseProgress = () => {
  const currentPhaseEndpoints = getCurrentPhaseEndpoints()
  const migratedCount = currentPhaseEndpoints.filter(ep => ep.migrated).length
  return {
    total: currentPhaseEndpoints.length,
    migrated: migratedCount,
    percentage: currentPhaseEndpoints.length > 0 ? Math.round((migratedCount / currentPhaseEndpoints.length) * 100) : 0
  }
}

export const isFeatureEnabled = (flagName: string): boolean => {
  return migrationConfig.featureFlags[flagName] || false
}

export default migrationConfig