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
      <h2 className="text-xl font-bold mb-2">{labResult.testName}</h2>
      <div className="text-gray-600 mb-2">
        {labResult.date} • {labResult.status}
      </div>
      <div className="mb-4 text-gray-700">{labResult.resultSummary}</div>
      <div className="text-gray-500 text-xs mb-2">
        Laboratorio: {labResult.laboratoryName}
      </div>
      <div className="text-gray-500 text-xs mb-2">
        Médico solicitante: {labResult.requestedBy}
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
