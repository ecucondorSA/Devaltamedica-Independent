import React from 'react';
import { Prescription } from '../../types';
import PrescriptionCard from './PrescriptionCard';

interface PrescriptionListProps {
  prescriptions: Prescription[];
}

const PrescriptionList: React.FC<PrescriptionListProps> = ({ prescriptions }) => {
  if (!prescriptions || prescriptions.length === 0) {
    return <div className="text-center text-gray-500 py-12">No hay prescripciones</div>;
  }
  return (
    <div className="grid grid-cols-1 gap-4">
      {prescriptions.map((prescription) => (
        <PrescriptionCard key={prescription.id} prescription={prescription} />
      ))}
    </div>
  );
};

export default PrescriptionList;
