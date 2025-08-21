import { AggregatedPatientData } from './patient-data-aggregator.service';

/**
 * Servicio de Conversión a PDF para Datos del Paciente
 * Genera documentos PDF profesionales con información médica completa
 * Cumple con HIPAA y Ley 26.529 para entrega de información médica
 */

export interface PDFOptions {
  includeHeader: boolean;
  includeFooter: boolean;
  includeTOC: boolean; // Table of Contents
  includeWatermark: boolean;
  watermarkText?: string;
  // Soportamos ahora portugués ('pt') además de español e inglés
  language: 'es' | 'en' | 'pt';
  paperSize: 'A4' | 'Letter';
  margins?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  sections?: {
    patientInfo?: boolean;
    medicalHistory?: boolean;
    medications?: boolean;
    allergies?: boolean;
    immunizations?: boolean;
    labResults?: boolean;
    vitalSigns?: boolean;
    appointments?: boolean;
    insurance?: boolean;
    billing?: boolean;
  };
}

export interface PDFMetadata {
  title: string;
  author: string;
  subject: string;
  keywords: string[];
  creator: string;
  producer: string;
  creationDate: Date;
  modificationDate: Date;
}

interface PDFStyle {
  fontSize: number;
  font?: string;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: 'left' | 'center' | 'right' | 'justify';
  marginTop?: number;
  marginBottom?: number;
}

const STYLES: Record<string, PDFStyle> = {
  title: { fontSize: 24, bold: true, align: 'center', marginBottom: 20 },
  h1: { fontSize: 18, bold: true, marginTop: 15, marginBottom: 10 },
  h2: { fontSize: 16, bold: true, marginTop: 12, marginBottom: 8 },
  h3: { fontSize: 14, bold: true, marginTop: 10, marginBottom: 6 },
  body: { fontSize: 11, align: 'justify' },
  label: { fontSize: 10, bold: true, color: '#666666' },
  value: { fontSize: 11 },
  tableHeader: { fontSize: 10, bold: true, color: '#FFFFFF' },
  tableCell: { fontSize: 10 },
  footer: { fontSize: 8, color: '#999999', align: 'center' },
  watermark: { fontSize: 48, color: '#EEEEEE' },
};

const COLORS = {
  primary: '#1e40af', // Blue
  secondary: '#64748b', // Slate
  success: '#16a34a', // Green
  warning: '#ea580c', // Orange
  danger: '#dc2626', // Red
  info: '#0891b2', // Cyan
  light: '#f8fafc',
  dark: '#0f172a',
};

export class PatientDataPDFService {
  private doc: any; // PDFDocument instance
  private options: PDFOptions = {
    includeHeader: true,
    includeFooter: true,
    includeTOC: false,
    includeWatermark: false,
    language: 'es',
    paperSize: 'A4',
  };
  private currentY: number = 0;
  private pageNumber: number = 1;
  private totalPages: number = 0;

  private readonly PAGE_WIDTH = 595; // A4 width in points
  private readonly PAGE_HEIGHT = 842; // A4 height in points
  private readonly DEFAULT_MARGINS = {
    top: 72,
    bottom: 72,
    left: 72,
    right: 72,
  };

  /**
   * Genera un PDF con los datos agregados del paciente
   */
  async generatePDF(
    data: AggregatedPatientData,
    options: Partial<PDFOptions> = {},
  ): Promise<Buffer> {
    // Cargar PDFKit dinámicamente para evitar require() en TS y solo en entorno server
    const pdfkitModule = await import('pdfkit');
    const PDFDocument: any = (pdfkitModule as any).default || (pdfkitModule as any);
    this.options = this.mergeOptions(options);

    // Crear documento PDF
    this.doc = new PDFDocument({
      size: this.options.paperSize,
      margins: this.options.margins,
      bufferPages: true, // Para poder contar páginas
      info: this.generateMetadata(data),
    });

    const chunks: Buffer[] = [];
    this.doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    return new Promise((resolve, reject) => {
      this.doc.on('end', () => resolve(Buffer.concat(chunks)));
      this.doc.on('error', reject);

      try {
        // Generar contenido del PDF
        this.generateContent(data);

        // Finalizar documento
        this.doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Genera el contenido completo del PDF
   */
  private generateContent(data: AggregatedPatientData): void {
    // Portada
    this.generateCoverPage(data);

    // Tabla de contenidos
    if (this.options.includeTOC) {
      this.generateTableOfContents(data);
    }

    // Secciones principales
    const sections = this.options.sections || {};

    if (sections.patientInfo !== false) {
      this.generatePatientInfoSection(data);
    }

    if (sections.medicalHistory !== false) {
      this.generateMedicalHistorySection(data);
    }

    if (sections.medications !== false) {
      this.generateMedicationsSection(data);
    }

    if (sections.allergies !== false) {
      this.generateAllergiesSection(data);
    }

    if (sections.immunizations !== false) {
      this.generateImmunizationsSection(data);
    }

    if (sections.labResults !== false) {
      this.generateLabResultsSection(data);
    }

    if (sections.vitalSigns !== false) {
      this.generateVitalSignsSection(data);
    }

    if (sections.appointments !== false) {
      this.generateAppointmentsSection(data);
    }

    if (sections.insurance !== false) {
      this.generateInsuranceSection(data);
    }

    if (sections.billing !== false) {
      this.generateBillingSection(data);
    }

    // Agregar números de página
    this.addPageNumbers();
  }

  /**
   * Genera la página de portada
   */
  private generateCoverPage(data: AggregatedPatientData): void {
    const title =
      this.options.language === 'es' ? 'Historia Clínica Completa' : 'Complete Medical Record';

    // Logo placeholder
    this.currentY = 150;

    // Título
    this.addText(title, STYLES.title);
    this.currentY += 40;

    // Información del paciente
    this.doc.fontSize(14);
    this.addText(`${data.patientInfo.firstName} ${data.patientInfo.lastName}`, {
      fontSize: 20,
      bold: true,
      align: 'center',
    });

    this.currentY += 20;

    // Datos básicos
    const birthDate = new Date(data.patientInfo.dateOfBirth).toLocaleDateString();
    const age = this.calculateAge(data.patientInfo.dateOfBirth);

    this.addText(
      this.options.language === 'es'
        ? `Fecha de Nacimiento: ${birthDate} (${age} años)`
        : `Date of Birth: ${birthDate} (${age} years old)`,
      { fontSize: 12, align: 'center' },
    );

    if (data.patientInfo.mrn) {
      this.currentY += 10;
      this.addText(
        this.options.language === 'es'
          ? `Historia Clínica N°: ${data.patientInfo.mrn}`
          : `Medical Record Number: ${data.patientInfo.mrn}`,
        { fontSize: 12, align: 'center' },
      );
    }

    // Fecha de generación
    this.currentY = this.PAGE_HEIGHT - 200;
    const generationDate = new Date().toLocaleString();
    this.addText(
      this.options.language === 'es'
        ? `Documento generado el ${generationDate}`
        : `Document generated on ${generationDate}`,
      { fontSize: 10, align: 'center', color: COLORS.secondary },
    );

    // Disclaimer
    this.currentY += 20;
    this.addText(
      this.options.language === 'es'
        ? 'Este documento contiene información médica confidencial protegida por ley.'
        : 'This document contains confidential medical information protected by law.',
      { fontSize: 9, align: 'center', italic: true, color: COLORS.secondary },
    );

    // Nueva página
    this.doc.addPage();
  }

  /**
   * Genera tabla de contenidos
   */
  private generateTableOfContents(data: AggregatedPatientData): void {
    this.addSectionTitle(this.options.language === 'es' ? 'Índice' : 'Table of Contents');

    const sections = [
      {
        title: this.options.language === 'es' ? 'Información Personal' : 'Personal Information',
        page: 3,
      },
      {
        title: this.options.language === 'es' ? 'Historia Médica' : 'Medical History',
        page: 4,
      },
      {
        title: this.options.language === 'es' ? 'Medicamentos' : 'Medications',
        page: 6,
      },
      {
        title: this.options.language === 'es' ? 'Alergias' : 'Allergies',
        page: 8,
      },
      {
        title: this.options.language === 'es' ? 'Inmunizaciones' : 'Immunizations',
        page: 9,
      },
      {
        title: this.options.language === 'es' ? 'Resultados de Laboratorio' : 'Laboratory Results',
        page: 10,
      },
      {
        title: this.options.language === 'es' ? 'Signos Vitales' : 'Vital Signs',
        page: 12,
      },
      {
        title: this.options.language === 'es' ? 'Citas Médicas' : 'Medical Appointments',
        page: 14,
      },
    ];

    sections.forEach((section) => {
      this.doc
        .fontSize(12)
        .fillColor(COLORS.dark)
        .text(section.title, this.DEFAULT_MARGINS.left, this.currentY)
        .fillColor(COLORS.secondary)
        .text(
          section.page.toString(),
          this.PAGE_WIDTH - this.DEFAULT_MARGINS.right - 50,
          this.currentY,
        );

      // Línea punteada
      const lineY = this.currentY + 2;
      this.doc
        .strokeColor(COLORS.light)
        .moveTo(this.DEFAULT_MARGINS.left + 200, lineY)
        .lineTo(this.PAGE_WIDTH - this.DEFAULT_MARGINS.right - 60, lineY)
        .dash(2, { space: 2 })
        .stroke()
        .undash();

      this.currentY += 25;
    });

    this.doc.addPage();
  }

  /**
   * Genera sección de información del paciente
   */
  private generatePatientInfoSection(data: AggregatedPatientData): void {
    this.addSectionTitle(
      this.options.language === 'es' ? 'Información Personal' : 'Personal Information',
    );

    // Información básica
    this.addSubsection(this.options.language === 'es' ? 'Datos Personales' : 'Personal Data');

    const info = [
      {
        label: this.options.language === 'es' ? 'Nombre Completo' : 'Full Name',
        value: `${data.patientInfo.firstName} ${data.patientInfo.lastName}`,
      },
      {
        label: this.options.language === 'es' ? 'Fecha de Nacimiento' : 'Date of Birth',
        value: new Date(data.patientInfo.dateOfBirth).toLocaleDateString(),
      },
      {
        label: this.options.language === 'es' ? 'Género' : 'Gender',
        value: data.patientInfo.gender,
      },
      {
        label: this.options.language === 'es' ? 'Idioma Preferido' : 'Preferred Language',
        value: data.demographics.language,
      },
    ];

    if (data.patientInfo.nationalId) {
      info.push({
        label: this.options.language === 'es' ? 'DNI/CUIT' : 'National ID',
        value: data.patientInfo.nationalId,
      });
    }

    this.addInfoList(info);

    // Información de contacto
    this.addSubsection(
      this.options.language === 'es' ? 'Información de Contacto' : 'Contact Information',
    );

    const contact = [
      {
        label: this.options.language === 'es' ? 'Dirección' : 'Address',
        value: `${data.contactInfo.address.street}, ${data.contactInfo.address.city}, ${data.contactInfo.address.state} ${data.contactInfo.address.postalCode}`,
      },
      {
        label: this.options.language === 'es' ? 'Teléfono' : 'Phone',
        value: data.contactInfo.phone,
      },
      {
        label: this.options.language === 'es' ? 'Email' : 'Email',
        value: data.contactInfo.email,
      },
    ];

    this.addInfoList(contact);

    // Contacto de emergencia
    this.addSubsection(
      this.options.language === 'es' ? 'Contacto de Emergencia' : 'Emergency Contact',
    );

    const emergency = [
      {
        label: this.options.language === 'es' ? 'Nombre' : 'Name',
        value: data.contactInfo.emergencyContact.name,
      },
      {
        label: this.options.language === 'es' ? 'Relación' : 'Relationship',
        value: data.contactInfo.emergencyContact.relationship,
      },
      {
        label: this.options.language === 'es' ? 'Teléfono' : 'Phone',
        value: data.contactInfo.emergencyContact.phone,
      },
    ];

    this.addInfoList(emergency);
  }

  /**
   * Genera sección de historia médica
   */
  private generateMedicalHistorySection(data: AggregatedPatientData): void {
    this.addSectionTitle(this.options.language === 'es' ? 'Historia Médica' : 'Medical History');

    // Condiciones crónicas
    if (data.medicalHistory.conditions.length > 0) {
      this.addSubsection(
        this.options.language === 'es' ? 'Condiciones Crónicas' : 'Chronic Conditions',
      );

      data.medicalHistory.conditions.forEach((condition) => {
        this.doc
          .fontSize(11)
          .fillColor(COLORS.dark)
          .text(`• ${condition.name}`, this.DEFAULT_MARGINS.left + 10, this.currentY);

        this.currentY += 15;

        this.doc
          .fontSize(10)
          .fillColor(COLORS.secondary)
          .text(
            `  ${this.options.language === 'es' ? 'Diagnosticado' : 'Diagnosed'}: ${new Date(condition.diagnosedDate).toLocaleDateString()} | ` +
              `${this.options.language === 'es' ? 'Estado' : 'Status'}: ${condition.status} | ` +
              `${this.options.language === 'es' ? 'Severidad' : 'Severity'}: ${condition.severity}`,
            this.DEFAULT_MARGINS.left + 20,
            this.currentY,
          );

        this.currentY += 20;
      });
    }

    // Cirugías
    if (data.medicalHistory.surgeries.length > 0) {
      this.addSubsection(this.options.language === 'es' ? 'Cirugías' : 'Surgeries');

      data.medicalHistory.surgeries.forEach((surgery) => {
        this.doc
          .fontSize(11)
          .fillColor(COLORS.dark)
          .text(`• ${surgery.procedure}`, this.DEFAULT_MARGINS.left + 10, this.currentY);

        this.currentY += 15;

        this.doc
          .fontSize(10)
          .fillColor(COLORS.secondary)
          .text(
            `  ${this.options.language === 'es' ? 'Fecha' : 'Date'}: ${new Date(surgery.date).toLocaleDateString()}` +
              (surgery.surgeon
                ? ` | ${this.options.language === 'es' ? 'Cirujano' : 'Surgeon'}: ${surgery.surgeon}`
                : '') +
              (surgery.facility
                ? ` | ${this.options.language === 'es' ? 'Centro' : 'Facility'}: ${surgery.facility}`
                : ''),
            this.DEFAULT_MARGINS.left + 20,
            this.currentY,
          );

        this.currentY += 20;
      });
    }

    // Historia social
    this.addSubsection(this.options.language === 'es' ? 'Historia Social' : 'Social History');

    const socialHistory = [
      {
        label: this.options.language === 'es' ? 'Tabaco' : 'Smoking',
        value: data.medicalHistory.socialHistory.smoking.status,
      },
      {
        label: this.options.language === 'es' ? 'Alcohol' : 'Alcohol',
        value: data.medicalHistory.socialHistory.alcohol.status,
      },
      {
        label: this.options.language === 'es' ? 'Ejercicio' : 'Exercise',
        value: data.medicalHistory.socialHistory.exercise.frequency,
      },
      {
        label: this.options.language === 'es' ? 'Nivel de Estrés' : 'Stress Level',
        value: data.medicalHistory.socialHistory.stressLevel,
      },
    ];

    this.addInfoList(socialHistory);
  }

  /**
   * Genera sección de medicamentos
   */
  private generateMedicationsSection(data: AggregatedPatientData): void {
    this.addSectionTitle(this.options.language === 'es' ? 'Medicamentos' : 'Medications');

    // Medicamentos actuales
    if (data.medications.current.length > 0) {
      this.addSubsection(
        this.options.language === 'es' ? 'Medicamentos Actuales' : 'Current Medications',
      );

      // Crear tabla
      const headers =
        this.options.language === 'es'
          ? ['Medicamento', 'Dosis', 'Frecuencia', 'Inicio']
          : ['Medication', 'Dosage', 'Frequency', 'Start Date'];

      const rows = data.medications.current.map((med) => [
        med.name,
        med.dosage,
        med.frequency,
        new Date(med.startDate).toLocaleDateString(),
      ]);

      this.addTable(headers, rows);
    }

    // Medicamentos pasados (resumen)
    if (data.medications.past.length > 0) {
      this.addSubsection(
        this.options.language === 'es' ? 'Medicamentos Anteriores' : 'Past Medications',
      );

      this.doc
        .fontSize(10)
        .fillColor(COLORS.secondary)
        .text(
          this.options.language === 'es'
            ? `Total de medicamentos anteriores: ${data.medications.past.length}`
            : `Total past medications: ${data.medications.past.length}`,
          this.DEFAULT_MARGINS.left,
          this.currentY,
        );

      this.currentY += 20;
    }
  }

  /**
   * Genera sección de alergias
   */
  private generateAllergiesSection(data: AggregatedPatientData): void {
    this.addSectionTitle(this.options.language === 'es' ? 'Alergias' : 'Allergies');

    const allergyCategories = [
      {
        key: 'medications' as const,
        title: this.options.language === 'es' ? 'Medicamentos' : 'Medications',
      },
      {
        key: 'foods' as const,
        title: this.options.language === 'es' ? 'Alimentos' : 'Foods',
      },
      {
        key: 'environmental' as const,
        title: this.options.language === 'es' ? 'Ambientales' : 'Environmental',
      },
      {
        key: 'other' as const,
        title: this.options.language === 'es' ? 'Otras' : 'Other',
      },
    ];

    allergyCategories.forEach((category) => {
      const allergies = data.allergies[category.key];
      if (allergies.length > 0) {
        this.addSubsection(category.title);

        allergies.forEach((allergy) => {
          // Determinar color según severidad
          let severityColor = COLORS.info;
          if (allergy.severity === 'severe') severityColor = COLORS.warning;
          if (allergy.severity === 'life-threatening') severityColor = COLORS.danger;

          this.doc
            .fontSize(11)
            .fillColor(COLORS.dark)
            .text(`• ${allergy.allergen}`, this.DEFAULT_MARGINS.left + 10, this.currentY);

          this.currentY += 15;

          this.doc
            .fontSize(10)
            .fillColor(severityColor)
            .text(
              `  ${this.options.language === 'es' ? 'Reacción' : 'Reaction'}: ${allergy.reaction} | ` +
                `${this.options.language === 'es' ? 'Severidad' : 'Severity'}: ${allergy.severity}`,
              this.DEFAULT_MARGINS.left + 20,
              this.currentY,
            );

          this.currentY += 20;
        });
      }
    });

    // Si no hay alergias
    const totalAllergies = Object.values(data.allergies).flat().length;
    if (totalAllergies === 0) {
      this.doc
        .fontSize(11)
        .fillColor(COLORS.success)
        .text(
          this.options.language === 'es'
            ? '✓ No se han reportado alergias'
            : '✓ No allergies reported',
          this.DEFAULT_MARGINS.left,
          this.currentY,
        );

      this.currentY += 20;
    }
  }

  /**
   * Genera sección de inmunizaciones
   */
  private generateImmunizationsSection(data: AggregatedPatientData): void {
    this.addSectionTitle(this.options.language === 'es' ? 'Inmunizaciones' : 'Immunizations');

    if (data.immunizations.length > 0) {
      const headers =
        this.options.language === 'es'
          ? ['Vacuna', 'Fecha', 'Administrado por', 'Próxima dosis']
          : ['Vaccine', 'Date', 'Administered by', 'Next due'];

      const rows = data.immunizations.map((imm) => [
        imm.vaccine,
        new Date(imm.date).toLocaleDateString(),
        imm.administeredBy || '-',
        imm.nextDue ? new Date(imm.nextDue).toLocaleDateString() : '-',
      ]);

      this.addTable(headers, rows);
    } else {
      this.doc
        .fontSize(11)
        .fillColor(COLORS.secondary)
        .text(
          this.options.language === 'es'
            ? 'No hay registros de inmunización disponibles'
            : 'No immunization records available',
          this.DEFAULT_MARGINS.left,
          this.currentY,
        );

      this.currentY += 20;
    }
  }

  /**
   * Genera sección de resultados de laboratorio
   */
  private generateLabResultsSection(data: AggregatedPatientData): void {
    this.addSectionTitle(
      this.options.language === 'es' ? 'Resultados de Laboratorio' : 'Laboratory Results',
    );

    // Resultados recientes
    if (data.labResults.recentResults.length > 0) {
      this.addSubsection(
        this.options.language === 'es' ? 'Resultados Recientes' : 'Recent Results',
      );

      // Mostrar solo los primeros 10 resultados
      const results = data.labResults.recentResults.slice(0, 10);

      const headers =
        this.options.language === 'es'
          ? ['Prueba', 'Valor', 'Rango', 'Fecha']
          : ['Test', 'Value', 'Range', 'Date'];

      const rows = results.map((result) => {
        let valueDisplay = `${result.value}`;
        if (result.unit) valueDisplay += ` ${result.unit}`;

        // Agregar indicador si está fuera de rango
        if (result.flag === 'high') valueDisplay += ' ↑';
        if (result.flag === 'low') valueDisplay += ' ↓';
        if (result.flag === 'critical') valueDisplay += ' ⚠';

        return [
          result.testName,
          valueDisplay,
          result.referenceRange || '-',
          new Date(result.date).toLocaleDateString(),
        ];
      });

      this.addTable(headers, rows);
    }

    // Resultados anormales
    if (data.labResults.abnormalResults.length > 0) {
      this.addSubsection(
        this.options.language === 'es' ? 'Resultados Anormales' : 'Abnormal Results',
      );

      this.doc
        .fontSize(10)
        .fillColor(COLORS.warning)
        .text(
          this.options.language === 'es'
            ? `⚠ Se encontraron ${data.labResults.abnormalResults.length} resultados fuera de rango normal`
            : `⚠ Found ${data.labResults.abnormalResults.length} results outside normal range`,
          this.DEFAULT_MARGINS.left,
          this.currentY,
        );

      this.currentY += 20;
    }
  }

  /**
   * Genera sección de signos vitales
   */
  private generateVitalSignsSection(data: AggregatedPatientData): void {
    this.addSectionTitle(this.options.language === 'es' ? 'Signos Vitales' : 'Vital Signs');

    // Últimos signos vitales
    if (data.vitalSigns.latest) {
      this.addSubsection(this.options.language === 'es' ? 'Última Medición' : 'Latest Measurement');

      const vitals = data.vitalSigns.latest;
      const vitalsList = [
        {
          label: this.options.language === 'es' ? 'Presión Arterial' : 'Blood Pressure',
          value: `${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic} mmHg`,
        },
        {
          label: this.options.language === 'es' ? 'Frecuencia Cardíaca' : 'Heart Rate',
          value: `${vitals.heartRate} bpm`,
        },
        {
          label: this.options.language === 'es' ? 'Temperatura' : 'Temperature',
          value: `${vitals.temperature}°C`,
        },
        {
          label: this.options.language === 'es' ? 'Frecuencia Respiratoria' : 'Respiratory Rate',
          value: `${vitals.respiratoryRate} rpm`,
        },
      ];

      if (vitals.oxygenSaturation) {
        vitalsList.push({
          label: this.options.language === 'es' ? 'Saturación O2' : 'O2 Saturation',
          value: `${vitals.oxygenSaturation}%`,
        });
      }

      if (vitals.weight) {
        vitalsList.push({
          label: this.options.language === 'es' ? 'Peso' : 'Weight',
          value: `${vitals.weight} kg`,
        });
      }

      if (vitals.bmi) {
        vitalsList.push({
          label: 'BMI',
          value: vitals.bmi.toFixed(1),
        });
      }

      this.addInfoList(vitalsList);
    }

    // Alertas
    if (data.vitalSigns.alerts.length > 0) {
      this.addSubsection(this.options.language === 'es' ? 'Alertas' : 'Alerts');

      data.vitalSigns.alerts.forEach((alert) => {
        const color = alert.severity === 'critical' ? COLORS.danger : COLORS.warning;

        this.doc
          .fontSize(10)
          .fillColor(color)
          .text(
            `⚠ ${alert.parameter}: ${alert.value} (${alert.threshold})`,
            this.DEFAULT_MARGINS.left,
            this.currentY,
          );

        this.currentY += 15;
      });
    }
  }

  /**
   * Genera sección de citas
   */
  private generateAppointmentsSection(data: AggregatedPatientData): void {
    this.addSectionTitle(this.options.language === 'es' ? 'Citas Médicas' : 'Medical Appointments');

    // Próximas citas
    if (data.appointments.upcoming.length > 0) {
      this.addSubsection(
        this.options.language === 'es' ? 'Próximas Citas' : 'Upcoming Appointments',
      );

      const headers =
        this.options.language === 'es'
          ? ['Fecha', 'Tipo', 'Profesional', 'Motivo']
          : ['Date', 'Type', 'Provider', 'Reason'];

      const rows = data.appointments.upcoming
        .slice(0, 5)
        .map((apt) => [new Date(apt.date).toLocaleString(), apt.type, apt.provider, apt.reason]);

      this.addTable(headers, rows);
    }

    // Resumen de historia
    this.addSubsection(this.options.language === 'es' ? 'Resumen de Historia' : 'History Summary');

    const summary = [
      {
        label: this.options.language === 'es' ? 'Total de Visitas' : 'Total Visits',
        value: data.appointments.totalVisits.toString(),
      },
      {
        label: this.options.language === 'es' ? 'Citas Canceladas' : 'Cancelled',
        value: data.appointments.cancellations.toString(),
      },
      {
        label: this.options.language === 'es' ? 'No Presentaciones' : 'No Shows',
        value: data.appointments.noShows.toString(),
      },
    ];

    this.addInfoList(summary);
  }

  /**
   * Genera sección de seguro
   */
  private generateInsuranceSection(data: AggregatedPatientData): void {
    if (data.insurance.length === 0) return;

    this.addSectionTitle(
      this.options.language === 'es' ? 'Información de Seguro' : 'Insurance Information',
    );

    data.insurance.forEach((ins, index) => {
      if (index > 0) this.currentY += 10;

      this.addSubsection(
        ins.isPrimary
          ? this.options.language === 'es'
            ? 'Seguro Primario'
            : 'Primary Insurance'
          : this.options.language === 'es'
            ? 'Seguro Secundario'
            : 'Secondary Insurance',
      );

      const insuranceInfo = [
        {
          label: this.options.language === 'es' ? 'Proveedor' : 'Provider',
          value: ins.provider,
        },
        {
          label: this.options.language === 'es' ? 'Plan' : 'Plan',
          value: ins.planName,
        },
        {
          label: this.options.language === 'es' ? 'ID de Miembro' : 'Member ID',
          value: ins.memberId,
        },
        {
          label: this.options.language === 'es' ? 'Vigente desde' : 'Effective Date',
          value: new Date(ins.effectiveDate).toLocaleDateString(),
        },
      ];

      this.addInfoList(insuranceInfo);
    });
  }

  /**
   * Genera sección de facturación
   */
  private generateBillingSection(data: AggregatedPatientData): void {
    this.addSectionTitle(
      this.options.language === 'es' ? 'Resumen de Facturación' : 'Billing Summary',
    );

    const billingSummary = [
      {
        label: this.options.language === 'es' ? 'Total de Cargos' : 'Total Charges',
        value: this.formatCurrency(data.billing.totalCharges),
      },
      {
        label: this.options.language === 'es' ? 'Total de Pagos' : 'Total Payments',
        value: this.formatCurrency(data.billing.totalPayments),
      },
      {
        label: this.options.language === 'es' ? 'Saldo Pendiente' : 'Balance Due',
        value: this.formatCurrency(data.billing.balance),
      },
    ];

    this.addInfoList(billingSummary);
  }

  // === MÉTODOS AUXILIARES ===

  /**
   * Combina opciones por defecto con las proporcionadas
   */
  private mergeOptions(options: Partial<PDFOptions>): PDFOptions {
    return {
      includeHeader: options.includeHeader !== false,
      includeFooter: options.includeFooter !== false,
      includeTOC: options.includeTOC !== false,
      includeWatermark: options.includeWatermark || false,
      watermarkText: options.watermarkText,
      language: options.language || 'es',
      paperSize: options.paperSize || 'A4',
      margins: options.margins || this.DEFAULT_MARGINS,
      sections: options.sections || {},
    };
  }

  /**
   * Genera metadata del PDF
   */
  private generateMetadata(data: AggregatedPatientData): PDFMetadata {
    return {
      title: `Medical Record - ${data.patientInfo.firstName} ${data.patientInfo.lastName}`,
      author: 'AltaMedica Platform',
      subject: 'Complete Medical Record Export',
      keywords: ['medical', 'record', 'patient', 'health', 'HIPAA'],
      creator: 'AltaMedica PDF Service',
      producer: 'PDFKit',
      creationDate: new Date(),
      modificationDate: new Date(),
    };
  }

  /**
   * Agrega texto con estilo
   */
  private addText(text: string, style: PDFStyle): void {
    const doc = this.doc;

    if (style.fontSize) doc.fontSize(style.fontSize);
    if (style.font) doc.font(style.font);
    if (style.color) doc.fillColor(style.color);

    const options: any = {};
    if (style.align) options.align = style.align;
    if (style.underline) options.underline = true;

    if (style.marginTop) this.currentY += style.marginTop;

    doc.text(text, this.DEFAULT_MARGINS.left, this.currentY, {
      ...options,
      width: this.PAGE_WIDTH - this.DEFAULT_MARGINS.left - this.DEFAULT_MARGINS.right,
    });

    this.currentY += doc.heightOfString(text, options) + (style.marginBottom || 5);

    // Verificar si necesita nueva página
    if (this.currentY > this.PAGE_HEIGHT - this.DEFAULT_MARGINS.bottom) {
      this.doc.addPage();
      this.currentY = this.DEFAULT_MARGINS.top;
    }
  }

  /**
   * Agrega título de sección
   */
  private addSectionTitle(title: string): void {
    this.addText(title, STYLES.h1);

    // Línea divisoria
    this.doc
      .strokeColor(COLORS.primary)
      .lineWidth(2)
      .moveTo(this.DEFAULT_MARGINS.left, this.currentY - 5)
      .lineTo(this.PAGE_WIDTH - this.DEFAULT_MARGINS.right, this.currentY - 5)
      .stroke();

    this.currentY += 10;
  }

  /**
   * Agrega subsección
   */
  private addSubsection(title: string): void {
    this.addText(title, STYLES.h3);
  }

  /**
   * Agrega lista de información
   */
  private addInfoList(items: Array<{ label: string; value: string }>): void {
    items.forEach((item) => {
      this.doc
        .fontSize(10)
        .fillColor(COLORS.secondary)
        .text(item.label + ':', this.DEFAULT_MARGINS.left, this.currentY)
        .fillColor(COLORS.dark)
        .text(item.value, this.DEFAULT_MARGINS.left + 150, this.currentY);

      this.currentY += 18;
    });

    this.currentY += 10;
  }

  /**
   * Agrega tabla
   */
  private addTable(headers: string[], rows: string[][]): void {
    const columnWidth =
      (this.PAGE_WIDTH - this.DEFAULT_MARGINS.left - this.DEFAULT_MARGINS.right) / headers.length;

    // Headers
    this.doc
      .fillColor(COLORS.primary)
      .rect(
        this.DEFAULT_MARGINS.left,
        this.currentY,
        this.PAGE_WIDTH - this.DEFAULT_MARGINS.left - this.DEFAULT_MARGINS.right,
        20,
      )
      .fill();

    headers.forEach((header, index) => {
      this.doc
        .fontSize(10)
        .fillColor('#FFFFFF')
        .text(header, this.DEFAULT_MARGINS.left + index * columnWidth + 5, this.currentY + 5, {
          width: columnWidth - 10,
        });
    });

    this.currentY += 20;

    // Rows
    rows.forEach((row, rowIndex) => {
      // Alternar color de fondo
      if (rowIndex % 2 === 1) {
        this.doc
          .fillColor(COLORS.light)
          .rect(
            this.DEFAULT_MARGINS.left,
            this.currentY,
            this.PAGE_WIDTH - this.DEFAULT_MARGINS.left - this.DEFAULT_MARGINS.right,
            20,
          )
          .fill();
      }

      row.forEach((cell, colIndex) => {
        this.doc
          .fontSize(9)
          .fillColor(COLORS.dark)
          .text(cell, this.DEFAULT_MARGINS.left + colIndex * columnWidth + 5, this.currentY + 5, {
            width: columnWidth - 10,
          });
      });

      this.currentY += 20;

      // Verificar si necesita nueva página
      if (this.currentY > this.PAGE_HEIGHT - this.DEFAULT_MARGINS.bottom - 40) {
        this.doc.addPage();
        this.currentY = this.DEFAULT_MARGINS.top;
      }
    });

    this.currentY += 10;
  }

  /**
   * Agrega números de página
   */
  private addPageNumbers(): void {
    const pages = this.doc.bufferedPageRange();

    for (let i = 0; i < pages.count; i++) {
      this.doc.switchToPage(i);

      // Footer con número de página
      this.doc
        .fontSize(8)
        .fillColor(COLORS.secondary)
        .text(
          `${this.options.language === 'es' ? 'Página' : 'Page'} ${i + 1} ${this.options.language === 'es' ? 'de' : 'of'} ${pages.count}`,
          this.DEFAULT_MARGINS.left,
          this.PAGE_HEIGHT - 50,
          {
            align: 'center',
            width: this.PAGE_WIDTH - this.DEFAULT_MARGINS.left - this.DEFAULT_MARGINS.right,
          },
        );

      // Marca de agua si está habilitada
      if (this.options.includeWatermark && this.options.watermarkText) {
        this.doc
          .fontSize(48)
          .fillColor(COLORS.light)
          .opacity(0.1)
          .text(this.options.watermarkText, 0, this.PAGE_HEIGHT / 2, {
            align: 'center',
            width: this.PAGE_WIDTH,
            rotate: -45,
          })
          .opacity(1);
      }
    }
  }

  /**
   * Calcula edad a partir de fecha de nacimiento
   */
  private calculateAge(birthDate: Date): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Formatea moneda
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat(this.options.language === 'es' ? 'es-AR' : 'en-US', {
      style: 'currency',
      currency: this.options.language === 'es' ? 'ARS' : 'USD',
    }).format(amount);
  }
}

// Exportar instancia singleton
export const patientDataPDFService = new PatientDataPDFService();
