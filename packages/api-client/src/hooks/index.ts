/**
 * 🪝 REACT QUERY HOOKS - ALTAMEDICA
 * Hooks personalizados para gestión de datos con caché y optimizaciones
 */

export {
	useDashboardAnalytics,
	useMetrics,
	useGenerateReport,
	useExportData,
	useRealtimeAnalytics,
	useTrends,
	useCustomKPIs,
} from './useAnalytics';

export { useAppointments } from './useAppointments';

export {
	useLogin,
	useRegister,
	useLogout,
	useCurrentUser,
	useRefreshToken,
	useForgotPassword,
	useResetPassword,
	useVerifyEmail,
	useUpdateProfile,
	useChangePassword,
	useUpdateAvatar,
} from './useAuth';

export {
	useCompanies,
	useCompany,
	useCreateCompany,
	useUpdateCompany,
	useCompanyEmployees,
	useAddCompanyEmployee,
	useRemoveCompanyEmployee,
	useCompanyBenefits,
	useCompanyInvoices,
	useCompanyStats,
} from './useCompanies';

export {
	useDoctors,
	useDoctor,
	useCreateDoctor,
	useUpdateDoctor,
	useDoctorAvailability,
	useDoctorSchedule,
	useUpdateDoctorSchedule,
	useDoctorPatients,
	useDoctorReviews,
	useAddDoctorReview,
} from './useDoctors';

export {
	useMarketplaceListings,
	useMarketplaceListing,
	useCreateListing,
	useUpdateListing,
	useDeleteListing,
	useApplyToListing,
	useApplications,
	useUpdateApplication,
	useMarketplaceStats,
	useMarketplaceRecommendations,
} from './useMarketplace';

export {
	useNotifications,
	useNotification,
	useMarkNotificationAsRead,
	useMarkAllNotificationsAsRead,
	useUnreadNotificationsCount,
	useNotificationPreferences,
	useUpdateNotificationPreferences,
	useDeleteNotification,
	useDeleteOldNotifications,
	useSubscribeToPushNotifications,
	useUnsubscribeFromPushNotifications,
} from './useNotifications';

export {
	usePatients,
	usePatient,
	useCreatePatient,
	useUpdatePatient,
	useDeletePatient,
	usePatientAppointments,
	usePatientMedicalHistory,
	usePatientPrescriptions,
	usePatientDocuments,
	useUploadPatientDocument,
} from './usePatients';

// prescriptions are provided by the centralized hooks package (stable d.ts available)
export { usePrescriptions, usePrescription } from '@altamedica/hooks';

export {
	useTelemedicineSessions,
	useTelemedicineSession,
	useCreateTelemedicineSession,
	useJoinTelemedicineSession,
	useEndTelemedicineSession,
	useIceServers,
	useSessionRecordings,
	useReportTechnicalIssue,
	useBrowserCompatibility,
} from './useTelemedicine';

// Re-export common query utilities from centralized hooks
// Evitar dependencia cíclica con @altamedica/hooks
export { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
