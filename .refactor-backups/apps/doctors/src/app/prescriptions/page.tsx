'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  Filter, 
  Plus, 
  FileText,
  Calendar,
  AlertCircle,
  ChevronRight,
  Clock,
  RefreshCw,
  User,
  Pill,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@altamedica/ui'
import { usePrescriptions, useActivePrescriptions } from '@/hooks/queries/usePrescriptions'
import { useDebounce } from '@altamedica/hooks'

export default function PrescriptionsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [dateRange, setDateRange] = useState('month')

  // Debounce search term
  const debouncedSearch = useDebounce(searchTerm, 500)

  // Fetch prescriptions with filters
  const filters = {
    search: debouncedSearch,
    status: selectedFilter === 'all' ? undefined : selectedFilter as 'active' | 'expired' | 'cancelled',
    dateFrom: dateRange === 'month' ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) : 
              dateRange === 'week' ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) : undefined
  }

  const { data: prescriptions = [], isLoading, error } = usePrescriptions(filters)
  const { data: activePrescriptions = [] } = useActivePrescriptions()

  // Calculate stats
  const stats = {
    total: prescriptions.length,
    active: activePrescriptions.length,
    expiringSoon: prescriptions.filter(p => {
      const validUntil = new Date(p.validUntil)
      const daysLeft = Math.ceil((validUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      return daysLeft > 0 && daysLeft <= 7
    }).length
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prescriptions</h1>
          <p className="text-gray-600">Manage and track patient prescriptions</p>
        </div>
        <Button onClick={() => router.push('/prescriptions/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Prescription
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Prescriptions</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Expiring Soon</p>
              <p className="text-2xl font-bold">{stats.expiringSoon}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
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
              placeholder="Search by patient name, medication, or diagnosis..."
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
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-800">Error loading prescriptions</h4>
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

      {/* Prescription List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading prescriptions...</p>
        </div>
      ) : !error && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="divide-y divide-gray-200">
            {prescriptions.map((prescription) => {
              const validUntilDate = new Date(prescription.validUntil)
              const daysLeft = Math.ceil((validUntilDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              const isExpiringSoon = daysLeft > 0 && daysLeft <= 7

              return (
                <div
                  key={prescription.id}
                  onClick={() => router.push(`/prescriptions/${prescription.id}`)}
                  className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-lg">{prescription.patientName}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(prescription.status)}`}>
                          {getStatusIcon(prescription.status)}
                          <span className="ml-1 capitalize">{prescription.status}</span>
                        </span>
                        {isExpiringSoon && prescription.status === 'active' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Expiring in {daysLeft} days
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-gray-600 mb-3">
                        <p className="font-medium mb-1">{prescription.diagnosis}</p>
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Issued: {new Date(prescription.date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            Valid until: {validUntilDate.toLocaleDateString()}
                          </span>
                          {prescription.refills > 0 && (
                            <span className="flex items-center">
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Refills: {prescription.refillsUsed}/{prescription.refills}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-700">Medications:</p>
                        <div className="flex flex-wrap gap-2">
                          {prescription.medications.map((med, idx) => (
                            <div key={idx} className="inline-flex items-center bg-gray-100 rounded-md px-3 py-1">
                              <Pill className="h-3 w-3 mr-1 text-gray-600" />
                              <span className="text-sm">
                                {med.name} - {med.dosage} ({med.frequency})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="h-5 w-5 text-gray-400 ml-4" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!isLoading && !error && prescriptions.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No prescriptions found</p>
          <Button onClick={() => router.push('/prescriptions/new')}>
            Write Your First Prescription
          </Button>
        </div>
      )}
    </div>
  )
}