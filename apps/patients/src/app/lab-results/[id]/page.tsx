'use client';
import { Button, Card, Input } from '@altamedica/ui';
import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import { useLabResult } from '../../../hooks/useLabResults';
import LabResultDetailCard from '../../../components/lab-results/LabResultDetailCard';

export default function LabResultDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  return (
    <div className="max-w-3xl mx-auto">
      <button className="mb-4 text-blue-600" onClick={() => router.back()}>
        &larr; Volver
      </button>
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">
          Detalle de resultado de laboratorio temporalmente deshabilitado
        </p>
        <p className="text-sm text-gray-400">
          Se mostrará cuando se resuelvan los problemas de compatibilidad de interfaces
        </p>
      </div>
    </div>
  );
}
