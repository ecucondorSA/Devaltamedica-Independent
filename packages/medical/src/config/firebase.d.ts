/**
 * Firebase configuration for medical data
 * @module @altamedica/medical/config/firebase
 */
export declare const medicalFirebaseConfig: {
    collections: {
        patients: string;
        doctors: string;
        appointments: string;
        medicalRecords: string;
        prescriptions: string;
        labResults: string;
        vitals: string;
        emergencyContacts: string;
    };
    storage: {
        medicalDocuments: string;
        labResults: string;
        prescriptions: string;
        patientPhotos: string;
    };
    security: {
        requiresAuth: boolean;
        patientCanReadOwnData: boolean;
        doctorCanReadPatientData: boolean;
        adminCanReadAllData: boolean;
        encryptSensitiveData: boolean;
    };
};
export declare const getFirestorePath: {
    patient: (patientId: string) => string;
    doctor: (doctorId: string) => string;
    appointment: (appointmentId: string) => string;
    patientRecords: (patientId: string) => string;
    record: (patientId: string, recordId: string) => string;
};
//# sourceMappingURL=firebase.d.ts.map