"use client";

import { Building, Filter, MapPin, Search } from "lucide-react";
import { useState } from "react";

interface CompanyFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedIndustry: string;
  onIndustryChange: (value: string) => void;
  selectedLocation: string;
  onLocationChange: (value: string) => void;
  industries: string[];
  locations: string[];
}

export function CompanyFilters({
  searchTerm,
  onSearchChange,
  selectedIndustry,
  onIndustryChange,
  selectedLocation,
  onLocationChange,
  industries,
  locations,
}: CompanyFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const clearFilters = () => {
    onSearchChange("");
    onIndustryChange("all");
    onLocationChange("all");
  };

  const hasActiveFilters =
    searchTerm || selectedIndustry !== "all" || selectedLocation !== "all";

  return (
    <div className="card-default p-6">
      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar empresas por nombre o descripción..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200"
          aria-label="Buscar empresas"
        />
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center text-slate-600 hover:text-slate-800 transition-colors"
          aria-expanded={showFilters}
          aria-controls="filters-panel"
        >
          <Filter className="w-5 h-5 mr-2" />
          <span className="font-medium">Filtros</span>
          {hasActiveFilters && (
            <span className="ml-2 w-2 h-2 bg-sky-500 rounded-full"></span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-sky-600 hover:text-sky-800 transition-colors"
          >
            Limpiar Filtros
          </button>
        )}
      </div>

      {/* Filters Panel */}
      <div
        id="filters-panel"
        className={`grid gap-4 transition-all duration-300 ${
          showFilters
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Industry Filter */}
            <div>
              <label
                htmlFor="industry-filter"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                <Building className="w-4 h-4 inline mr-2" />
                Sector
              </label>
              <select
                id="industry-filter"
                value={selectedIndustry}
                onChange={(e) => onIndustryChange(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200"
              >
                <option value="all">Todos los sectores</option>
                {industries.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <label
                htmlFor="location-filter"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                <MapPin className="w-4 h-4 inline mr-2" />
                Ubicación
              </label>
              <select
                id="location-filter"
                value={selectedLocation}
                onChange={(e) => onLocationChange(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200"
              >
                <option value="all">Todas las ubicaciones</option>
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-200">
          {searchTerm && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-sky-100 text-sky-800">
              Búsqueda: &quot;{searchTerm}&quot;
              <button
                onClick={() => onSearchChange("")}
                className="ml-2 text-sky-600 hover:text-sky-800"
                aria-label="Eliminar filtro de búsqueda"
              >
                ×
              </button>
            </span>
          )}
          {selectedIndustry !== "all" && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-emerald-100 text-emerald-800">
              Sector: {selectedIndustry}
              <button
                onClick={() => onIndustryChange("all")}
                className="ml-2 text-emerald-600 hover:text-emerald-800"
                aria-label="Eliminar filtro de sector"
              >
                ×
              </button>
            </span>
          )}
          {selectedLocation !== "all" && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
              Ubicación: {selectedLocation}
              <button
                onClick={() => onLocationChange("all")}
                className="ml-2 text-purple-600 hover:text-purple-800"
                aria-label="Eliminar filtro de ubicación"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
