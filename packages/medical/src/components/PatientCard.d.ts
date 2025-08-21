/**
 * Patient Card Component
 * @module @altamedica/medical/components/PatientCard
 */
import React from 'react';
import type { Patient } from '../types';
export interface PatientCardProps {
    patient: Patient;
    onClick?: () => void;
    className?: string;
}
export declare const PatientCard: React.FC<PatientCardProps>;
//# sourceMappingURL=PatientCard.d.ts.map