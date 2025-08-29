// This file explicitly re-exports all hooks to avoid naming conflicts
// and provide a single entry point for the /hooks sub-path.

export { 
    useDashboardAnalytics,
    useMetrics,
    useGenerateReport,
    useExportData,
    useRealtimeAnalytics,
    useTrends,
    useCustomKPIs
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
    useUpdateAvatar
} from './useAuth';
export { useCompanies } from './useCompanies';
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
    useAddDoctorReview
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
    useMarketplaceRecommendations
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
    useUnsubscribeFromPushNotifications
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
    useUploadPatientDocument
} from './usePatients';
export { usePrescriptions } from './usePrescriptions';
export { 
    useTelemedicineSessions,
    useTelemedicineSession,
    useCreateTelemedicineSession,
    useJoinTelemedicineSession,
    useEndTelemedicineSession,
    useIceServers,
    useSessionRecordings,
    useReportTechnicalIssue,
    useBrowserCompatibility
} from './useTelemedicine';
