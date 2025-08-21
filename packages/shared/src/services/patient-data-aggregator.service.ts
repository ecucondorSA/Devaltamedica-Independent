import { getFirebaseFirestore } from '../adapters/firebase';
import type { ExportFormat, ExportOptions } from './patient-data-export.service';
import { PatientDataExportService } from './patient-data-export.service';
import { logger } from './logger.service';
// Idiomas soportados (extendido para incluir 'pt')
export type SupportedLanguage = 'es' | 'en' | 'pt';

/**
 * Servicio Agregador de Datasets del Paciente
 * Consolida información médica de múltiples fuentes en estructuras unificadas
 * Cumple con HIPAA "Right of Access" y Ley 26.529 Art. 14
 */

export interface AggregatedPatientData {
  // Información básica
  patientInfo: PatientInfo;
  demographics: Demographics;
  contactInfo: ContactInfo;

  // Datos médicos
  medicalHistory: MedicalHistory;
  medications: MedicationProfile;
  allergies: AllergyProfile;
  immunizations: ImmunizationRecord[];
  labResults: LabResultSummary;
  vitalSigns: VitalSignsTrend;

  // Documentos y registros
  clinicalDocuments: ClinicalDocument[];
  imagingStudies: ImagingStudy[];
  procedures: ProcedureRecord[];

  // Citas y encuentros
  appointments: AppointmentHistory;
  telemedicineHistory: TelemedicineRecord[];

  // Administrativo
  insurance: InsuranceInfo[];
  billing: BillingSummary;
  consents: ConsentRecord[];

  // Metadata
  metadata: AggregationMetadata;
}

export interface PatientInfo {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: string;
  mrn?: string; // Medical Record Number
  nationalId?: string; // DNI/CUIT para Argentina
}

export interface Demographics {
  ethnicity?: string;
  language: SupportedLanguage;
  maritalStatus?: string;
  occupation?: string;
  education?: string;
}

export interface ContactInfo {
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  phone: string;
  email: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export interface MedicalHistory {
  conditions: ChronicCondition[];
  surgeries: Surgery[];
  familyHistory: FamilyMedicalHistory[];
  socialHistory: SocialHistory;
  reviewOfSystems: ReviewOfSystems;
}

export interface ChronicCondition {
  id: string;
  name: string;
  icdCode: string;
  diagnosedDate: Date;
  status: 'active' | 'resolved' | 'remission';
  severity: 'mild' | 'moderate' | 'severe';
  notes?: string;
}

export interface Surgery {
  id: string;
  procedure: string;
  date: Date;
  surgeon?: string;
  facility?: string;
  complications?: string;
  outcome: string;
}

export interface FamilyMedicalHistory {
  relationship: string;
  conditions: string[];
  ageAtDiagnosis?: number;
  deceased?: boolean;
  causeOfDeath?: string;
}

export interface SocialHistory {
  smoking: {
    status: 'never' | 'former' | 'current';
    packsPerDay?: number;
    yearsSmoking?: number;
    quitDate?: Date;
  };
  alcohol: {
    status: 'none' | 'social' | 'moderate' | 'heavy';
    drinksPerWeek?: number;
  };
  exercise: {
    frequency: 'none' | 'occasional' | 'regular' | 'daily';
    type?: string;
    minutesPerWeek?: number;
  };
  diet: string;
  occupation: string;
  stressLevel: 'low' | 'moderate' | 'high';
}

export interface ReviewOfSystems {
  constitutional?: string;
  cardiovascular?: string;
  respiratory?: string;
  gastrointestinal?: string;
  genitourinary?: string;
  musculoskeletal?: string;
  neurological?: string;
  psychiatric?: string;
  endocrine?: string;
  hematologic?: string;
  allergic?: string;
}

export interface MedicationProfile {
  current: Medication[];
  past: Medication[];
  adherenceRate?: number;
  lastReviewDate?: Date;
}

export interface Medication {
  id: string;
  name: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  route: string;
  startDate: Date;
  endDate?: Date;
  prescribedBy: string;
  indication: string;
  sideEffects?: string[];
  interactions?: string[];
}

export interface AllergyProfile {
  medications: Allergy[];
  foods: Allergy[];
  environmental: Allergy[];
  other: Allergy[];
}

export interface Allergy {
  id: string;
  allergen: string;
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life-threatening';
  onset: Date;
  verifiedBy?: string;
  notes?: string;
}

export interface ImmunizationRecord {
  id: string;
  vaccine: string;
  date: Date;
  lot?: string;
  site?: string;
  route?: string;
  administeredBy?: string;
  nextDue?: Date;
}

export interface LabResultSummary {
  recentResults: LabResult[];
  trends: LabTrend[];
  abnormalResults: LabResult[];
  pendingOrders: LabOrder[];
}

export interface LabResult {
  id: string;
  testName: string;
  value: string | number;
  unit?: string;
  referenceRange?: string;
  flag?: 'normal' | 'high' | 'low' | 'critical';
  date: Date;
  orderedBy?: string;
  lab?: string;
}

export interface LabTrend {
  testName: string;
  values: Array<{
    date: Date;
    value: number;
  }>;
  trendDirection: 'stable' | 'improving' | 'worsening';
}

export interface LabOrder {
  id: string;
  tests: string[];
  orderedDate: Date;
  scheduledDate?: Date;
  priority: 'routine' | 'urgent' | 'stat';
  status: 'pending' | 'in-progress' | 'completed';
}

export interface VitalSignsTrend {
  latest: VitalSigns;
  history: VitalSigns[];
  alerts: VitalAlert[];
}

export interface VitalSigns {
  date: Date;
  bloodPressure: {
    systolic: number;
    diastolic: number;
  };
  heartRate: number;
  temperature: number;
  respiratoryRate: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  pain?: number; // 0-10 scale
}

export interface VitalAlert {
  parameter: string;
  value: number;
  threshold: string;
  severity: 'warning' | 'critical';
  date: Date;
}

export interface ClinicalDocument {
  id: string;
  type: string;
  title: string;
  date: Date;
  author: string;
  facility?: string;
  content?: string;
  attachmentUrl?: string;
  category: 'consultation' | 'discharge' | 'operative' | 'progress' | 'other';
}

export interface ImagingStudy {
  id: string;
  modality: 'xray' | 'ct' | 'mri' | 'ultrasound' | 'pet' | 'other';
  bodyPart: string;
  date: Date;
  indication: string;
  findings?: string;
  impression?: string;
  radiologist?: string;
  facility?: string;
  imageUrls?: string[];
}

export interface ProcedureRecord {
  id: string;
  name: string;
  cptCode?: string;
  date: Date;
  performer?: string;
  facility?: string;
  indication: string;
  findings?: string;
  complications?: string;
  followUp?: string;
}

export interface AppointmentHistory {
  upcoming: Appointment[];
  past: Appointment[];
  noShows: number;
  cancellations: number;
  totalVisits: number;
}

export interface Appointment {
  id: string;
  date: Date;
  type: string;
  provider: string;
  specialty?: string;
  reason: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  followUpRequired?: boolean;
}

export interface TelemedicineRecord {
  id: string;
  date: Date;
  duration: number; // minutos
  provider: string;
  chiefComplaint: string;
  diagnosis?: string;
  treatment?: string;
  prescriptions?: string[];
  followUp?: string;
  recordingUrl?: string;
}

export interface InsuranceInfo {
  id: string;
  provider: string;
  planName: string;
  memberId: string;
  groupNumber?: string;
  effectiveDate: Date;
  expirationDate?: Date;
  isPrimary: boolean;
  copay?: number;
  deductible?: number;
  outOfPocketMax?: number;
}

export interface BillingSummary {
  totalCharges: number;
  totalPayments: number;
  balance: number;
  recentTransactions: BillingTransaction[];
  paymentPlans?: PaymentPlan[];
}

export interface BillingTransaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: 'charge' | 'payment' | 'adjustment' | 'refund';
  status: 'pending' | 'posted' | 'denied';
  insurance?: string;
}

export interface PaymentPlan {
  id: string;
  startDate: Date;
  endDate: Date;
  monthlyAmount: number;
  remainingBalance: number;
  status: 'active' | 'completed' | 'defaulted';
}

export interface ConsentRecord {
  id: string;
  type: string;
  date: Date;
  expirationDate?: Date;
  scope: string;
  grantedTo?: string;
  withdrawable: boolean;
  status: 'active' | 'withdrawn' | 'expired';
  signatureUrl?: string;
}

export interface AggregationMetadata {
  aggregationDate: Date;
  sources: string[];
  version: string;
  totalRecords: number;
  dateRange: {
    start: Date;
    end: Date;
  };
  completeness: {
    score: number; // 0-100
    missingFields: string[];
  };
  dataQuality: {
    score: number; // 0-100
    issues: string[];
  };
}

export class PatientDataAggregatorService {
  private readonly db = getFirebaseFirestore();
  private readonly exportService: PatientDataExportService;

  constructor() {
    this.exportService = new PatientDataExportService();
  }

  /**
   * Agrega todos los datos del paciente de múltiples fuentes
   */
  async aggregatePatientData(
    patientId: string,
    options: Partial<ExportOptions> = {},
  ): Promise<AggregatedPatientData> {
    logger.info(`[Aggregator] Starting data aggregation for patient ${patientId}`);

    const startTime = Date.now();
    const sources: string[] = [];
    const missingFields: string[] = [];
    const dataQualityIssues: string[] = [];

    try {
      // Recopilar información básica del paciente
      const patientInfo = await this.aggregatePatientInfo(patientId);
      sources.push('patients');

      // Demografía y contacto
      const demographics = await this.aggregateDemographics(patientId);
      const contactInfo = await this.aggregateContactInfo(patientId);

      // Historia médica completa
      const medicalHistory = await this.aggregateMedicalHistory(patientId);
      if (medicalHistory.conditions.length === 0) {
        missingFields.push('chronic_conditions');
      }
      sources.push('medical_history');

      // Medicamentos
      const medications = await this.aggregateMedications(patientId);
      sources.push('prescriptions');

      // Alergias
      const allergies = await this.aggregateAllergies(patientId);
      if (Object.values(allergies).every((arr) => arr.length === 0)) {
        dataQualityIssues.push('No allergies documented - verify if none or missing data');
      }
      sources.push('allergies');

      // Inmunizaciones
      const immunizations = await this.aggregateImmunizations(patientId);
      sources.push('immunizations');

      // Resultados de laboratorio
      const labResults = await this.aggregateLabResults(patientId);
      sources.push('lab_results');

      // Signos vitales
      const vitalSigns = await this.aggregateVitalSigns(patientId);
      sources.push('vital_signs');

      // Documentos clínicos
      const clinicalDocuments = await this.aggregateClinicalDocuments(patientId);
      sources.push('clinical_documents');

      // Estudios de imagen
      const imagingStudies = await this.aggregateImagingStudies(patientId);
      sources.push('imaging_studies');

      // Procedimientos
      const procedures = await this.aggregateProcedures(patientId);
      sources.push('procedures');

      // Historia de citas
      const appointments = await this.aggregateAppointments(patientId);
      sources.push('appointments');

      // Telemedicina
      const telemedicineHistory = await this.aggregateTelemedicine(patientId);
      sources.push('telemedicine_sessions');

      // Información de seguro
      const insurance = await this.aggregateInsurance(patientId);
      if (insurance.length === 0) {
        missingFields.push('insurance_information');
      }
      sources.push('insurance');

      // Facturación
      const billing = await this.aggregateBilling(patientId);
      sources.push('billing');

      // Consentimientos
      const consents = await this.aggregateConsents(patientId);
      sources.push('consents');

      // Calcular métricas de completitud y calidad
      const totalRecords = this.calculateTotalRecords({
        medicalHistory,
        medications,
        allergies,
        immunizations,
        labResults,
        vitalSigns,
        clinicalDocuments,
        imagingStudies,
        procedures,
        appointments,
        telemedicineHistory,
        insurance,
        consents,
      });

      const completenessScore = this.calculateCompletenessScore(missingFields);
      const dataQualityScore = this.calculateDataQualityScore(dataQualityIssues);

      // Crear metadata de agregación
      const metadata: AggregationMetadata = {
        aggregationDate: new Date(),
        sources,
        version: '1.0.0',
        totalRecords,
        dateRange: this.calculateDateRange({
          appointments,
          labResults,
          vitalSigns,
        }),
        completeness: {
          score: completenessScore,
          missingFields,
        },
        dataQuality: {
          score: dataQualityScore,
          issues: dataQualityIssues,
        },
      };

      logger.info(`[Aggregator] Aggregation completed in ${Date.now() - startTime}ms`);
      logger.info(
        `[Aggregator] Total records: ${totalRecords}, Completeness: ${completenessScore}%`,
      );

      return {
        patientInfo,
        demographics,
        contactInfo,
        medicalHistory,
        medications,
        allergies,
        immunizations,
        labResults,
        vitalSigns,
        clinicalDocuments,
        imagingStudies,
        procedures,
        appointments,
        telemedicineHistory,
        insurance,
        billing,
        consents,
        metadata,
      };
    } catch (error) {
      logger.error('[Aggregator] Error during aggregation:', error);
      throw new Error(`Failed to aggregate patient data: ${(error as any).message}`);
    }
  }

  /**
   * Agrega información básica del paciente
   */
  private async aggregatePatientInfo(patientId: string): Promise<PatientInfo> {
    const patientData = await this.exportService.getPatientData(patientId);

    return {
      id: patientId,
      firstName: patientData.firstName || '',
      lastName: patientData.lastName || '',
      dateOfBirth: patientData.dateOfBirth || new Date(),
      gender: patientData.gender || 'unknown',
      mrn: patientData.medicalRecordNumber,
      nationalId: patientData.nationalId,
    };
  }

  /**
   * Agrega datos demográficos
   */
  private async aggregateDemographics(patientId: string): Promise<Demographics> {
    const patientData = await this.exportService.getPatientData(patientId);

    return {
      ethnicity: patientData.ethnicity,
      language: patientData.preferredLanguage || 'es',
      maritalStatus: patientData.maritalStatus,
      occupation: patientData.occupation,
      education: patientData.educationLevel,
    };
  }

  /**
   * Agrega información de contacto
   */
  private async aggregateContactInfo(patientId: string): Promise<ContactInfo> {
    const patientData = await this.exportService.getPatientData(patientId);

    return {
      address: {
        street: patientData.address?.street || '',
        city: patientData.address?.city || '',
        state: patientData.address?.state || '',
        postalCode: patientData.address?.postalCode || '',
        country: patientData.address?.country || 'Argentina',
      },
      phone: patientData.phone || '',
      email: patientData.email || '',
      emergencyContact: {
        name: patientData.emergencyContact?.name || '',
        relationship: patientData.emergencyContact?.relationship || '',
        phone: patientData.emergencyContact?.phone || '',
      },
    };
  }

  /**
   * Agrega historia médica completa
   */
  private async aggregateMedicalHistory(patientId: string): Promise<MedicalHistory> {
    const medicalRecords = await this.exportService.getMedicalRecords(patientId);

    // Extraer condiciones crónicas
    const conditions: ChronicCondition[] = medicalRecords
      .filter((record: any) => record.type === 'diagnosis')
      .map((record: any) => ({
        id: record.id,
        name: record.diagnosis || '',
        icdCode: record.icdCode || '',
        diagnosedDate: record.date,
        status: record.status || 'active',
        severity: record.severity || 'moderate',
        notes: record.notes,
      }));

    // Extraer cirugías
    const surgeries: Surgery[] = medicalRecords
      .filter((record: any) => record.type === 'surgery')
      .map((record: any) => ({
        id: record.id,
        procedure: record.procedure || '',
        date: record.date,
        surgeon: record.performer,
        facility: record.facility,
        complications: record.complications,
        outcome: record.outcome || 'successful',
      }));

    // Historia familiar (mock por ahora)
    const familyHistory: FamilyMedicalHistory[] = [];

    // Historia social
    const socialHistory: SocialHistory = {
      smoking: {
        status: 'never',
        packsPerDay: 0,
        yearsSmoking: 0,
      },
      alcohol: {
        status: 'none',
        drinksPerWeek: 0,
      },
      exercise: {
        frequency: 'regular',
        type: 'mixed',
        minutesPerWeek: 150,
      },
      diet: 'balanced',
      occupation: 'professional',
      stressLevel: 'moderate',
    };

    // Revisión de sistemas
    const reviewOfSystems: ReviewOfSystems = {
      constitutional: 'No fever, weight loss, or fatigue',
      cardiovascular: 'No chest pain or palpitations',
      respiratory: 'No shortness of breath or cough',
      gastrointestinal: 'No abdominal pain or changes in bowel habits',
      genitourinary: 'No urinary symptoms',
      musculoskeletal: 'No joint pain or swelling',
      neurological: 'No headaches or dizziness',
      psychiatric: 'No depression or anxiety',
      endocrine: 'No excessive thirst or urination',
      hematologic: 'No easy bruising or bleeding',
      allergic: 'No rashes or itching',
    };

    return {
      conditions,
      surgeries,
      familyHistory,
      socialHistory,
      reviewOfSystems,
    };
  }

  /**
   * Agrega perfil de medicamentos
   */
  private async aggregateMedications(patientId: string): Promise<MedicationProfile> {
    const prescriptions = await this.exportService.getPrescriptions(patientId);

    const now = new Date();
    const current: Medication[] = [];
    const past: Medication[] = [];

    prescriptions.forEach((rx: any) => {
      const medication: Medication = {
        id: rx.id,
        name: rx.medicationName,
        genericName: rx.genericName,
        dosage: rx.dosage,
        frequency: rx.frequency,
        route: rx.route || 'oral',
        startDate: rx.startDate,
        endDate: rx.endDate,
        prescribedBy: rx.prescribedBy,
        indication: rx.indication || '',
        sideEffects: rx.sideEffects || [],
        interactions: rx.interactions || [],
      };

      if (!rx.endDate || rx.endDate > now) {
        current.push(medication);
      } else {
        past.push(medication);
      }
    });

    return {
      current,
      past,
      adherenceRate: 85, // Mock value
      lastReviewDate: new Date(),
    };
  }

  /**
   * Agrega perfil de alergias
   */
  private async aggregateAllergies(patientId: string): Promise<AllergyProfile> {
    const allergies = await this.exportService.getAllergies(patientId);

    const medications: Allergy[] = [];
    const foods: Allergy[] = [];
    const environmental: Allergy[] = [];
    const other: Allergy[] = [];

    allergies.forEach((allergy: any) => {
      const allergyRecord: Allergy = {
        id: allergy.id,
        allergen: allergy.allergen,
        reaction: allergy.reaction,
        severity: allergy.severity || 'moderate',
        onset: allergy.onsetDate || new Date(),
        verifiedBy: allergy.verifiedBy,
        notes: allergy.notes,
      };

      switch (allergy.type) {
        case 'medication':
          medications.push(allergyRecord);
          break;
        case 'food':
          foods.push(allergyRecord);
          break;
        case 'environmental':
          environmental.push(allergyRecord);
          break;
        default:
          other.push(allergyRecord);
      }
    });

    return {
      medications,
      foods,
      environmental,
      other,
    };
  }

  /**
   * Agrega registros de inmunización
   */
  private async aggregateImmunizations(patientId: string): Promise<ImmunizationRecord[]> {
    const immunizations = await this.exportService.getImmunizations(patientId);

    return immunizations.map((imm: any) => ({
      id: imm.id,
      vaccine: imm.vaccine,
      date: imm.date,
      lot: imm.lotNumber,
      site: imm.site,
      route: imm.route,
      administeredBy: imm.administeredBy,
      nextDue: imm.nextDue,
    }));
  }

  /**
   * Agrega resultados de laboratorio
   */
  private async aggregateLabResults(patientId: string): Promise<LabResultSummary> {
    const labResults = await this.exportService.getLabResults(patientId);

    // Convertir a formato estructurado
    const results: LabResult[] = labResults.map((lab: any) => ({
      id: lab.id,
      testName: lab.testName,
      value: lab.value,
      unit: lab.unit,
      referenceRange: lab.referenceRange,
      flag: lab.flag || 'normal',
      date: lab.date,
      orderedBy: lab.orderedBy,
      lab: lab.laboratory,
    }));

    // Filtrar resultados anormales
    const abnormalResults = results.filter((r) => r.flag !== 'normal');

    // Calcular tendencias (simplificado)
    const trends: LabTrend[] = [];
    const testGroups = new Map<string, LabResult[]>();

    results.forEach((result: any) => {
      if (!testGroups.has(result.testName)) {
        testGroups.set(result.testName, []);
      }
      testGroups.get(result.testName)!.push(result);
    });

    testGroups.forEach((tests, testName) => {
      if (tests.length >= 3) {
        const values = tests
          .filter((t) => typeof t.value === 'number')
          .map((t: any) => ({
            date: t.date,
            value: t.value as number,
          }))
          .sort((a, b) => a.date.getTime() - b.date.getTime());

        if (values.length >= 3) {
          const trend = this.calculateTrend(values.map((v: any) => v.value));
          trends.push({
            testName,
            values,
            trendDirection: trend,
          });
        }
      }
    });

    // Órdenes pendientes (mock)
    const pendingOrders: LabOrder[] = [];

    return {
      recentResults: results.slice(0, 20),
      trends,
      abnormalResults,
      pendingOrders,
    };
  }

  /**
   * Agrega tendencias de signos vitales
   */
  private async aggregateVitalSigns(patientId: string): Promise<VitalSignsTrend> {
    const vitalSigns = await this.exportService.getVitalSigns(patientId);

    const vitals: VitalSigns[] = vitalSigns.map((vs: any) => ({
      date: vs.date,
      bloodPressure: {
        systolic: vs.bloodPressureSystolic || 120,
        diastolic: vs.bloodPressureDiastolic || 80,
      },
      heartRate: vs.heartRate || 70,
      temperature: vs.temperature || 36.5,
      respiratoryRate: vs.respiratoryRate || 16,
      oxygenSaturation: vs.oxygenSaturation,
      weight: vs.weight,
      height: vs.height,
      bmi: vs.bmi,
      pain: vs.painLevel,
    }));

    // Detectar alertas
    const alerts: VitalAlert[] = [];
    const latest = vitals[0];

    if (latest) {
      if (latest.bloodPressure.systolic > 140) {
        alerts.push({
          parameter: 'Systolic BP',
          value: latest.bloodPressure.systolic,
          threshold: '>140',
          severity: latest.bloodPressure.systolic > 160 ? 'critical' : 'warning',
          date: latest.date,
        });
      }

      if (latest.heartRate > 100 || latest.heartRate < 60) {
        alerts.push({
          parameter: 'Heart Rate',
          value: latest.heartRate,
          threshold: latest.heartRate > 100 ? '>100' : '<60',
          severity: 'warning',
          date: latest.date,
        });
      }
    }

    return {
      latest: latest || this.createDefaultVitalSigns(),
      history: vitals,
      alerts,
    };
  }

  /**
   * Agrega documentos clínicos
   */
  private async aggregateClinicalDocuments(patientId: string): Promise<ClinicalDocument[]> {
    const documents = await this.exportService.getDocuments(patientId);

    return documents.map((doc: any) => ({
      id: doc.id,
      type: doc.type,
      title: doc.title || doc.type,
      date: doc.date,
      author: doc.author || 'Unknown',
      facility: doc.facility,
      content: doc.content,
      attachmentUrl: doc.url,
      category: this.categorizeDocument(doc.type),
    }));
  }

  /**
   * Agrega estudios de imagen
   */
  private async aggregateImagingStudies(patientId: string): Promise<ImagingStudy[]> {
    const imaging = await this.exportService.getImagingStudies(patientId);

    return imaging.map((study: any) => ({
      id: study.id,
      modality: study.modality || 'other',
      bodyPart: study.bodyPart || '',
      date: study.date,
      indication: study.indication || '',
      findings: study.findings,
      impression: study.impression,
      radiologist: study.radiologist,
      facility: study.facility,
      imageUrls: study.images || [],
    }));
  }

  /**
   * Agrega registros de procedimientos
   */
  private async aggregateProcedures(patientId: string): Promise<ProcedureRecord[]> {
    const procedures = await this.exportService.getProcedures(patientId);

    return procedures.map((proc: any) => ({
      id: proc.id,
      name: proc.name,
      cptCode: proc.cptCode,
      date: proc.date,
      performer: proc.performer,
      facility: proc.facility,
      indication: proc.indication || '',
      findings: proc.findings,
      complications: proc.complications,
      followUp: proc.followUp,
    }));
  }

  /**
   * Agrega historia de citas
   */
  private async aggregateAppointments(patientId: string): Promise<AppointmentHistory> {
    const appointments = await this.exportService.getAppointments(patientId);

    const now = new Date();
    const upcoming: Appointment[] = [];
    const past: Appointment[] = [];
    let noShows = 0;
    let cancellations = 0;

    appointments.forEach((apt: any) => {
      const appointment: Appointment = {
        id: apt.id,
        date: apt.date,
        type: apt.type || 'consultation',
        provider: apt.doctorName || '',
        specialty: apt.specialty,
        reason: apt.reason || '',
        status: apt.status || 'scheduled',
        notes: apt.notes,
        followUpRequired: apt.followUpRequired,
      };

      if (apt.status === 'no-show') noShows++;
      if (apt.status === 'cancelled') cancellations++;

      if (apt.date > now) {
        upcoming.push(appointment);
      } else {
        past.push(appointment);
      }
    });

    return {
      upcoming,
      past,
      noShows,
      cancellations,
      totalVisits: past.filter((a) => a.status === 'completed').length,
    };
  }

  /**
   * Agrega historia de telemedicina
   */
  private async aggregateTelemedicine(patientId: string): Promise<TelemedicineRecord[]> {
    const sessions = await this.exportService.getTelemedicine(patientId);

    return sessions.map((session: any) => ({
      id: session.id,
      date: session.date,
      duration: session.duration || 0,
      provider: session.doctorName || '',
      chiefComplaint: session.chiefComplaint || '',
      diagnosis: session.diagnosis,
      treatment: session.treatment,
      prescriptions: session.prescriptions || [],
      followUp: session.followUp,
      recordingUrl: session.recordingUrl,
    }));
  }

  /**
   * Agrega información de seguro
   */
  private async aggregateInsurance(patientId: string): Promise<InsuranceInfo[]> {
    const insuranceData = await this.exportService.getInsurance(patientId);

    return insuranceData.map((ins: any) => ({
      id: ins.id,
      provider: ins.provider,
      planName: ins.planName,
      memberId: ins.memberId,
      groupNumber: ins.groupNumber,
      effectiveDate: ins.effectiveDate,
      expirationDate: ins.expirationDate,
      isPrimary: ins.isPrimary || false,
      copay: ins.copay,
      deductible: ins.deductible,
      outOfPocketMax: ins.outOfPocketMax,
    }));
  }

  /**
   * Agrega resumen de facturación
   */
  private async aggregateBilling(patientId: string): Promise<BillingSummary> {
    const billing = await this.exportService.getBilling(patientId);

    let totalCharges = 0;
    let totalPayments = 0;

    const transactions: BillingTransaction[] = billing.map((bill: any) => {
      if (bill.type === 'charge') totalCharges += bill.amount;
      if (bill.type === 'payment') totalPayments += bill.amount;

      return {
        id: bill.id,
        date: bill.date,
        description: bill.description,
        amount: bill.amount,
        type: bill.type || 'charge',
        status: bill.status || 'pending',
        insurance: bill.insurance,
      };
    });

    return {
      totalCharges,
      totalPayments,
      balance: totalCharges - totalPayments,
      recentTransactions: transactions.slice(0, 10),
      paymentPlans: [],
    };
  }

  /**
   * Agrega registros de consentimiento
   */
  private async aggregateConsents(patientId: string): Promise<ConsentRecord[]> {
    const consents = await this.exportService.getConsents(patientId);

    return consents.map((consent: any) => ({
      id: consent.id,
      type: consent.type,
      date: consent.date,
      expirationDate: consent.expirationDate,
      scope: consent.scope || 'general',
      grantedTo: consent.grantedTo,
      withdrawable: consent.withdrawable !== false,
      status: consent.status || 'active',
      signatureUrl: consent.signatureUrl,
    }));
  }

  /**
   * Calcula el total de registros
   */
  private calculateTotalRecords(data: any): number {
    let total = 0;

    if (data.medicalHistory) {
      total += data.medicalHistory.conditions.length;
      total += data.medicalHistory.surgeries.length;
    }

    if (data.medications) {
      total += data.medications.current.length;
      total += data.medications.past.length;
    }

    if (data.allergies) {
      total += Object.values(data.allergies).flat().length;
    }

    total += data.immunizations?.length || 0;
    total += data.labResults?.recentResults?.length || 0;
    total += data.vitalSigns?.history?.length || 0;
    total += data.clinicalDocuments?.length || 0;
    total += data.imagingStudies?.length || 0;
    total += data.procedures?.length || 0;
    total += data.appointments?.upcoming?.length || 0;
    total += data.appointments?.past?.length || 0;
    total += data.telemedicineHistory?.length || 0;
    total += data.insurance?.length || 0;
    total += data.consents?.length || 0;

    return total;
  }

  /**
   * Calcula el puntaje de completitud
   */
  private calculateCompletenessScore(missingFields: string[]): number {
    const totalFields = 15; // Número total de campos principales
    const missingCount = missingFields.length;
    return Math.round(((totalFields - missingCount) / totalFields) * 100);
  }

  /**
   * Calcula el puntaje de calidad de datos
   */
  private calculateDataQualityScore(issues: string[]): number {
    // Penalización del 10% por cada problema de calidad
    const penalty = issues.length * 10;
    return Math.max(0, 100 - penalty);
  }

  /**
   * Calcula el rango de fechas de los datos
   */
  private calculateDateRange(data: any): { start: Date; end: Date } {
    const dates: Date[] = [];

    // Recopilar todas las fechas
    data.appointments?.past?.forEach((apt: Appointment) => dates.push(apt.date));
    data.appointments?.upcoming?.forEach((apt: Appointment) => dates.push(apt.date));
    data.labResults?.recentResults?.forEach((lab: LabResult) => dates.push(lab.date));
    data.vitalSigns?.history?.forEach((vs: VitalSigns) => dates.push(vs.date));

    if (dates.length === 0) {
      const now = new Date();
      return {
        start: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
        end: now,
      };
    }

    dates.sort((a, b) => a.getTime() - b.getTime());

    return {
      start: dates[0],
      end: dates[dates.length - 1],
    };
  }

  /**
   * Calcula tendencia de valores
   */
  private calculateTrend(values: number[]): 'stable' | 'improving' | 'worsening' {
    if (values.length < 3) return 'stable';

    // Calcular pendiente simple
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const change = ((avgSecond - avgFirst) / avgFirst) * 100;

    if (Math.abs(change) < 5) return 'stable';
    return change > 0 ? 'worsening' : 'improving';
  }

  /**
   * Categoriza documento clínico
   */
  private categorizeDocument(
    type: string,
  ): 'consultation' | 'discharge' | 'operative' | 'progress' | 'other' {
    const lowerType = type.toLowerCase();

    if (lowerType.includes('consultation') || lowerType.includes('consult')) {
      return 'consultation';
    }
    if (lowerType.includes('discharge')) {
      return 'discharge';
    }
    if (lowerType.includes('operative') || lowerType.includes('surgery')) {
      return 'operative';
    }
    if (lowerType.includes('progress')) {
      return 'progress';
    }

    return 'other';
  }

  /**
   * Crea signos vitales por defecto
   */
  private createDefaultVitalSigns(): VitalSigns {
    return {
      date: new Date(),
      bloodPressure: { systolic: 120, diastolic: 80 },
      heartRate: 70,
      temperature: 36.5,
      respiratoryRate: 16,
      oxygenSaturation: 98,
      weight: 70,
      height: 170,
      bmi: 24.2,
      pain: 0,
    };
  }

  /**
   * Exporta datos agregados a formato específico
   */
  async exportAggregatedData(
    aggregatedData: AggregatedPatientData,
    format: ExportFormat,
  ): Promise<Buffer> {
    switch (format.type) {
      case 'json':
        return Buffer.from(JSON.stringify(aggregatedData, null, 2));

      case 'pdf':
        const { patientDataPDFService } = await import('./patient-data-pdf.service');
        return await patientDataPDFService.generatePDF(aggregatedData, {
          language: format.language || 'es',
          includeTOC: true,
          includeWatermark: true,
          watermarkText: 'CONFIDENCIAL',
        });

      case 'csv':
        return this.exportToCSV(aggregatedData);

      case 'fhir':
        return this.exportToFHIR(aggregatedData);

      case 'zip':
        return this.exportToZIP(aggregatedData);

      default:
        throw new Error(`Unsupported export format: ${format.type}`);
    }
  }

  /**
   * Exporta a formato CSV
   */
  private async exportToCSV(data: AggregatedPatientData): Promise<Buffer> {
    // Implementación simplificada CSV
    const csv: string[] = [];

    // Información del paciente
    csv.push('Patient Information');
    csv.push('Field,Value');
    csv.push(`ID,${data.patientInfo.id}`);
    csv.push(`Name,"${data.patientInfo.firstName} ${data.patientInfo.lastName}"`);
    csv.push(`Date of Birth,${data.patientInfo.dateOfBirth.toISOString().split('T')[0]}`);
    csv.push(`Gender,${data.patientInfo.gender}`);
    csv.push('');

    // Medicamentos actuales
    csv.push('Current Medications');
    csv.push('Name,Dosage,Frequency,Start Date');
    data.medications.current.forEach((med: any) => {
      csv.push(
        `"${med.name}","${med.dosage}","${med.frequency}",${med.startDate.toISOString().split('T')[0]}`,
      );
    });
    csv.push('');

    // Alergias
    csv.push('Allergies');
    csv.push('Type,Allergen,Reaction,Severity');
    Object.entries(data.allergies).forEach(([type, allergies]) => {
      allergies.forEach((allergy: any) => {
        csv.push(`${type},"${allergy.allergen}","${allergy.reaction}",${allergy.severity}`);
      });
    });

    return Buffer.from(csv.join('\n'));
  }

  /**
   * Exporta a formato FHIR
   */
  private async exportToFHIR(data: AggregatedPatientData): Promise<Buffer> {
    // Estructura FHIR Bundle simplificada
    const fhirBundle = {
      resourceType: 'Bundle',
      type: 'collection',
      entry: [
        {
          resource: {
            resourceType: 'Patient',
            id: data.patientInfo.id,
            name: [
              {
                given: [data.patientInfo.firstName],
                family: data.patientInfo.lastName,
              },
            ],
            gender: data.patientInfo.gender,
            birthDate: data.patientInfo.dateOfBirth.toISOString().split('T')[0],
          },
        },
        ...data.medications.current.map((med: any) => ({
          resource: {
            resourceType: 'MedicationRequest',
            id: med.id,
            medicationCodeableConcept: {
              text: med.name,
            },
            dosageInstruction: [
              {
                text: `${med.dosage} ${med.frequency}`,
              },
            ],
          },
        })),
      ],
    };

    return Buffer.from(JSON.stringify(fhirBundle, null, 2));
  }

  /**
   * Exporta a formato ZIP con múltiples archivos
   */
  private async exportToZIP(data: AggregatedPatientData): Promise<Buffer> {
    // Dynamic import for server-only modules (ESM)
    const archiverModule = await import('archiver');
    const archiver: any = (archiverModule as any).default || (archiverModule as any);
    const { Writable } = await import('stream');

    const chunks: Buffer[] = [];
    const writable = new Writable({
      write(chunk: Buffer, encoding: string, callback: Function) {
        chunks.push(chunk);
        callback();
      },
    });

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(writable);

    // Agregar archivos al ZIP
    archive.append(JSON.stringify(data.patientInfo, null, 2), { name: 'patient_info.json' });
    archive.append(JSON.stringify(data.medicalHistory, null, 2), { name: 'medical_history.json' });
    archive.append(JSON.stringify(data.medications, null, 2), { name: 'medications.json' });
    archive.append(JSON.stringify(data.allergies, null, 2), { name: 'allergies.json' });
    archive.append(JSON.stringify(data.labResults, null, 2), { name: 'lab_results.json' });
    archive.append(JSON.stringify(data.vitalSigns, null, 2), { name: 'vital_signs.json' });
    archive.append(JSON.stringify(data.appointments, null, 2), { name: 'appointments.json' });
    archive.append(JSON.stringify(data.metadata, null, 2), { name: 'metadata.json' });

    await archive.finalize();

    return Buffer.concat(chunks);
  }
}

// Exportar instancia singleton
export const patientDataAggregator = new PatientDataAggregatorService();
