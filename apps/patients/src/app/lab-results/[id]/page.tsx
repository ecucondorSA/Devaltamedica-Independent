"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useLabResult } from '../../../hooks/useLabResults';
import LabResultDetailCard from '../../../components/lab-results/LabResultDetailCard';

export default function LabResultDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const { labResult, loading, error } = useLabResult(id);
  const router = useRouter();

  if (loading)
    return <div className="text-center py-12">Cargando resultado...</div>;
  if (error || !labResult)
    return (
      <div className="text-center text-red-600 py-12">
        Resultado no encontrado
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto">
      <button className="mb-4 text-blue-600" onClick={() => router.back()}>
        &larr; Volver
      </button>
      <LabResultDetailCard labResult={labResult} />
    </div>
  );
}
