/**
 * 🔗 B2C COMMUNICATION SERVICE - ALTAMEDICA DATABASE
 * Servicios de comunicación entre Companies y Doctors
 * 
 * @deprecated Este servicio está obsoleto. Use MarketplaceRepository y ApplicationRepository en su lugar.
 * Este servicio viola las mejores prácticas usando Firebase Client SDK sin ServiceContext.
 * Será eliminado en la próxima versión.
 * 
 * @note TEMPORARILY DISABLED for build compatibility. All methods return mock data.
 */

// Stub exports to maintain compatibility
export const jobApplicationsService = {
  createApplication: () => Promise.resolve(null),
  getApplicationsByDoctor: () => Promise.resolve([]),
  getApplicationsByCompany: () => Promise.resolve([]),
  updateApplicationStatus: () => Promise.resolve(null),
};

export const interviewsService = {
  scheduleInterview: () => Promise.resolve(null),
  getInterviewsByDoctor: () => Promise.resolve([]),
  getInterviewsByCompany: () => Promise.resolve([]),
  updateInterviewStatus: () => Promise.resolve(null),
};

export const companyDoctorRelationshipService = {
  createRelationship: () => Promise.resolve(null),
  getRelationshipsByDoctor: () => Promise.resolve([]),
  getRelationshipsByCompany: () => Promise.resolve([]),
  updateRelationshipStatus: () => Promise.resolve(null),
};

export const communicationEventsService = {
  createEvent: () => Promise.resolve(null),
  getEventsByParticipant: () => Promise.resolve([]),
  markEventAsRead: () => Promise.resolve(null),
};

export const messagingService = {
  sendMessage: () => Promise.resolve(null),
  getMessages: () => Promise.resolve([]),
  markAsRead: () => Promise.resolve(null),
};

export const notificationsService = {
  sendNotification: () => Promise.resolve(null),
  getNotifications: () => Promise.resolve([]),
  markAsRead: () => Promise.resolve(null),
};

export const realtimeService = {
  subscribe: () => Promise.resolve(() => {}),
  unsubscribe: () => Promise.resolve(null),
  publish: () => Promise.resolve(null),
};