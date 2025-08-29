"use client";

import React from "react";
import { EnhancedDoctorOnboarding } from "@altamedica/ui";

import { logger } from '@altamedica/shared';
export default function DoctorOnboardingPage() {
  const handleComplete = (data: any) => {
    logger.info("Onboarding de médico completado:", data);
    // Aquí se procesarían los datos del médico
    // Se verificarían las credenciales
    // Se configuraría el perfil profesional
    // Se redirigiría al dashboard médico
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedDoctorOnboarding 
        onComplete={handleComplete}
      />
    </div>
  );
} 