/**
 * Medical Record type definitions
 * @module @altamedica/medical/types/medical-record
 */
export interface MedicalRecord {
    id: string;
    patientId: string;
    doctorId: string;
    appointmentId?: string;
    date: Date;
    chiefComplaint: string;
    presentIllness: string;
    diagnosis: string;
    treatment: string;
    vitals?: {
        bloodPressure?: string;
        heartRate?: number;
        temperature?: number;
        weight?: number;
        height?: number;
        respiratoryRate?: number;
        oxygenSaturation?: number;
    };
    physicalExamination?: string;
    labResults?: {
        testName: string;
        result: string;
        normalRange?: string;
        date: Date;
    }[];
    prescriptions?: {
        medication: string;
        dosage: string;
        frequency: string;
        duration: string;
        instructions?: string;
    }[];
    followUpDate?: Date;
    attachments?: {
        name: string;
        url: string;
        type: string;
    }[];
    isConfidential?: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface MedicalRecordCreate extends Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt'> {
}
export interface MedicalRecordUpdate extends Partial<MedicalRecord> {
    id: string;
}
//# sourceMappingURL=medical-record.d.ts.map