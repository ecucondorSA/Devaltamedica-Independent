import { Button, Card, Input } from '@altamedica/ui';
import React from "react";
import { Patient } from '../../types';

interface PatientDetailCardProps {
  patient: Patient;
}

const PatientDetailCard: React.FC<PatientDetailCardProps> = ({ patient }) => {
  return (
    <div className="bg-white rounded-xl shadow p-6 w-full">
      <h2 className="text-xl font-bold mb-2">
        {patient.firstName} {patient.lastName}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <div className="font-semibold">Email:</div>
          <div>{patient.email}</div>
        </div>
        <div>
          <div className="font-semibold">Teléfono:</div>
          <div>{patient.phoneNumber || "Sin teléfono"}</div>
        </div>
        <div>
          <div className="font-semibold">Fecha de nacimiento:</div>
          <div>{patient.dateOfBirth}</div>
        </div>
        <div>
          <div className="font-semibold">Género:</div>
          <div>{patient.gender}</div>
        </div>
        <div>
          <div className="font-semibold">Activo:</div>
          <div>{patient.isActive ? "Sí" : "No"}</div>
        </div>
        {patient.bloodType && (
          <div>
            <div className="font-semibold">Grupo sanguíneo:</div>
            <div>{patient.bloodType}</div>
          </div>
        )}
      </div>
      {patient.allergies && patient.allergies.length > 0 && (
        <div className="mb-4">
          <div className="font-semibold mb-1">Alergias:</div>
          <ul className="list-disc list-inside text-sm text-red-700">
            {patient.allergies.map((a, i) => (
              <li key={i}>
                {a.allergen} ({a.severity})
              </li>
            ))}
          </ul>
        </div>
      )}
      {patient.currentMedications && patient.currentMedications.length > 0 && (
        <div className="mb-4">
          <div className="font-semibold mb-1">Medicación actual:</div>
          <ul className="list-disc list-inside text-sm text-blue-700">
            {patient.currentMedications.map((m, i) => (
              <li key={i}>
                {m.name} ({m.dosage}, {m.frequency})
              </li>
            ))}
          </ul>
        </div>
      )}
      {patient.insuranceInfo && (
        <div className="mb-4">
          <div className="font-semibold">Seguro médico:</div>
          <div className="text-sm text-gray-700">
            {patient.insuranceInfo.provider} -{" "}
            {patient.insuranceInfo.policyNumber}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDetailCard;
