/**
 * Patient Card Component
 * @module @altamedica/medical/components/PatientCard
 */

import React from 'react';
import type { Patient } from '../types';
import { calculateAge } from '../utils';

export interface PatientCardProps {
  patient: Patient;
  onClick?: () => void;
  className?: string;
}

export const PatientCard: React.FC<PatientCardProps> = ({ 
  patient, 
  onClick,
  className = ''
}) => {
  const age = patient.birthDate ? calculateAge(patient.birthDate) : null;
  
  return (
    <div 
      className={`medical-card p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer ${className}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{patient.name}</h3>
          {/* <p className="text-gray-600 text-sm">{patient.email}</p> */}
          {/* {patient.phoneNumber && (
            <p className="text-gray-500 text-sm">{patient.phoneNumber}</p>
          )} */}
        </div>
        {age !== null && (
          <div className="text-right">
            <span className="text-2xl font-bold text-blue-600">{age}</span>
            <p className="text-xs text-gray-500">years</p>
          </div>
        )}
      </div>
      
      {patient.medicalRecordId && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-gray-500">
            Medical Record: <span className="font-mono">{patient.medicalRecordId}</span>
          </p>
        </div>
      )}
      
      {patient.conditions && patient.conditions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {patient.conditions.slice(0, 3).map((condition: string, idx: number) => (
            <span 
              key={idx}
              className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full"
            >
              {condition}
            </span>
          ))}
          {patient.conditions.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              +{patient.conditions.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  );
};