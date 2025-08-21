"use client";
import { Button, Card, Input } from '@altamedica/ui';
import React, { useState } from "react";
import { usePatients } from '../../hooks/usePatients';
import PatientCard from '../../components/patients/PatientCard';
import PatientListFilters from '../../components/patients/PatientListFilters';

export default function PatientsListPage() {
  const [filters, setFilters] = useState({
    search: "",
    page: 1,
    limit: 12,
    gender: "",
    status: "",
  });
  const { patients, loading, error, pagination, searchPatients } = usePatients({
    initialFetch: true,
    defaultLimit: 12,
  });

  const handleSearch = async (search: string) => {
    setFilters((f) => ({ ...f, search, page: 1 }));
    await searchPatients({ ...filters, search, page: 1 });
  };

  const handleGenderChange = async (gender: string) => {
    setFilters((f) => ({ ...f, gender, page: 1 }));
    await searchPatients({ ...filters, gender, page: 1 });
  };

  const handleStatusChange = async (status: string) => {
    setFilters((f) => ({ ...f, status, page: 1 }));
    await searchPatients({ ...filters, status, page: 1 });
  };

  const handlePageChange = async (page: number) => {
    setFilters((f) => ({ ...f, page }));
    await searchPatients({ ...filters, page });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Pacientes</h1>
        <PatientListFilters
          searchValue={filters.search}
          onSearchChange={handleSearch}
          genderFilter={filters.gender}
          onGenderChange={handleGenderChange}
          statusFilter={filters.status}
          onStatusChange={handleStatusChange}
          resultCount={patients.length}
        />
        {loading ? (
          <div className="text-center py-12">Cargando pacientes...</div>
        ) : error ? (
          <div className="text-center text-red-600 py-12">Error: {error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patients.map((patient) => (
              <PatientCard key={patient.id} patient={patient} />
            ))}
          </div>
        )}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center mt-8 space-x-2">
            {Array.from({ length: pagination.totalPages }, (_, i) => (
              <button
                key={i + 1}
                className={`px-4 py-2 rounded ${pagination.page === i + 1 ? "bg-blue-600 text-white" : "bg-white border"}`}
                onClick={() => handlePageChange(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
