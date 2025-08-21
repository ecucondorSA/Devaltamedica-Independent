import React from "react";
import { useRouter } from "next/navigation";
import { Prescription } from '../../types';

interface PrescriptionCardProps {
  prescription: Prescription;
}

const PrescriptionCard: React.FC<PrescriptionCardProps> = ({
  prescription,
}) => {
  const router = useRouter();
  return (
    <div
      className="bg-white rounded-xl shadow p-4 flex flex-col hover:shadow-lg transition cursor-pointer"
      onClick={() => router.push(`/prescriptions/${prescription.id}`)}
    >
      <div className="font-bold text-lg mb-1">
        {prescription.medicationName}
      </div>
      <div className="text-gray-600 text-sm mb-2">
        {prescription.dosage} • {prescription.frequency}
      </div>
      <div className="text-gray-500 text-xs">
        Prescrito por: {prescription.prescribedBy}
      </div>
      <div className="mt-2 text-blue-600 text-sm">Ver detalle &rarr;</div>
    </div>
  );
};

export default PrescriptionCard;
