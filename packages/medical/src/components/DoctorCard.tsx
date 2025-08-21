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

export const DoctorCard: React.FC<DoctorCardProps> = ({ 
  doctor, 
  onClick,
  showAvailability = false,
  className = ''
}) => {
  const nextAvailable = doctor.availability?.[0]; // Simplified for demo
  
  return (
    <div 
      className={`medical-card p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{doctor.name}</h3>
          <p className="text-blue-600 font-medium">{doctor.specialization}</p>
          <p className="text-sm text-gray-500 mt-1">
            License: {doctor.licenseNumber}
          </p>
          
          {doctor.yearsOfExperience && (
            <p className="text-sm text-gray-600 mt-1">
              {doctor.yearsOfExperience} years experience
            </p>
          )}
        </div>
        
        <div className="text-right">
          {doctor.languages && doctor.languages.length > 0 && (
            <div className="mb-2">
              {doctor.languages.map((lang: string, idx: number) => (
                <span 
                  key={idx}
                  className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded mr-1 mb-1"
                >
                  {lang}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {showAvailability && nextAvailable && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-sm text-green-600">
            Available today at {nextAvailable.startTime}
          </p>
        </div>
      )}
      
      {doctor.hospitalAffiliations && doctor.hospitalAffiliations.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-gray-500 mb-1">Affiliated with:</p>
          <div className="flex flex-wrap gap-1">
            {doctor.hospitalAffiliations.map((hospital: string, idx: number) => (
              <span 
                key={idx}
                className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded"
              >
                {hospital}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};