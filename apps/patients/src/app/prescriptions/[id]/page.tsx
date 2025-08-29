'use client';
import { Button, Card, Input } from '@altamedica/ui';
import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import { usePrescriptions } from '@altamedica/hooks';
import PrescriptionDetailCard from '../../../components/prescriptions/PrescriptionDetailCard';

export default function PrescriptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { prescriptions, isLoading: loading, error } = usePrescriptions();
  const prescription = prescriptions?.find((p: any) => p.id === id);
  const router = useRouter();

  if (loading) return <div className="text-center py-12">Cargando prescripción...</div>;
  if (error || !prescription)
    return <div className="text-center text-red-600 py-12">Prescripción no encontrada</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <button className="mb-4 text-blue-600" onClick={() => router.back()}>
        &larr; Volver
      </button>
      <PrescriptionDetailCard prescription={prescription} />
    </div>
  );
}
