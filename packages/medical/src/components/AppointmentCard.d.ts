/**
 * Appointment Card Component
 * @module @altamedica/medical/components/AppointmentCard
 */
import React from 'react';
import type { Appointment } from '../types';
export interface AppointmentCardProps {
    appointment: Appointment;
    patientName?: string;
    doctorName?: string;
    onClick?: () => void;
    className?: string;
}
export declare const AppointmentCard: React.FC<AppointmentCardProps>;
//# sourceMappingURL=AppointmentCard.d.ts.map