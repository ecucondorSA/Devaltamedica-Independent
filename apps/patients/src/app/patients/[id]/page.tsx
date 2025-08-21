"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { usePatient } from '../../../hooks/usePatients';
import PatientDetailCard from '../../../components/patients/PatientDetailCard';

export default function PatientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const { patient, loading, error } = usePatient(id);
  const router = useRouter();

  if (loading)
    return <div className="text-center py-12">Cargando paciente...</div>;
  if (error || !patient)
    return (
      <div className="text-center text-red-600 py-12">
        Paciente no encontrado
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <button className="mb-4 text-blue-600" onClick={() => router.back()}>
        &larr; Volver
      </button>
      <div className="max-w-2xl mx-auto">
        <PatientDetailCard patient={patient} />
        <div className="flex flex-wrap gap-4 mt-6">
          <button
            className="btn-primary"
            onClick={() =>
              router.push(`/medical-history?patientId=${patient.id}`)
            }
          >
            Ver historial médico
          </button>
          <button
            className="btn-secondary"
            onClick={() => router.push(`/appointments?patientId=${patient.id}`)}
          >
            Ver citas
          </button>
          <button
            className="btn-secondary"
            onClick={() =>
              router.push(`/prescriptions?patientId=${patient.id}`)
            }
          >
            Ver prescripciones
          </button>
        </div>
      </div>
    </div>
  );
}
