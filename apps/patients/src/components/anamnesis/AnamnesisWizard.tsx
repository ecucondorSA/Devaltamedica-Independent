'use client';
import { Button, Card, Input } from '@altamedica/ui';
import { ESCENAS, SECCIONES_ANAMNESIS } from '../../data/anamnesis-data';
import { useAnamnesis } from '../../hooks/useAnamnesis';

export function AnamnesisWizard() {
  return (
    <div className="max-w-2xl mx-auto space-y-4 p-4 border rounded-md bg-white shadow">
      <h1 className="text-xl font-semibold">Anamnesis</h1>
      <div className="text-sm text-gray-600">Funcionalidad temporalmente deshabilitada</div>
      <div className="p-3 bg-blue-50 rounded">
        <p className="text-gray-600">Esta funcionalidad estará disponible próximamente</p>
      </div>
    </div>
  );
}
