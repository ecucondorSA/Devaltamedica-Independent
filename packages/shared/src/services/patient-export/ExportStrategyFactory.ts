/**
 * ExportStrategyFactory - Factory para crear estrategias de exportación
 * Implementa el patrón Strategy + Factory para evitar God Objects
 */

import { JsonExportStrategy } from './strategies/JsonExportStrategy';
import { CsvExportStrategy } from './strategies/CsvExportStrategy';
import { PdfExportStrategy } from './strategies/PdfExportStrategy';
import type { ExportStrategy } from './strategies/JsonExportStrategy';

export type ExportFormatType = 'json' | 'csv' | 'pdf' | 'zip' | 'fhir';

export class ExportStrategyFactory {
  private static strategies = new Map<ExportFormatType, () => ExportStrategy>();

  static {
    // Registrar estrategias disponibles
    this.registerStrategy('json', () => new JsonExportStrategy());
    this.registerStrategy('csv', () => new CsvExportStrategy());
    this.registerStrategy('pdf', () => new PdfExportStrategy());
  }

  /**
   * Crea una estrategia de exportación según el formato
   */
  static createStrategy(format: ExportFormatType): ExportStrategy {
    const strategyFactory = this.strategies.get(format);

    if (!strategyFactory) {
      throw new Error(`Formato de exportación no soportado: ${format}`);
    }

    return strategyFactory();
  }

  /**
   * Registra una nueva estrategia de exportación
   */
  static registerStrategy(format: ExportFormatType, factory: () => ExportStrategy): void {
    this.strategies.set(format, factory);
  }

  /**
   * Obtiene los formatos soportados
   */
  static getSupportedFormats(): ExportFormatType[] {
    return Array.from(this.strategies.keys());
  }

  /**
   * Verifica si un formato está soportado
   */
  static isFormatSupported(format: string): boolean {
    return this.strategies.has(format as ExportFormatType);
  }
}

export default ExportStrategyFactory;
