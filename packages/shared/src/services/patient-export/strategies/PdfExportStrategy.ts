/**
 * PdfExportStrategy - Estrategia para exportar datos en formato PDF
 * Parte del refactoring del God Object patient-data-export.service.ts
 */

import type { PatientDataPackage, ExportOptions } from '../types';
import type { ExportStrategy } from './JsonExportStrategy';

export class PdfExportStrategy implements ExportStrategy {
  /**
   * Exporta los datos del paciente en formato PDF
   */
  async export(data: PatientDataPackage, options: ExportOptions): Promise<Buffer> {
    // Importación dinámica de jsPDF para evitar problemas de SSR
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    let yPosition = 20;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;

    // Título principal
    doc.setFontSize(20);
    doc.text('Historial Médico del Paciente', margin, yPosition);
    yPosition += 15;

    // Información del paciente
    doc.setFontSize(14);
    doc.text('Información Personal', margin, yPosition);
    yPosition += 10;

    doc.setFontSize(11);
    this.addPatientInfo(doc, data.patientInfo, margin, yPosition);
    yPosition += 40;

    // Datos médicos según opciones
    if (options.includeMedicalHistory && data.medicalData.medicalHistory) {
      yPosition = this.addSection(
        doc,
        'Historia Médica',
        data.medicalData.medicalHistory,
        margin,
        yPosition,
        pageHeight,
      );
    }

    if (options.includeLabResults && data.medicalData.labResults) {
      yPosition = this.addSection(
        doc,
        'Resultados de Laboratorio',
        data.medicalData.labResults,
        margin,
        yPosition,
        pageHeight,
      );
    }

    if (options.includePrescriptions && data.medicalData.prescriptions) {
      yPosition = this.addSection(
        doc,
        'Prescripciones',
        data.medicalData.prescriptions,
        margin,
        yPosition,
        pageHeight,
      );
    }

    if (options.includeAppointments && data.medicalData.appointments) {
      yPosition = this.addSection(
        doc,
        'Citas Médicas',
        data.medicalData.appointments,
        margin,
        yPosition,
        pageHeight,
      );
    }

    if (options.includeVitalSigns && data.medicalData.vitalSigns) {
      yPosition = this.addSection(
        doc,
        'Signos Vitales',
        data.medicalData.vitalSigns,
        margin,
        yPosition,
        pageHeight,
      );
    }

    // Pie de página con información de cumplimiento
    this.addFooter(doc, data.compliance);

    // Convertir a buffer
    const pdfOutput = doc.output('arraybuffer');
    return Buffer.from(pdfOutput);
  }

  /**
   * Obtiene el tipo de contenido MIME
   */
  getContentType(): string {
    return 'application/pdf';
  }

  /**
   * Obtiene la extensión del archivo
   */
  getFileExtension(): string {
    return 'pdf';
  }

  /**
   * Agrega información del paciente al PDF
   */
  private addPatientInfo(
    doc: Record<string, unknown>,
    patientInfo: Record<string, unknown>,
    x: number,
    y: number,
  ): void {
    const lineHeight = 6;

    doc.text(`Nombre: ${patientInfo.fullName || 'N/A'}`, x, y);
    y += lineHeight;

    doc.text(`Fecha de Nacimiento: ${this.formatDate(patientInfo.dateOfBirth)}`, x, y);
    y += lineHeight;

    doc.text(`Género: ${patientInfo.gender || 'N/A'}`, x, y);
    y += lineHeight;

    doc.text(`DNI: ${patientInfo.dni || 'N/A'}`, x, y);
    y += lineHeight;

    doc.text(`Email: ${patientInfo.email || 'N/A'}`, x, y);
    y += lineHeight;

    doc.text(`Teléfono: ${patientInfo.phone || 'N/A'}`, x, y);
  }

  /**
   * Agrega una sección al PDF
   */
  private addSection(
    doc: Record<string, unknown>,
    title: string,
    data: Array<Record<string, unknown>>,
    x: number,
    y: number,
    pageHeight: number,
  ): number {
    const lineHeight = 6;
    const sectionMargin = 10;

    // Verificar si necesitamos nueva página
    if (y + 30 > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }

    // Título de sección
    doc.setFontSize(14);
    doc.text(title, x, y);
    y += sectionMargin;

    // Contenido
    doc.setFontSize(10);

    if (!data || data.length === 0) {
      doc.text('No hay datos disponibles', x + 5, y);
      y += lineHeight;
    } else {
      for (const item of data.slice(0, 10)) {
        // Limitar items por espacio
        if (y + lineHeight > pageHeight - 20) {
          doc.addPage();
          y = 20;
        }

        const itemText = this.formatItemForPdf(item);
        const lines = doc.splitTextToSize(itemText, 170);

        for (const line of lines) {
          doc.text(line, x + 5, y);
          y += lineHeight;
        }

        y += 2; // Espacio entre items
      }

      if (data.length > 10) {
        doc.text(`... y ${data.length - 10} registros más`, x + 5, y);
        y += lineHeight;
      }
    }

    return y + sectionMargin;
  }

  /**
   * Formatea un item para mostrar en PDF
   */
  private formatItemForPdf(item: Record<string, unknown>): string {
    if (typeof item === 'string') {
      return item;
    }

    // Formatear según tipo de dato
    const parts: string[] = [];

    if (item.date) {
      parts.push(`Fecha: ${this.formatDate(item.date)}`);
    }

    if (item.name || item.testName || item.medication) {
      parts.push(item.name || item.testName || item.medication);
    }

    if (item.result) {
      parts.push(`Resultado: ${item.result}`);
    }

    if (item.description) {
      parts.push(item.description);
    }

    if (item.status) {
      parts.push(`Estado: ${item.status}`);
    }

    return parts.join(' - ') || JSON.stringify(item).substring(0, 100);
  }

  /**
   * Agrega pie de página con información de cumplimiento
   */
  private addFooter(doc: Record<string, unknown>, compliance: unknown): void {
    const pageCount = doc.internal.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128);

      const pageHeight = doc.internal.pageSize.height;
      const footerY = pageHeight - 10;

      doc.text(
        `Página ${i} de ${pageCount} - Generado el ${new Date().toLocaleDateString()}`,
        20,
        footerY,
      );

      if (compliance) {
        doc.text('Documento generado cumpliendo HIPAA y Ley 26.529', 120, footerY);
      }
    }
  }

  /**
   * Formatea fecha para mostrar
   */
  private formatDate(date: Date | string | number | null | undefined): string {
    if (!date) return 'N/A';

    try {
      const d = date instanceof Date ? date : new Date(date);
      return d.toLocaleDateString('es-AR');
    } catch {
      return 'N/A';
    }
  }
}

export default PdfExportStrategy;
