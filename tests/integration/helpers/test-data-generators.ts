/**
 * Generadores de Datos de Prueba para Tests de Integración
 * Crea datos realistas para testing médico
 */

import { randomUUID } from 'crypto'

interface TestPatient {
  id: string
  name: string
  age: number
  email: string
  phone: string
  conditions?: string[]
  allergies?: string[]
  currentMedications?: string[]
  insurance?: string
  internetSpeed?: string
  deviceType?: string
}

interface TestDoctor {
  id: string
  name: string
  email: string
  specialty: string
  licenseNumber?: string
  prescriptionAuthority?: boolean
  deaNumber?: string
  availability?: string
  languages?: string[]
  telemedicineEnabled?: boolean
  videoQualityPreference?: string
}

interface TestConsultation {
  id: string
  patientId: string
  doctorId: string
  status: string
  type: string
  scheduledFor?: string
  duration?: number
  createdAt: string
}

interface WebRTCRoom {
  id: string
  consultationId: string
  maxParticipants: number
  recordingEnabled: boolean
  status: string
  createdAt: string
}

export async function createTestPatient(options: Partial<TestPatient> = {}): Promise<TestPatient> {
  const patientId = randomUUID()
  
  const defaultPatient: TestPatient = {
    id: patientId,
    name: `Test Patient ${patientId.slice(0, 8)}`,
    age: 35,
    email: `patient-${patientId.slice(0, 8)}@test.com`,
    phone: '+1-555-0100',
    conditions: ['healthy'],
    allergies: [],
    currentMedications: [],
    insurance: 'test-insurance-basic',
    internetSpeed: 'medium',
    deviceType: 'desktop'
  }

  const patient = { ...defaultPatient, ...options }
  
  // Simular inserción en base de datos
  await simulateDbInsert('patients', patient)
  
  return patient
}

export async function createTestDoctor(options: Partial<TestDoctor> = {}): Promise<TestDoctor> {
  const doctorId = randomUUID()
  
  const defaultDoctor: TestDoctor = {
    id: doctorId,
    name: `Dr. Test ${doctorId.slice(0, 8)}`,
    email: `doctor-${doctorId.slice(0, 8)}@test.com`,
    specialty: 'general_medicine',
    licenseNumber: `MD${Math.floor(Math.random() * 100000)}`,
    prescriptionAuthority: true,
    deaNumber: `BD${Math.floor(Math.random() * 10000000)}`,
    availability: 'available',
    languages: ['en'],
    telemedicineEnabled: true,
    videoQualityPreference: 'medium'
  }

  const doctor = { ...defaultDoctor, ...options }
  
  // Simular inserción en base de datos
  await simulateDbInsert('doctors', doctor)
  
  return doctor
}

export async function createTestConsultation(options: Partial<TestConsultation>): Promise<TestConsultation> {
  if (!options.patientId || !options.doctorId) {
    throw new Error('patientId and doctorId are required for consultation')
  }

  const consultationId = randomUUID()
  
  const defaultConsultation: TestConsultation = {
    id: consultationId,
    patientId: options.patientId,
    doctorId: options.doctorId,
    status: 'scheduled',
    type: 'in_person',
    scheduledFor: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // +1 hour
    duration: 30,
    createdAt: new Date().toISOString()
  }

  const consultation = { ...defaultConsultation, ...options }
  
  // Simular inserción en base de datos
  await simulateDbInsert('consultations', consultation)
  
  return consultation
}

export async function createWebRTCRoom(options: Partial<WebRTCRoom>): Promise<WebRTCRoom> {
  if (!options.consultationId) {
    throw new Error('consultationId is required for WebRTC room')
  }

  const roomId = randomUUID()
  
  const defaultRoom: WebRTCRoom = {
    id: roomId,
    consultationId: options.consultationId,
    maxParticipants: 2,
    recordingEnabled: false,
    status: 'waiting',
    createdAt: new Date().toISOString()
  }

  const room = { ...defaultRoom, ...options }
  
  // Simular inserción en base de datos
  await simulateDbInsert('webrtc_rooms', room)
  
  return room
}

// Generadores de datos médicos específicos
export function generateMedicalConditions(): string[] {
  const conditions = [
    'hypertension',
    'diabetes_type_1',
    'diabetes_type_2', 
    'asthma',
    'copd',
    'heart_disease',
    'anxiety',
    'depression',
    'arthritis',
    'migraine',
    'allergic_rhinitis',
    'gastroesophageal_reflux',
    'hypothyroidism',
    'hyperthyroidism',
    'osteoporosis'
  ]
  
  const numConditions = Math.floor(Math.random() * 3) + 1
  return conditions.sort(() => 0.5 - Math.random()).slice(0, numConditions)
}

export function generateAllergies(): string[] {
  const allergies = [
    'penicillin',
    'sulfa',
    'peanuts',
    'shellfish',
    'latex',
    'aspirin',
    'codeine',
    'morphine',
    'iodine',
    'eggs',
    'milk',
    'wheat',
    'soy'
  ]
  
  const numAllergies = Math.floor(Math.random() * 3)
  return allergies.sort(() => 0.5 - Math.random()).slice(0, numAllergies)
}

export function generateCurrentMedications(): string[] {
  const medications = [
    'metformin',
    'lisinopril',
    'atorvastatin',
    'amlodipine',
    'metoprolol',
    'omeprazole',
    'albuterol',
    'losartan',
    'hydrochlorothiazide',
    'simvastatin',
    'levothyroxine',
    'gabapentin',
    'sertraline',
    'trazodone',
    'fluoxetine'
  ]
  
  const numMeds = Math.floor(Math.random() * 4)
  return medications.sort(() => 0.5 - Math.random()).slice(0, numMeds)
}

export function generateVitalSigns(age: number, conditions: string[] = []): any {
  const baseVitals = {
    bloodPressure: { systolic: 120, diastolic: 80 },
    heartRate: 70,
    temperature: 36.6,
    oxygenSaturation: 98,
    respiratoryRate: 16,
    weight: 70,
    height: 170
  }

  // Ajustar vitales basado en edad y condiciones
  if (age > 65) {
    baseVitals.bloodPressure.systolic += 10
    baseVitals.heartRate -= 5
  }

  if (conditions.includes('hypertension')) {
    baseVitals.bloodPressure.systolic += 20
    baseVitals.bloodPressure.diastolic += 10
  }

  if (conditions.includes('diabetes_type_2')) {
    // Diabetes puede afectar otros parámetros
    baseVitals.weight += 10
  }

  // Agregar variabilidad natural
  baseVitals.bloodPressure.systolic += Math.floor(Math.random() * 20) - 10
  baseVitals.bloodPressure.diastolic += Math.floor(Math.random() * 10) - 5
  baseVitals.heartRate += Math.floor(Math.random() * 20) - 10
  baseVitals.temperature += (Math.random() * 2) - 1
  baseVitals.oxygenSaturation += Math.floor(Math.random() * 4) - 2

  return baseVitals
}

export function generateSpecialty(): string {
  const specialties = [
    'family_medicine',
    'internal_medicine',
    'pediatrics',
    'cardiology',
    'dermatology',
    'psychiatry',
    'orthopedics',
    'gynecology',
    'ophthalmology',
    'neurology',
    'endocrinology',
    'gastroenterology',
    'pulmonology',
    'rheumatology',
    'urology'
  ]
  
  return specialties[Math.floor(Math.random() * specialties.length)]
}

export function generatePrescriptionData(): any {
  return {
    medications: [{
      name: 'atorvastatin',
      genericName: 'atorvastatin calcium',
      dosage: '20mg',
      frequency: 'once_daily',
      duration: '90_days',
      instructions: 'Take with food in the evening',
      quantity: 90,
      refills: 2,
      indication: 'hyperlipidemia'
    }],
    prescriptionNumber: `RX${Math.floor(Math.random() * 10000000000)}`,
    digitalSignature: 'test-signature-hash',
    pharmacyCode: `PH${Math.floor(Math.random() * 100000000)}`
  }
}

// Función auxiliar para simular inserción en base de datos
async function simulateDbInsert(table: string, data: any): Promise<void> {
  // En tests reales, esto sería una inserción real en la base de datos de prueba
  // Por ahora, solo simulamos un delay
  await new Promise(resolve => setTimeout(resolve, 10))
  
  // En modo desarrollo, podrías loguear las inserciones
  if (process.env.NODE_ENV === 'test-debug') {
    console.log(`Inserted into ${table}:`, JSON.stringify(data, null, 2))
  }
}

// Función para generar datos de test basados en edad
export function generateAgeSpecificData(age: number): Partial<TestPatient> {
  if (age < 18) {
    // Pediatric
    return {
      conditions: ['healthy', 'asthma'].slice(0, Math.random() > 0.7 ? 2 : 1),
      allergies: generateAllergies().slice(0, 1), // Menos alergias conocidas
      currentMedications: [] // Generalmente menos medicamentos
    }
  } else if (age < 65) {
    // Adult
    return {
      conditions: generateMedicalConditions().slice(0, 2),
      allergies: generateAllergies(),
      currentMedications: generateCurrentMedications().slice(0, 2)
    }
  } else {
    // Geriatric
    return {
      conditions: [...generateMedicalConditions(), 'hypertension'].slice(0, 4),
      allergies: generateAllergies(),
      currentMedications: generateCurrentMedications()
    }
  }
}