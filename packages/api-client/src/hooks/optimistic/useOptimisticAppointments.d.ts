/**
 * 🚀 OPTIMISTIC UPDATES - APPOINTMENTS
 * Mejora la UX con actualizaciones instantáneas
 */
interface OptimisticAppointment {
    id: string;
    patientId: string;
    doctorId: string;
    date: string;
    time: string;
    type: string;
    status: string;
    reason: string;
}
/**
 * Hook para crear cita con optimistic update y rollback automático
 */
export declare function useOptimisticCreateAppointment(): import("@tanstack/react-query").UseMutationResult<any, Error, Omit<OptimisticAppointment, "status" | "id">, {
    previousAppointments: unknown;
    optimisticAppointment: OptimisticAppointment;
}>;
/**
 * Hook para cancelar cita con feedback instantáneo
 */
export declare function useOptimisticCancelAppointment(): import("@tanstack/react-query").UseMutationResult<any, Error, {
    id: string;
    reason: string;
}, {
    previousAppointments: unknown;
}>;
/**
 * Hook para reprogramar cita con actualización optimista
 */
export declare function useOptimisticRescheduleAppointment(): import("@tanstack/react-query").UseMutationResult<any, Error, {
    id: string;
    newDate: string;
    newTime: string;
}, {
    previousAppointment: unknown;
    previousList: unknown;
}>;
/**
 * Hook para marcar cita como completada con actualización optimista
 */
export declare function useOptimisticCompleteAppointment(): import("@tanstack/react-query").UseMutationResult<any, Error, {
    id: string;
    notes?: string;
    prescriptionId?: string;
}, {
    appointment: unknown;
    list: unknown;
}>;
export {};
