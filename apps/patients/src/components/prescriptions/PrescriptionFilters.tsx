import React from "react";

interface PrescriptionFiltersProps {
  filters: any;
  onFiltersChange: (filters: any) => void;
}

const PrescriptionFilters: React.FC<PrescriptionFiltersProps> = ({
  filters,
  onFiltersChange,
}) => {
  return (
    <div className="mb-6">
      <div className="font-semibold mb-2">Filtros</div>
      <div className="flex flex-col gap-2">
        <input
          type="text"
          placeholder="Buscar por medicamento..."
          value={filters.query || ""}
          onChange={(e) =>
            onFiltersChange({ ...filters, query: e.target.value })
          }
          className="px-3 py-2 border rounded-lg"
        />
        <select
          value={filters.status || ""}
          onChange={(e) =>
            onFiltersChange({ ...filters, status: e.target.value })
          }
          className="px-3 py-2 border rounded-lg"
        >
          <option value="">Todos los estados</option>
          <option value="active">Activa</option>
          <option value="expired">Expirada</option>
          <option value="completed">Completada</option>
        </select>
        <input
          type="date"
          value={filters.dateFrom || ""}
          onChange={(e) =>
            onFiltersChange({ ...filters, dateFrom: e.target.value })
          }
          className="px-3 py-2 border rounded-lg"
        />
        <input
          type="date"
          value={filters.dateTo || ""}
          onChange={(e) =>
            onFiltersChange({ ...filters, dateTo: e.target.value })
          }
          className="px-3 py-2 border rounded-lg"
        />
        <button
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
          onClick={() => onFiltersChange({})}
        >
          Limpiar filtros
        </button>
      </div>
    </div>
  );
};

export default PrescriptionFilters;
