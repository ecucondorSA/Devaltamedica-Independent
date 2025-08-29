'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft,
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  FileText,
  Activity,
  Pill,
  Heart,
  Edit,
  Plus,
  Clock,
  AlertCircle
} from 'lucide-react'
import { Button } from '@altamedica/ui'
import { useHealthMetrics, calculateAge } from '@altamedica/medical'

import { logger } from '@altamedica/shared';
interface PatientDetail {
  id: string
  name: string
  email: string
  phoneNumber: string
  birthDate: string
  address: string
  bloodType: string
  allergies: string[]
  conditions: string[]
  medications: string[]
  emergencyContact: {
    name: string
    phone: string
    relationship: string
  }
}

export default function PatientDetailPage() {
  const router = useRouter()
  const params = useParams()
  const patientId = params.id as string
  
  const [patient, setPatient] = useState<PatientDetail | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  
  const { metrics, analysis, updateMetric } = useHealthMetrics(
    {
      weight: 75,
      height: 175,
      heartRate: 72,
      bloodPressure: { systolic: 120, diastolic: 80 }
    },
    patient ? calculateAge(new Date(patient.birthDate)) : undefined
  )

  useEffect(() => {
    fetchPatientDetails()
  }, [patientId])

  const fetchPatientDetails = async () => {
    try {
      // Simulated data - replace with actual API call
      setPatient({
        id: patientId,
        name: 'John Doe',
        email: 'john.doe@email.com',
        phoneNumber: '+1 234 567 8900',
        birthDate: '1985-06-15',
        address: '123 Main St, City, State 12345',
        bloodType: 'A+',
        allergies: ['Penicillin', 'Peanuts'],
        conditions: ['Hypertension', 'Type 2 Diabetes'],
        medications: ['Metformin 500mg', 'Lisinopril 10mg'],
        emergencyContact: {
          name: 'Jane Doe',
          phone: '+1 234 567 8901',
          relationship: 'Spouse'
        }
      })
    } catch (error) {
      logger.error('Error fetching patient:', String(error))
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!patient) {
    return <div>Patient not found</div>
  }

  const age = calculateAge(new Date(patient.birthDate))

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'medical-history', label: 'Medical History' },
    { id: 'appointments', label: 'Appointments' },
    { id: 'prescriptions', label: 'Prescriptions' },
    { id: 'lab-results', label: 'Lab Results' },
    { id: 'notes', label: 'Clinical Notes' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/patients')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Patients
          </Button>
          <h1 className="text-2xl font-bold">{patient.name}</h1>
        </div>
        <Button onClick={() => router.push(`/patients/${patient.id}/edit`)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Patient
        </Button>
      </div>

      {/* Patient Info Card */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{patient.name}</h2>
                <p className="text-gray-600">{age} years old</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                {patient.email}
              </div>
              <div className="flex items-center text-sm">
                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                {patient.phoneNumber}
              </div>
              <div className="flex items-center text-sm">
                <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                {patient.address}
              </div>
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                Born: {new Date(patient.birthDate).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Medical Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700">Medical Information</h3>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Blood Type</p>
                <p className="font-medium">{patient.bloodType}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Allergies</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {patient.allergies.map((allergy, idx) => (
                    <span key={idx} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                      {allergy}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Chronic Conditions</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {patient.conditions.map((condition, idx) => (
                    <span key={idx} className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                      {condition}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Vitals & Emergency */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700">Latest Vitals</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm">Blood Pressure</span>
                <span className={`font-medium ${analysis.bloodPressureClassification?.color}`}>
                  {metrics.bloodPressure?.systolic}/{metrics.bloodPressure?.diastolic}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm">Heart Rate</span>
                <span className="font-medium">{metrics.heartRate} bpm</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm">BMI</span>
                <span className={`font-medium ${analysis.bmi?.color}`}>
                  {analysis.bmi?.value} ({analysis.bmi?.category})
                </span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Emergency Contact</h4>
              <div className="text-sm space-y-1">
                <p className="font-medium">{patient.emergencyContact.name}</p>
                <p className="text-gray-600">{patient.emergencyContact.relationship}</p>
                <p className="text-gray-600">{patient.emergencyContact.phone}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Current Medications */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Current Medications</h3>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Medication
                  </Button>
                </div>
                <div className="space-y-2">
                  {patient.medications.map((med, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Pill className="h-5 w-5 text-blue-600" />
                        <span>{med}</span>
                      </div>
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Health Alerts */}
              {analysis.alerts.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-800">Health Alerts</h4>
                      <ul className="mt-2 space-y-1">
                        {analysis.alerts.map((alert, idx) => (
                          <li key={idx} className="text-sm text-yellow-700">• {alert}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              <div>
                <h3 className="font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Activity className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">Regular Checkup</p>
                        <p className="text-sm text-gray-600">2 days ago</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">View</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">Lab Results Added</p>
                        <p className="text-sm text-gray-600">1 week ago</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">View</Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'medical-history' && (
            <div className="text-center py-12 text-gray-500">
              Medical history content coming soon...
            </div>
          )}

          {activeTab === 'appointments' && (
            <div className="text-center py-12 text-gray-500">
              Appointments history coming soon...
            </div>
          )}

          {activeTab === 'prescriptions' && (
            <div className="text-center py-12 text-gray-500">
              Prescriptions history coming soon...
            </div>
          )}

          {activeTab === 'lab-results' && (
            <div className="text-center py-12 text-gray-500">
              Lab results coming soon...
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="text-center py-12 text-gray-500">
              Clinical notes coming soon...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}