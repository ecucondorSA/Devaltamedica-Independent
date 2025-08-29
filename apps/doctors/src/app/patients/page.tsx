'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  Filter, 
  Plus, 
  Users,
  User,
  Calendar,
  Phone,
  Mail,
  MoreVertical,
  ChevronRight,
  Activity,
  FileText,
  AlertCircle
} from 'lucide-react'
import { PatientCard } from '@altamedica/medical'
import { Button } from '@altamedica/ui'
import { usePatients } from '@/hooks/queries/usePatients'
import { PatientProfile } from '@altamedica/types';
import { useDebounce } from '@altamedica/hooks';
import { SimplePatient, toSimplePatient } from '../../types';


export default function PatientsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState('all')

  // Debounce search term to avoid too many API calls
  const debouncedSearch = useDebounce(searchTerm, 500)

  // Use React Query hook
  const { data: patientProfiles = [], isLoading, error } = usePatients({
    search: debouncedSearch,
    status: selectedFilter === 'all' ? undefined : selectedFilter
  });

  // Map PatientProfile to simple Patient for UI
  const patients: SimplePatient[] = useMemo(() => patientProfiles.map(toSimplePatient), [patientProfiles]);

  // Compute stats from the data
  const stats = useMemo(() => ({
    total: patients.length,
    active: patients.filter((p: SimplePatient) => p.status === 'active').length,
    new: patients.filter((p: SimplePatient) => p.status === 'inactive').length // Placeholder logic for 'new'
  }), [patients]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patients</h1>
          <p className="text-gray-600">Manage your patient records and medical history</p>
        </div>
        <Button onClick={() => router.push('/patients/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Patient
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Patients</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Patients</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
            <Activity className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">New This Month</p>
              <p className="text-2xl font-bold">{stats.new}</p>
            </div>
            <User className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search patients by name, email, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Patients</option>
              <option value="active">Active</option>
              <option value="new">New</option>
            </select>
            <Button variant="outline" onClick={() => setFilterOpen(!filterOpen)}>
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-800">Error loading patients</h4>
              <p className="text-sm text-red-700 mt-1">
                {error instanceof Error ? error.message : 'An unexpected error occurred'}
              </p>
              <Button 
                size="sm" 
                variant="outline" 
                className="mt-2"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Patient List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading patients...</p>
        </div>
      ) : !error && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {patients.map((patient: SimplePatient) => (
            <div
              key={patient.id}
              onClick={() => router.push(`/patients/${patient.id}`)}
              className="cursor-pointer transform transition-transform hover:scale-105"
            >
              <PatientCard patient={patient} />
              <div className="mt-2 bg-white p-3 rounded-lg shadow-sm border">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-1" />
                      {/* Last visit: {patient.lastVisit || 'Never'} */}
                    </span>
                    <span className="flex items-center text-gray-600">
                      <FileText className="h-4 w-4 mr-1" />
                      {/* {patient.recordCount || 0} records */}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && !error && patients.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No patients found</p>
          <Button className="mt-4" onClick={() => router.push('/patients/new')}>
            Add Your First Patient
          </Button>
        </div>
      )}
    </div>
  )
}