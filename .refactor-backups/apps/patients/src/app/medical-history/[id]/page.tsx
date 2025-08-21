"use client";
import { Button, Card, Input } from '@altamedica/ui';
import React from "react";
import { useRouter } from "next/navigation";
import { useMedicalRecord } from '../../../hooks/useMedicalHistory';
// import RecordDetails from "../../../components/medical-history/RecordDetails";
// import ExportPanel from "../../../components/medical-history/ExportPanel";

export default function MedicalRecordDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const { record, loading, error } = useMedicalRecord(id);
  const router = useRouter();

  if (loading)
    return <div className="text-center py-12">Cargando registro...</div>;
  if (error || !record)
    return (
      <div className="text-center text-red-600 py-12">
        Registro no encontrado
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto">
      <button className="mb-4 text-blue-600" onClick={() => router.back()}>
        &larr; Volver
      </button>
      {/* <RecordDetails record={record} /> */}
      <div>Detalle del registro médico ID: {id}</div>
      <div className="mt-6">
        {/* <ExportPanel records={[record]} /> */}
      </div>
    </div>
  );
}
