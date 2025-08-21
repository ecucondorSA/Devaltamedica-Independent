/**
 * Firebase configuration for medical data
 * @module @altamedica/medical/config/firebase
 */

export const medicalFirebaseConfig = {
  // Collection names for medical data
  collections: {
    patients: 'patients',
    doctors: 'doctors',
    appointments: 'appointments',
    medicalRecords: 'medical_records',
    prescriptions: 'prescriptions',
    labResults: 'lab_results',
    vitals: 'vitals',
    emergencyContacts: 'emergency_contacts'
  },
  
  // Storage paths
  storage: {
    medicalDocuments: 'medical-documents',
    labResults: 'lab-results',
    prescriptions: 'prescriptions',
    patientPhotos: 'patient-photos'
  },
  
  // Security rules hints
  security: {
    requiresAuth: true,
    patientCanReadOwnData: true,
    doctorCanReadPatientData: true,
    adminCanReadAllData: true,
    encryptSensitiveData: true
  }
};

// Helper to construct Firestore paths
export const getFirestorePath = {
  patient: (patientId: string) => `${medicalFirebaseConfig.collections.patients}/${patientId}`,
  doctor: (doctorId: string) => `${medicalFirebaseConfig.collections.doctors}/${doctorId}`,
  appointment: (appointmentId: string) => `${medicalFirebaseConfig.collections.appointments}/${appointmentId}`,
  patientRecords: (patientId: string) => 
    `${medicalFirebaseConfig.collections.patients}/${patientId}/${medicalFirebaseConfig.collections.medicalRecords}`,
  record: (patientId: string, recordId: string) => 
    `${medicalFirebaseConfig.collections.patients}/${patientId}/${medicalFirebaseConfig.collections.medicalRecords}/${recordId}`
};