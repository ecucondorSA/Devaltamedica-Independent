/**
 * Doctor Card Component
 * @module @altamedica/medical/components/DoctorCard
 */
import React from 'react';
import type { Doctor } from '../types';
export interface DoctorCardProps {
    doctor: Doctor;
    onClick?: () => void;
    showAvailability?: boolean;
    className?: string;
}
export declare const DoctorCard: React.FC<DoctorCardProps>;
//# sourceMappingURL=DoctorCard.d.ts.map