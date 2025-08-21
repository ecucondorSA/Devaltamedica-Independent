import { Button, Card, Input } from '@altamedica/ui';
import React from "react";

interface PatientListFiltersProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  resultCount?: number;
  genderFilter?: string;
  onGenderChange?: (value: string) => void;
  statusFilter?: string;
  onStatusChange?: (value: string) => void;
}

const PatientListFilters: React.FC<PatientListFiltersProps> = ({
  searchValue,
  onSearchChange,
  resultCount,
  genderFilter = "",
  onGenderChange,
  statusFilter = "",
  onStatusChange,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-4 mb-4">
      <input
        type="text"
        placeholder="Buscar paciente..."
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        className="px-4 py-2 border rounded-lg w-full max-w-xs"
      />
      <select
        value={genderFilter}
        onChange={(e) => onGenderChange && onGenderChange(e.target.value)}
        className="px-3 py-2 border rounded-lg"
      >
        <option value="">Todos los géneros</option>
        <option value="male">Masculino</option>
        <option value="female">Femenino</option>
        <option value="other">Otro</option>
      </select>
      <select
        value={statusFilter}
        onChange={(e) => onStatusChange && onStatusChange(e.target.value)}
        className="px-3 py-2 border rounded-lg"
      >
        <option value="">Todos</option>
        <option value="active">Activos</option>
        <option value="inactive">Inactivos</option>
      </select>
      {typeof resultCount === "number" && (
        <span className="text-gray-500 text-sm">{resultCount} resultados</span>
      )}
    </div>
  );
};

export default PatientListFilters;
