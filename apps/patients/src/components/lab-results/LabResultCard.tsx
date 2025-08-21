import React from "react";
import { useRouter } from "next/navigation";
import { LabResult } from '../../types';

interface LabResultCardProps {
  labResult: LabResult;
}

const LabResultCard: React.FC<LabResultCardProps> = ({ labResult }) => {
  const router = useRouter();
  return (
    <div
      className="bg-white rounded-xl shadow p-4 flex flex-col hover:shadow-lg transition cursor-pointer"
      onClick={() => router.push(`/lab-results/${labResult.id}`)}
    >
      <div className="font-bold text-lg mb-1">{labResult.testName}</div>
      <div className="text-gray-600 text-sm mb-2">
        {labResult.date} • {labResult.status}
      </div>
      <div className="text-gray-500 text-xs">
        Laboratorio: {labResult.laboratoryName}
      </div>
      <div className="mt-2 text-blue-600 text-sm">Ver detalle &rarr;</div>
    </div>
  );
};

export default LabResultCard;
