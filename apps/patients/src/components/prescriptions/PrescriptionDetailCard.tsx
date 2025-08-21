import React from "react";
import { Prescription } from '../../types';

interface PrescriptionDetailCardProps {
  prescription: Prescription;
}

const PrescriptionDetailCard: React.FC<PrescriptionDetailCardProps> = ({
  prescription,
}) => {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-xl font-bold mb-2">{prescription.medicationName}</h2>
      <div className="text-gray-600 mb-2">
        {prescription.dosage} • {prescription.frequency}
      </div>
      <div className="mb-4 text-gray-700">{prescription.instructions}</div>
      <div className="text-gray-500 text-xs mb-2">
        Prescrito por: {prescription.prescribedBy}
      </div>
      <div className="text-gray-500 text-xs mb-2">
        Fecha: {prescription.date}
      </div>
      <div className="text-gray-500 text-xs mb-2">
        Estado: {prescription.status}
      </div>
      {prescription.attachments && prescription.attachments.length > 0 && (
        <div className="mb-2">
          <div className="font-semibold">Archivos adjuntos:</div>
          <ul className="list-disc list-inside text-sm">
            {prescription.attachments.map((a, i) => (
              <li key={i}>
                <a href={a.url} className="text-blue-600 underline">
                  {a.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PrescriptionDetailCard;
