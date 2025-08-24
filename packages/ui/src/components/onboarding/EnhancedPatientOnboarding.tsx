'use client';
import React from 'react';
import { ButtonCorporate } from '../corporate/ButtonCorporate';
import {
  CardContentCorporate,
  CardCorporate,
  CardHeaderCorporate,
} from '../corporate/CardCorporate';

export interface EnhancedPatientOnboardingProps {
  onComplete?: (data: Record<string, unknown>) => void;
  onSkip?: () => void;
}

export const EnhancedPatientOnboarding: React.FC<EnhancedPatientOnboardingProps> = ({
  onComplete,
  onSkip,
}) => {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <CardCorporate variant="default" size="md" className="shadow">
        <CardHeaderCorporate className="p-6">
          <h2 className="text-xl font-semibold">Onboarding de Paciente</h2>
          <p className="text-sm text-gray-600">Completa tu información básica para empezar</p>
        </CardHeaderCorporate>
        <CardContentCorporate className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <input className="mt-1 block w-full border rounded-md p-2" placeholder="Juan Pérez" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                className="mt-1 block w-full border rounded-md p-2"
                placeholder="juan@correo.com"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <ButtonCorporate variant="ghost" onClick={() => onSkip?.()}>
                Saltar
              </ButtonCorporate>
              <ButtonCorporate variant="primary" onClick={() => onComplete?.({})}>
                Completar
              </ButtonCorporate>
            </div>
          </div>
        </CardContentCorporate>
      </CardCorporate>
    </div>
  );
};

export default EnhancedPatientOnboarding;
