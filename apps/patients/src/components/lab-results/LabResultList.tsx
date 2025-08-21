import React from "react";
import { LabResult } from '../../types';
import LabResultCard from './LabResultCard';

interface LabResultListProps {
  labResults: LabResult[];
}

const LabResultList: React.FC<LabResultListProps> = ({ labResults }) => {
  if (!labResults || labResults.length === 0) {
    return (
      <div className="text-center text-gray-500 py-12">
        No hay resultados de laboratorio
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4">
      {labResults.map((labResult) => (
        <LabResultCard key={labResult.id} labResult={labResult} />
      ))}
    </div>
  );
};

export default LabResultList;
