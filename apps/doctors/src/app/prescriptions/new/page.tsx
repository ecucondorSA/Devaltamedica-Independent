'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft,
  Plus,
  Trash2,
  Calendar,
  User,
  FileText,
  Pill,
  AlertCircle,
  Search
} from 'lucide-react'
import { Button } from '@altamedica/ui'
import { useCreatePrescription, type Medication } from '@/hooks/queries/usePrescriptions'
import { usePatients } from '@/hooks/queries/usePatients'
import { z } from 'zod'
import { SimplePatient } from '@/types'

// Form validation schema
const prescriptionFormSchema = z.object({
  patientId: z.string().min(1, 'Please select a patient'),
  diagnosis: z.string().min(5, 'Diagnosis must be at least 5 characters'),
  instructions: z.string().min(10, 'Instructions must be at least 10 characters'),
  validUntil: z.string().refine((val) => {
    const date = new Date(val)
    return date > new Date()
  }, 'Valid until date must be in the future'),
  refills: z.number().min(0).max(12),
  pharmacy: z.string().optional(),
  notes: z.string().optional(),
  medications: z.array(z.object({
    name: z.string().min(1, 'Medication name is required'),
    dosage: z.string().min(1, 'Dosage is required'),
    frequency: z.string().min(1, 'Frequency is required'),
    duration: z.string().min(1, 'Duration is required'),
    instructions: z.string().optional()
  })).min(1, 'At least one medication is required')
})

export default function NewPrescriptionPage() {
  const router = useRouter()
  const createPrescription = useCreatePrescription()
  const { data: patients = [] } = usePatients()

  // Form state
  const [patientSearch, setPatientSearch] = useState('')
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [instructions, setInstructions] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [refills, setRefills] = useState(0)
  const [pharmacy, setPharmacy] = useState('')
  const [notes, setNotes] = useState('')
  const [medications, setMedications] = useState<Medication[]>([
    { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
  ])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)

  // Filter patients based on search
  const filteredPatients = patients.filter((patient: SimplePatient) => 
    patient.firstName.toLowerCase().includes(patientSearch.toLowerCase()) ||
    patient.lastName.toLowerCase().includes(patientSearch.toLowerCase()) ||
    patient.email.toLowerCase().includes(patientSearch.toLowerCase())
  )

  const selectedPatient = patients.find((p: SimplePatient) => p.id === selectedPatientId)

  const addMedication = () => {
    setMedications([...medications, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }])
  }

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index))
  }

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updated = [...medications]
    updated[index] = { ...updated[index], [field]: value }
    setMedications(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    try {
      // Validate form data
      const formData = {
        patientId: selectedPatientId,
        diagnosis,
        instructions,
        validUntil,
        refills,
        pharmacy: pharmacy || undefined,
        notes: notes || undefined,
        medications
      }

      prescriptionFormSchema.parse(formData)

      // Create prescription
      await createPrescription.mutateAsync(formData)
      
      // Redirect to prescriptions list
      router.push('/prescriptions')
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.errors.forEach(err => {
          const path = err.path.join('.')
          newErrors[path] = err.message
        })
        setErrors(newErrors)
      } else {
        setErrors({ submit: 'Failed to create prescription. Please try again.' })
      }
    }
  }

  // Calculate default valid until date (30 days from now)
  const defaultValidUntil = new Date()
  defaultValidUntil.setDate(defaultValidUntil.getDate() + 30)
  const minDate = new Date().toISOString().split('T')[0]

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
        <h1 className="text-3xl font-bold tracking-tight">New Prescription</h1>
        <p className="text-gray-600">Create a new prescription for a patient</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Selection */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Patient Information
          </h2>
          
          <div className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Patient <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  value={patientSearch}
                  onChange={(e) => {
                    setPatientSearch(e.target.value)
                    setShowPatientDropdown(true)
                  }}
                  onFocus={() => setShowPatientDropdown(true)}
                  placeholder="Search patient by name or email..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {showPatientDropdown && filteredPatients.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                  {filteredPatients.map((patient: SimplePatient) => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => {
                        setSelectedPatientId(patient.id)
                        setPatientSearch(`${patient.firstName} ${patient.lastName}`)
                        setShowPatientDropdown(false)
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-b-0"
                    >
                      <div className="font-medium">{`${patient.firstName} ${patient.lastName}`}</div>
                      <div className="text-sm text-gray-600">{patient.email}</div>
                    </button>
                  ))}
                </div>
              )}
              
              {errors.patientId && (
                <p className="mt-1 text-sm text-red-600">{errors.patientId}</p>
              )}
            </div>

            {selectedPatient && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium">{`${selectedPatient.firstName} ${selectedPatient.lastName}`}</p>
                <p className="text-sm text-gray-600">{selectedPatient.email}</p>
                {selectedPatient.phoneNumber && (
                  <p className="text-sm text-gray-600">{selectedPatient.phoneNumber}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Medical Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Medical Information
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Diagnosis <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter diagnosis..."
              />
              {errors.diagnosis && (
                <p className="mt-1 text-sm text-red-600">{errors.diagnosis}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instructions <span className="text-red-500">*</span>
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter general instructions for the patient..."
              />
              {errors.instructions && (
                <p className="mt-1 text-sm text-red-600">{errors.instructions}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valid Until <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  min={minDate}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.validUntil && (
                  <p className="mt-1 text-sm text-red-600">{errors.validUntil}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Refills
                </label>
                <input
                  type="number"
                  value={refills}
                  onChange={(e) => setRefills(parseInt(e.target.value) || 0)}
                  min="0"
                  max="12"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pharmacy (Optional)
              </label>
              <input
                type="text"
                value={pharmacy}
                onChange={(e) => setPharmacy(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Preferred pharmacy..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any additional notes..."
              />
            </div>
          </div>
        </div>

        {/* Medications */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              <Pill className="h-5 w-5 mr-2" />
              Medications
            </h2>
            <Button type="button" size="sm" variant="outline" onClick={addMedication}>
              <Plus className="h-4 w-4 mr-1" />
              Add Medication
            </Button>
          </div>

          {errors.medications && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{errors.medications}</p>
            </div>
          )}

          <div className="space-y-4">
            {medications.map((medication, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">Medication {index + 1}</h4>
                  {medications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMedication(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Medication Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={medication.name}
                      onChange={(e) => updateMedication(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Amoxicillin"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dosage <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={medication.dosage}
                      onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 500mg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Frequency <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={medication.frequency}
                      onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Twice daily"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={medication.duration}
                      onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 7 days"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Special Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    value={medication.instructions || ''}
                    onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Take with food"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error message */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <p className="text-sm text-red-700">{errors.submit}</p>
            </div>
          </div>
        )}

        {/* Submit buttons */}
        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={() => router.push('/prescriptions')}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={createPrescription.isPending}
          >
            {createPrescription.isPending ? 'Creating...' : 'Create Prescription'}
          </Button>
        </div>
      </form>
    </div>
  )
}