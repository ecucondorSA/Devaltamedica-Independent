import React from "react";
import { useRouter } from "next/navigation";
import { Patient } from '../../types';

interface PatientCardProps {
  patient: Patient;
}

const PatientCard: React.FC<PatientCardProps> = ({ patient }) => {
  const router = useRouter();
  return (
    <div
      className="bg-white rounded-xl shadow p-4 flex flex-col hover:shadow-lg transition cursor-pointer"
      onClick={() => router.push(`/patients/${patient.id}`)}
    >
      <div className="font-bold text-lg mb-1">
        {patient.firstName} {patient.lastName}
      </div>
      <div className="text-gray-600 text-sm mb-2">{patient.email}</div>
      <div className="text-gray-500 text-xs">
        {patient.dateOfBirth} | {patient.gender}
      </div>
      <div className="mt-2 text-blue-600 text-sm">Ver detalle &rarr;</div>
    </div>
  );
};

export default PatientCard;
