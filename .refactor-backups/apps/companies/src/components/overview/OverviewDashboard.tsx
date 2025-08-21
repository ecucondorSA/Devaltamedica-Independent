'use client';

import { Button, Card, Input } from '@altamedica/ui';
import React, { useState } from 'react';
import CompanyOnboarding from '../onboarding/CompanyOnboarding';

export default function OverviewDashboard() {
  // Check if company has completed onboarding (mock for now)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  if (!hasCompletedOnboarding) {
    return <CompanyOnboarding />;
  }

  // If onboarding is complete, show minimal dashboard
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <span className="text-5xl mb-4 block">🎉</span>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">¡Bienvenido a AltaMedica!</h2>
          <p className="text-gray-600 mb-6">Tu empresa ha sido registrada exitosamente</p>
          
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-2xl mb-2 block">👨‍⚕️</span>
              <p className="font-medium">Gestionar Personal</p>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-2xl mb-2 block">💼</span>
              <p className="font-medium">Publicar Ofertas</p>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-2xl mb-2 block">📅</span>
              <p className="font-medium">Ver Citas</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}