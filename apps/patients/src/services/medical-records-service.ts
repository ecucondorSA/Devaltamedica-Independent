/**
 * Servicio de Historiales Médicos y Prescripciones - Integración con Backend Dockerizado
 * Conecta el frontend con las APIs de registros médicos del servidor Docker
 */

import { apiClient, ApiResponse } from './api-client';
import { API_CONFIG } from '../config/api';

export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  recordType: 'consultation' | 'diagnosis' | 'treatment' | 'lab_result' | 'imaging' | 'prescription';
  title: string;
  description: string;
  diagnosis?: string;
  symptoms?: string[];
  treatment?: string;
  medications?: Medication[];
  labResults?: LabResult[];
  imagingResults?: ImagingResult[];
  vitalSigns?: VitalSigns;
  notes?: string;
  attachments?: FileAttachment[];
  isConfidential: boolean;
  createdAt: string;
  updatedAt: string;
  patientName?: string;
  doctorName?: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  sideEffects?: string[];
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  medications: Medication[];
  instructions: string;
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  issueDate: string;
  expiryDate?: string;
  pharmacyNotes?: string;
  refillsAllowed: number;
  refillsUsed: number;
  createdAt: string;
  updatedAt: string;
  patientName?: string;
  doctorName?: string;
}

export interface LabResult {
  testName: string;
  result: string;
  normalRange?: string;
  unit?: string;
  status: 'normal' | 'abnormal' | 'critical';
  notes?: string;
  testDate: string;
}

export interface ImagingResult {
  studyType: string; // X-ray, MRI, CT, Ultrasound, etc.
  studyDate: string;
  findings: string;
  impression: string;
  radiologist?: string;
  imageUrls?: string[];
  reportUrl?: string;
}

export interface VitalSigns {
  temperature?: number; // Celsius
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  heartRate?: number; // BPM
  respiratoryRate?: number; // per minute
  oxygenSaturation?: number; // percentage
  weight?: number; // kg
  height?: number; // cm
  bmi?: number;
  bloodSugar?: number; // mg/dL
  recordedAt: string;
}

export interface FileAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number; // bytes
  url: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface MedicalRecordsResponse {
  records: MedicalRecord[];
  total: number;
  page?: number;
  limit?: number;
}

export interface PrescriptionsResponse {
  prescriptions: Prescription[];
  total: number;
  page?: number;
  limit?: number;
}

export interface CreateMedicalRecordRequest {
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  recordType: 'consultation' | 'diagnosis' | 'treatment' | 'lab_result' | 'imaging' | 'prescription';
  title: string;
  description: string;
  diagnosis?: string;
  symptoms?: string[];
  treatment?: string;
  medications?: Omit<Medication, 'isActive'>[];
  labResults?: LabResult[];
  imagingResults?: ImagingResult[];
  vitalSigns?: VitalSigns;
  notes?: string;
  isConfidential?: boolean;
}

export interface CreatePrescriptionRequest {
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  medications: Omit<Medication, 'isActive'>[];
  instructions: string;
  expiryDate?: string;
  refillsAllowed?: number;
  pharmacyNotes?: string;
}

class MedicalRecordsService {
  
  /**
   * Obtener todos los registros médicos
   */
  async getMedicalRecords(
    page?: number,
    limit?: number,
    patientId?: string,
    recordType?: string
  ): Promise<ApiResponse<MedicalRecordsResponse>> {
    let endpoint = API_CONFIG.MEDICAL_RECORDS.BASE;
    
    const params = new URLSearchParams();
    if (page) params.set('page', page.toString());
    if (limit) params.set('limit', limit.toString());
    if (patientId) params.set('patientId', patientId);
    if (recordType) params.set('recordType', recordType);
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }
    
    return apiClient.get<MedicalRecordsResponse>(endpoint);
  }

  /**
   * Obtener registros médicos de un paciente específico
   */
  async getPatientMedicalRecords(patientId: string): Promise<ApiResponse<MedicalRecord[]>> {
    return apiClient.get<MedicalRecord[]>(API_CONFIG.MEDICAL_RECORDS.BY_PATIENT(patientId));
  }

  /**
   * Obtener un registro médico por ID
   */
  async getMedicalRecordById(recordId: string): Promise<ApiResponse<MedicalRecord>> {
    return apiClient.get<MedicalRecord>(`${API_CONFIG.MEDICAL_RECORDS.BASE}/${recordId}`);
  }

  /**
   * Crear un nuevo registro médico
   */
  async createMedicalRecord(recordData: CreateMedicalRecordRequest): Promise<ApiResponse<MedicalRecord>> {
    // Formatear datos para el backend
    const backendData = {
      patient_id: recordData.patientId,
      doctor_id: recordData.doctorId,
      appointment_id: recordData.appointmentId,
      record_type: recordData.recordType,
      diagnosis: recordData.diagnosis || recordData.title,
      symptoms: recordData.symptoms || [],
      prescription: recordData.medications ? {
        medications: recordData.medications.map(med => ({
          ...med,
          isActive: true
        }))
      } : {},
      lab_results: recordData.labResults || {},
      imaging_results: recordData.imagingResults || {},
      notes: recordData.notes || recordData.description,
      encrypted_data: null, // Se manejará en el backend
      access_log: [],
      hipaa_compliant: true,
      metadata: {
        title: recordData.title,
        description: recordData.description,
        vitalSigns: recordData.vitalSigns,
        isConfidential: recordData.isConfidential || false,
        createdBy: 'frontend',
        createdAt: new Date().toISOString()
      }
    };

    return apiClient.post<MedicalRecord>(API_CONFIG.MEDICAL_RECORDS.BASE, backendData);
  }

  /**
   * Actualizar un registro médico
   */
  async updateMedicalRecord(
    recordId: string,
    updates: Partial<CreateMedicalRecordRequest>
  ): Promise<ApiResponse<MedicalRecord>> {
    const backendData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    return apiClient.put<MedicalRecord>(
      `${API_CONFIG.MEDICAL_RECORDS.BASE}/${recordId}`,
      backendData
    );
  }

  /**
   * Eliminar un registro médico
   */
  async deleteMedicalRecord(recordId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiClient.delete<{ success: boolean; message: string }>(
      `${API_CONFIG.MEDICAL_RECORDS.BASE}/${recordId}`
    );
  }

  /**
   * Obtener todas las prescripciones
   */
  async getPrescriptions(
    page?: number,
    limit?: number,
    patientId?: string,
    status?: string
  ): Promise<ApiResponse<PrescriptionsResponse>> {
    let endpoint = API_CONFIG.PRESCRIPTIONS.BASE;
    
    const params = new URLSearchParams();
    if (page) params.set('page', page.toString());
    if (limit) params.set('limit', limit.toString());
    if (patientId) params.set('patientId', patientId);
    if (status) params.set('status', status);
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }
    
    return apiClient.get<PrescriptionsResponse>(endpoint);
  }

  /**
   * Obtener prescripciones de un paciente
   */
  async getPatientPrescriptions(patientId: string): Promise<ApiResponse<Prescription[]>> {
    return apiClient.get<Prescription[]>(API_CONFIG.PRESCRIPTIONS.BY_PATIENT(patientId));
  }

  /**
   * Obtener prescripciones activas de un paciente
   */
  async getActivePrescriptions(patientId: string): Promise<ApiResponse<Prescription[]>> {
    return apiClient.get<Prescription[]>(API_CONFIG.PRESCRIPTIONS.ACTIVE(patientId));
  }

  /**
   * Crear una nueva prescripción
   */
  async createPrescription(prescriptionData: CreatePrescriptionRequest): Promise<ApiResponse<Prescription>> {
    const backendData = {
      patient_id: prescriptionData.patientId,
      doctor_id: prescriptionData.doctorId,
      appointment_id: prescriptionData.appointmentId,
      medications: prescriptionData.medications.map(med => ({
        ...med,
        isActive: true
      })),
      instructions: prescriptionData.instructions,
      status: 'active',
      issue_date: new Date().toISOString(),
      expiry_date: prescriptionData.expiryDate,
      pharmacy_notes: prescriptionData.pharmacyNotes,
      refills_allowed: prescriptionData.refillsAllowed || 0,
      refills_used: 0,
      metadata: {
        createdBy: 'frontend',
        createdAt: new Date().toISOString()
      }
    };

    return apiClient.post<Prescription>(API_CONFIG.PRESCRIPTIONS.BASE, backendData);
  }

  /**
   * Actualizar estado de una prescripción
   */
  async updatePrescriptionStatus(
    prescriptionId: string,
    status: 'active' | 'completed' | 'cancelled' | 'expired'
  ): Promise<ApiResponse<Prescription>> {
    return apiClient.patch<Prescription>(
      `${API_CONFIG.PRESCRIPTIONS.BASE}/${prescriptionId}`,
      {
        status,
        updated_at: new Date().toISOString()
      }
    );
  }

  /**
   * Solicitar resurtido de prescripción
   */
  async requestRefill(prescriptionId: string, notes?: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiClient.post<{ success: boolean; message: string }>(
      `${API_CONFIG.PRESCRIPTIONS.BASE}/${prescriptionId}/refill`,
      {
        notes,
        requested_at: new Date().toISOString()
      }
    );
  }

  /**
   * Obtener signos vitales de un paciente
   */
  async getVitalSigns(
    patientId: string,
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<VitalSigns[]>> {
    let endpoint = `/api/v1/patients/${patientId}/vital-signs`;
    
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }
    
    return apiClient.get<VitalSigns[]>(endpoint);
  }

  /**
   * Registrar signos vitales
   */
  async recordVitalSigns(patientId: string, vitalSigns: Omit<VitalSigns, 'recordedAt'>): Promise<ApiResponse<VitalSigns>> {
    return apiClient.post<VitalSigns>(
      `/api/v1/patients/${patientId}/vital-signs`,
      {
        ...vitalSigns,
        recordedAt: new Date().toISOString()
      }
    );
  }

  /**
   * Obtener alergias de un paciente
   */
  async getPatientAllergies(patientId: string): Promise<ApiResponse<string[]>> {
    return apiClient.get<string[]>(`/api/v1/patients/${patientId}/allergies`);
  }

  /**
   * Actualizar alergias de un paciente
   */
  async updatePatientAllergies(patientId: string, allergies: string[]): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.put<{ success: boolean }>(
      `/api/v1/patients/${patientId}/allergies`,
      { allergies }
    );
  }

  /**
   * Obtener medicamentos actuales de un paciente
   */
  async getCurrentMedications(patientId: string): Promise<ApiResponse<Medication[]>> {
    return apiClient.get<Medication[]>(`/api/v1/patients/${patientId}/current-medications`);
  }

  /**
   * Obtener historial médico resumido
   */
  async getMedicalSummary(patientId: string): Promise<ApiResponse<{
    allergies: string[];
    chronicConditions: string[];
    currentMedications: Medication[];
    recentVisits: MedicalRecord[];
    vitalSigns: VitalSigns;
    lastUpdated: string;
  }>> {
    return apiClient.get<{ allergies: string[]; chronicConditions: string[]; currentMedications: Medication[]; recentVisits: MedicalRecord[]; vitalSigns: VitalSigns; lastUpdated: string }>(`/api/v1/patients/${patientId}/medical-summary`);
  }

  /**
   * Buscar registros médicos por texto
   */
  async searchMedicalRecords(
    query: string,
    patientId?: string,
    recordType?: string
  ): Promise<ApiResponse<MedicalRecord[]>> {
    let endpoint = `${API_CONFIG.MEDICAL_RECORDS.BASE}/search?q=${encodeURIComponent(query)}`;
    
    if (patientId) endpoint += `&patientId=${patientId}`;
    if (recordType) endpoint += `&recordType=${recordType}`;
    
    return apiClient.get<MedicalRecord[]>(endpoint);
  }

  /**
   * Subir archivo adjunto a un registro médico
   */
  async uploadAttachment(
    recordId: string,
    file: File,
    description?: string
  ): Promise<ApiResponse<FileAttachment>> {
    const formData = new FormData();
    formData.append('file', file);
    if (description) formData.append('description', description);
    formData.append('recordId', recordId);
    formData.append('uploadedAt', new Date().toISOString());

    return apiClient.post<FileAttachment>(
      `/api/v1/medical-records/${recordId}/attachments`,
      formData,
      { headers: {} } // Let browser set Content-Type for FormData
    );
  }

  /**
   * Obtener archivos adjuntos de un registro médico
   */
  async getAttachments(recordId: string): Promise<ApiResponse<FileAttachment[]>> {
    return apiClient.get<FileAttachment[]>(`/api/v1/medical-records/${recordId}/attachments`);
  }

  /**
   * Eliminar archivo adjunto
   */
  async deleteAttachment(recordId: string, attachmentId: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.delete<{ success: boolean }>(
      `/api/v1/medical-records/${recordId}/attachments/${attachmentId}`
    );
  }
}

// Singleton del servicio de registros médicos
export const medicalRecordsService = new MedicalRecordsService();

// Exportar como default también
export default medicalRecordsService;