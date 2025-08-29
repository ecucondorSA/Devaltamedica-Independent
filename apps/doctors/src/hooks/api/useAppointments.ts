// 📅 Re-export de hooks de citas usando la fuente canonical del api-client
// Motivo: @altamedica/hooks ya no expone todos los hooks granulares (solo shims legacy)
// y el paquete @altamedica/medical-hooks está en proceso de deprecación.
// Esta capa mantiene rutas internas stables dentro de apps/doctors.
/*
export {
  useAppointments,
  useAppointment,
  useCreateAppointment,
  useUpdateAppointment,
  useCancelAppointment,
  useConfirmAppointment,
  useRescheduleAppointment,
  useAvailableSlots,
  useCompleteAppointment,
} from '@altamedica/api-client/hooks';
*/
