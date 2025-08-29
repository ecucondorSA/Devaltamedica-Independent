import { Button, Card, Input } from '@altamedica/ui';
import React from "react";
import { LabResult } from '../../types';

interface LabResultDetailCardProps {
  labResult: LabResult;
}

const LabResultDetailCard: React.FC<LabResultDetailCardProps> = ({
  labResult,
}) => {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-xl font-bold mb-2">{(labResult as any).testName || labResult.testType || 'Examen'}</h2>
      <div className="text-gray-600 mb-2">
        {(labResult as any).date || (labResult.createdAt ? new Date(labResult.createdAt).toLocaleDateString() : 'N/A')} • {labResult.status || 'Pendiente'}
      </div>
      <div className="mb-4 text-gray-700">{(labResult as any).resultSummary || 'Sin resumen disponible'}</div>
      <div className="text-gray-500 text-xs mb-2">
        Laboratorio: {(labResult as any).laboratoryName || labResult.laboratory || 'N/A'}
      </div>
      <div className="text-gray-500 text-xs mb-2">
        Médico solicitante: {(labResult as any).requestedBy || 'N/A'}
      </div>
      {labResult.attachments && labResult.attachments.length > 0 && (
        <div className="mb-2">
          <div className="font-semibold">Archivos adjuntos:</div>
          <ul className="list-disc list-inside text-sm">
            {labResult.attachments.map((a, i) => (
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

export default LabResultDetailCard;
