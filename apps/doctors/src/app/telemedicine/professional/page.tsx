'use client';

import React from 'react';
import ProfessionalTelemedicineCall from '@/components/telemedicine/ProfessionalTelemedicineCall';

import { logger } from '@altamedica/shared';
export default function ProfessionalTelemedicinePage() {
  const handleEndCall = () => {
    logger.info('Llamada finalizada');
    // Aquí puedes agregar lógica para redirigir o mostrar mensaje
  };

  return (
    <ProfessionalTelemedicineCall
      sessionId="professional-session-123"
      doctorId="doctor-1"
      patientId="patient-1"
    />
  );
} 