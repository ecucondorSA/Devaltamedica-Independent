'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft,
  Calendar,
  User,
  FileText,
  Pill,
  Clock,
  RefreshCw,
  Printer,
  Download,
  Edit,
  XCircle,
  CheckCircle,
  AlertTriangle,
  Building,
  Phone,
  Mail
} from 'lucide-react'
import { Button } from '@altamedica/ui'
import { 
  usePrescription, 
  useCancelPrescription, 
  useRefillPrescription 
} from '@/hooks/queries/usePrescriptions'
import { usePatient } from '@/hooks/queries/usePatients'

import { logger } from '@altamedica/shared';
export default function PrescriptionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const prescriptionId = params.id as string

  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showRefillModal, setShowRefillModal] = useState(false)

  // Fetch prescription data
  const { data: prescription, isLoading, error } = usePrescription(prescriptionId)
  const { data: patient } = usePatient(prescription?.patientId || '')
  
  // Mutations
  const cancelPrescription = useCancelPrescription()
  const refillPrescription = useRefillPrescription()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !prescription) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Error loading prescription
          </h2>
          <p className="text-red-700">
            {error instanceof Error ? error.message : 'Prescription not found'}
          </p>
          <Button 
            className="mt-4" 
            variant="outline"
            onClick={() => router.push('/prescriptions')}
          >
            Back to Prescriptions
          </Button>
        </div>
      </div>
    )
  }

  const validUntilDate = new Date(prescription.validUntil)
  const daysLeft = Math.ceil((validUntilDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  const isExpiringSoon = daysLeft > 0 && daysLeft <= 7
  const isExpired = daysLeft < 0

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'expired':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-gray-600" />
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

  const handleCancel = async () => {
    try {
      await cancelPrescription.mutateAsync(prescriptionId)
      setShowCancelModal(false)
    } catch (error) {
      logger.error('Failed to cancel prescription:', String(error))
    }
  }

  const handleRefill = async () => {
    try {
      await refillPrescription.mutateAsync(prescriptionId)
      setShowRefillModal(false)
    } catch (error) {
      logger.error('Failed to refill prescription:', String(error))
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // In a real app, this would generate a PDF
    alert('Download functionality would be implemented here')
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/prescriptions')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Prescriptions
        </button>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              Prescription Details
            </h1>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(prescription.status)}`}>
                {getStatusIcon(prescription.status)}
                <span className="ml-1 capitalize">{prescription.status}</span>
              </span>
              {isExpiringSoon && prescription.status === 'active' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Expiring in {daysLeft} days
                </span>
              )}
              {isExpired && prescription.status === 'active' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-200">
                  <XCircle className="h-4 w-4 mr-1" />
                  Expired
                </span>
              )}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
            {prescription.status === 'active' && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push(`/prescriptions/${prescriptionId}/edit`)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => setShowCancelModal(true)}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Patient Information */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <User className="h-5 w-5 mr-2" />
          Patient Information
        </h2>
        
        {patient ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-medium">{patient.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date of Birth</p>
              <p className="font-medium">
                {patient.birthDate ? new Date(patient.birthDate).toLocaleDateString() : 'Not provided'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium flex items-center">
                <Mail className="h-4 w-4 mr-1 text-gray-500" />
                {patient.email}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-medium flex items-center">
                <Phone className="h-4 w-4 mr-1 text-gray-500" />
                {patient.phoneNumber || 'Not provided'}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">Loading patient information...</p>
        )}
      </div>

      {/* Prescription Information */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Prescription Information
        </h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Prescription ID</p>
              <p className="font-medium font-mono">{prescription.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Prescribed By</p>
              <p className="font-medium">{prescription.doctorName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date Issued</p>
              <p className="font-medium flex items-center">
                <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                {new Date(prescription.date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Valid Until</p>
              <p className="font-medium flex items-center">
                <Clock className="h-4 w-4 mr-1 text-gray-500" />
                {validUntilDate.toLocaleDateString()}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600">Diagnosis</p>
            <p className="font-medium">{prescription.diagnosis}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Instructions</p>
            <p className="font-medium">{prescription.instructions}</p>
          </div>

          {prescription.pharmacy && (
            <div>
              <p className="text-sm text-gray-600">Preferred Pharmacy</p>
              <p className="font-medium flex items-center">
                <Building className="h-4 w-4 mr-1 text-gray-500" />
                {prescription.pharmacy}
              </p>
            </div>
          )}

          {prescription.notes && (
            <div>
              <p className="text-sm text-gray-600">Additional Notes</p>
              <p className="font-medium">{prescription.notes}</p>
            </div>
          )}

          <div>
            <p className="text-sm text-gray-600">Refills</p>
            <p className="font-medium flex items-center">
              <RefreshCw className="h-4 w-4 mr-1 text-gray-500" />
              {prescription.refillsUsed} of {prescription.refills} used
              {prescription.status === 'active' && prescription.refillsUsed < prescription.refills && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="ml-4"
                  onClick={() => setShowRefillModal(true)}
                >
                  Request Refill
                </Button>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Medications */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Pill className="h-5 w-5 mr-2" />
          Medications
        </h2>
        
        <div className="space-y-4">
          {prescription.medications.map((medication, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-lg mb-2">{medication.name}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Dosage:</span>
                      <span className="ml-2 font-medium">{medication.dosage}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Frequency:</span>
                      <span className="ml-2 font-medium">{medication.frequency}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Duration:</span>
                      <span className="ml-2 font-medium">{medication.duration}</span>
                    </div>
                  </div>
                  {medication.instructions && (
                    <div className="mt-2 text-sm">
                      <span className="text-gray-600">Special Instructions:</span>
                      <span className="ml-2 font-medium">{medication.instructions}</span>
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Pill className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Cancel Prescription</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel this prescription? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowCancelModal(false)}
              >
                Keep Active
              </Button>
              <Button 
                className="bg-red-600 hover:bg-red-700"
                onClick={handleCancel}
                disabled={cancelPrescription.isPending}
              >
                {cancelPrescription.isPending ? 'Cancelling...' : 'Cancel Prescription'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Refill Modal */}
      {showRefillModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Request Refill</h3>
            <p className="text-gray-600 mb-6">
              This will request a refill for this prescription. The patient will be notified.
            </p>
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowRefillModal(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleRefill}
                disabled={refillPrescription.isPending}
              >
                {refillPrescription.isPending ? 'Processing...' : 'Request Refill'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}