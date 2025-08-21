'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft,
  Calendar,
  Clock,
  User,
  FileText,
  Video,
  MapPin,
  AlertCircle,
  Search
} from 'lucide-react'
import { Button } from '@altamedica/ui'
import { useCreateAppointment } from '@/hooks/queries/useAppointments'
import { usePatients } from '@/hooks/queries/usePatients'
import { z } from 'zod'

// Validation schema
const appointmentFormSchema = z.object({
  patientId: z.string().min(1, 'Please select a patient'),
  date: z.string().refine((val) => {
    const date = new Date(val)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return date >= now
  }, 'Appointment date must be today or in the future'),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format'),
  duration: z.number().min(15, 'Minimum duration is 15 minutes').max(240, 'Maximum duration is 4 hours'),
  type: z.enum(['consultation', 'telemedicine', 'emergency', 'follow-up', 'routine-checkup'], {
    errorMap: () => ({ message: 'Please select an appointment type' })
  }),
  reason: z.string().min(5, 'Please provide a reason for the appointment'),
  notes: z.string().optional(),
  location: z.string().optional()
})

type AppointmentFormData = z.infer<typeof appointmentFormSchema>

const appointmentTypes = [
  { value: 'consultation', label: 'Consultation', icon: FileText },
  { value: 'telemedicine', label: 'Telemedicine', icon: Video },
  { value: 'follow-up', label: 'Follow-up', icon: Calendar },
  { value: 'routine-checkup', label: 'Routine Checkup', icon: User },
  { value: 'emergency', label: 'Emergency', icon: AlertCircle }
]

const durations = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' }
]

export default function NewAppointmentPage() {
  const router = useRouter()
  const createAppointment = useCreateAppointment()
  const { data: patients = [] } = usePatients()

  // Form state
  const [patientSearch, setPatientSearch] = useState('')
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState(30)
  const [type, setType] = useState<AppointmentFormData['type']>('consultation')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [location, setLocation] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)

  // Get current doctor ID (in a real app, this would come from auth context)
  const doctorId = 'current-doctor-id'

  // Filter patients based on search
  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    patient.email.toLowerCase().includes(patientSearch.toLowerCase())
  )

  const selectedPatient = patients.find(p => p.id === selectedPatientId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    try {
      // Combine date and time
      const appointmentDateTime = `${date}T${time}:00`

      // Validate form data
      const formData = {
        patientId: selectedPatientId,
        date: appointmentDateTime,
        time,
        duration,
        type,
        reason,
        notes: notes || undefined,
        location: location || undefined
      }

      appointmentFormSchema.parse(formData)

      // Create appointment with required fields
      await createAppointment.mutateAsync({
        patientId: selectedPatientId,
        doctorId,
        date: appointmentDateTime,
        duration,
        type,
        status: 'scheduled',
        reason,
        notes: notes || undefined
      })
      
      // Redirect to appointments list
      router.push('/appointments')
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.errors.forEach(err => {
          const path = err.path.join('.')
          newErrors[path] = err.message
        })
        setErrors(newErrors)
      } else {
        setErrors({ submit: 'Failed to create appointment. Please try again.' })
      }
    }
  }

  // Get minimum date (today)
  const minDate = new Date().toISOString().split('T')[0]

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/appointments')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Appointments
        </button>
        <h1 className="text-3xl font-bold tracking-tight">Schedule New Appointment</h1>
        <p className="text-gray-600">Book a new appointment with a patient</p>
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
                  {filteredPatients.map(patient => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => {
                        setSelectedPatientId(patient.id)
                        setPatientSearch(patient.name)
                        setShowPatientDropdown(false)
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-b-0"
                    >
                      <div className="font-medium">{patient.name}</div>
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
                <p className="font-medium">{selectedPatient.name}</p>
                <p className="text-sm text-gray-600">{selectedPatient.email}</p>
                {selectedPatient.phoneNumber && (
                  <p className="text-sm text-gray-600">{selectedPatient.phoneNumber}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Appointment Details */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Appointment Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={minDate}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.time && (
                <p className="mt-1 text-sm text-red-600">{errors.time}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration <span className="text-red-500">*</span>
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {durations.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
              {errors.duration && (
                <p className="mt-1 text-sm text-red-600">{errors.duration}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AppointmentFormData['type'])}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {appointmentTypes.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              {errors.type && (
                <p className="mt-1 text-sm text-red-600">{errors.type}</p>
              )}
            </div>

            {type !== 'telemedicine' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Office, Room 201"
                  />
                </div>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Visit <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description of the reason for this appointment..."
              />
              {errors.reason && (
                <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any additional notes or special instructions..."
              />
            </div>
          </div>
        </div>

        {/* Appointment Type Preview */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-semibold mb-4">Appointment Type: {appointmentTypes.find(t => t.value === type)?.label}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {appointmentTypes.map(appointmentType => {
              const Icon = appointmentType.icon
              const isSelected = type === appointmentType.value
              return (
                <button
                  key={appointmentType.value}
                  type="button"
                  onClick={() => setType(appointmentType.value as AppointmentFormData['type'])}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`h-8 w-8 mx-auto mb-2 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                  <p className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                    {appointmentType.label}
                  </p>
                </button>
              )
            })}
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
          <Button type="button" variant="outline" onClick={() => router.push('/appointments')}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={createAppointment.isPending}
          >
            {createAppointment.isPending ? 'Scheduling...' : 'Schedule Appointment'}
          </Button>
        </div>
      </form>
    </div>
  )
}