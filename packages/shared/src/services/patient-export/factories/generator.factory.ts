import type { ExportGenerator, ExportFormat, PatientDataPackage } from '../types';
import { JsonExportGenerator } from '../generators/json.generator';
import { CsvExportGenerator } from '../generators/csv.generator';

/**
 * Generator Factory implementing Strategy Pattern
 * Provides centralized generator creation and management
 * Implements Strategy Pattern for flexible export format handling
 */

export type SupportedFormat = 'json' | 'csv' | 'pdf' | 'zip' | 'fhir';

export interface GeneratorCapabilities {
  supportedLanguages: string[];
  maxFileSize?: number;
  supportsEncryption: boolean;
  supportsStreaming: boolean;
  outputType: 'single-file' | 'multi-file' | 'archive';
  estimatedSizeMultiplier: number; // Relative to JSON size
}

export interface GenerationOptions {
  language?: string;
  compression?: boolean;
  includeMetadata?: boolean;
  customFileName?: string;
  chunkSize?: number; // For streaming exports
  progressCallback?: (progress: number) => void;
}

export interface GenerationResult {
  filePath: string;
  format: SupportedFormat;
  size: number;
  checksum?: string;
  metadata?: any;
  warnings?: string[];
  performance?: {
    generationTime: number;
    compressionRatio?: number;
    throughput: number; // MB/s
  };
}

export class GeneratorFactory {
  private static instances = new Map<SupportedFormat, ExportGenerator>();
  
  // Registry of available generators
  private static readonly generatorRegistry: Record<SupportedFormat, {
    class: new () => ExportGenerator;
    capabilities: GeneratorCapabilities;
  }> = {
    json: {
      class: JsonExportGenerator,
      capabilities: {
        supportedLanguages: ['es', 'en', 'pt'],
        supportsEncryption: true,
        supportsStreaming: false,
        outputType: 'single-file',
        estimatedSizeMultiplier: 1.0,
      },
    },
    csv: {
      class: CsvExportGenerator,
      capabilities: {
        supportedLanguages: ['es', 'en', 'pt'],
        supportsEncryption: true,
        supportsStreaming: true,
        outputType: 'multi-file',
        estimatedSizeMultiplier: 0.7,
      },
    },
    pdf: {
      class: class NotImplementedGenerator implements ExportGenerator {
        async generate(): Promise<string> {
          throw new Error('PDF generator not yet implemented');
        }
        getFileExtension(): string { return '.pdf'; }
        getSupportedLanguages(): string[] { return ['es', 'en']; }
      },
      capabilities: {
        supportedLanguages: ['es', 'en'],
        supportsEncryption: true,
        supportsStreaming: false,
        outputType: 'single-file',
        estimatedSizeMultiplier: 2.5,
      },
    },
    zip: {
      class: class NotImplementedGenerator implements ExportGenerator {
        async generate(): Promise<string> {
          throw new Error('ZIP generator not yet implemented');
        }
        getFileExtension(): string { return '.zip'; }
        getSupportedLanguages(): string[] { return ['es', 'en', 'pt']; }
      },
      capabilities: {
        supportedLanguages: ['es', 'en', 'pt'],
        supportsEncryption: true,
        supportsStreaming: true,
        outputType: 'archive',
        estimatedSizeMultiplier: 0.3,
      },
    },
    fhir: {
      class: class NotImplementedGenerator implements ExportGenerator {
        async generate(): Promise<string> {
          throw new Error('FHIR generator not yet implemented');
        }
        getFileExtension(): string { return '.json'; }
        getSupportedLanguages(): string[] { return ['en']; }
      },
      capabilities: {
        supportedLanguages: ['en'],
        supportsEncryption: true,
        supportsStreaming: false,
        outputType: 'single-file',
        estimatedSizeMultiplier: 1.8,
      },
    },
  };

  /**
   * Get generator instance for specified format
   */
  static getGenerator(format: SupportedFormat): ExportGenerator {
    // Return cached instance if exists
    if (this.instances.has(format)) {
      return this.instances.get(format)!;
    }

    // Check if format is supported
    if (!this.isFormatSupported(format)) {
      throw new Error(`Unsupported export format: ${format}`);
    }

    // Create new instance
    const generatorInfo = this.generatorRegistry[format];
    const generator = new generatorInfo.class();
    
    // Cache instance
    this.instances.set(format, generator);
    
    return generator;
  }

  /**
   * Generate export using Strategy Pattern
   */
  static async generateExport(
    format: SupportedFormat,
    dataPackage: PatientDataPackage,
    exportDir: string,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    const startTime = performance.now();
    
    try {
      // Validate format and options
      this.validateGenerationRequest(format, dataPackage, options);
      
      // Get appropriate generator
      const generator = this.getGenerator(format);
      
      // Validate language support
      if (options.language && !generator.getSupportedLanguages().includes(options.language)) {
        throw new Error(
          `Language '${options.language}' not supported for ${format} format. ` +
          `Supported languages: ${generator.getSupportedLanguages().join(', ')}`
        );
      }

      // Execute generation with progress tracking
      const filePath = await this.executeWithProgress(
        generator,
        dataPackage,
        exportDir,
        options
      );

      // Calculate performance metrics
      const endTime = performance.now();
      const generationTime = endTime - startTime;
      const fileSize = this.getFileSize(filePath);
      const throughput = fileSize / (generationTime / 1000) / (1024 * 1024); // MB/s

      return {
        filePath,
        format,
        size: fileSize,
        performance: {
          generationTime,
          throughput,
        },
      };
    } catch (error) {
      console.error(`[GeneratorFactory] Export generation failed for ${format}:`, error);
      throw new Error(`Export generation failed: ${error}`);
    }
  }

  /**
   * Get available formats with their capabilities
   */
  static getAvailableFormats(): Record<SupportedFormat, GeneratorCapabilities> {
    const formats = {} as Record<SupportedFormat, GeneratorCapabilities>;
    
    Object.entries(this.generatorRegistry).forEach(([format, info]) => {
      formats[format as SupportedFormat] = info.capabilities;
    });

    return formats;
  }

  /**
   * Get implemented formats only
   */
  static getImplementedFormats(): SupportedFormat[] {
    return Object.keys(this.generatorRegistry).filter(format => 
      this.isFormatImplemented(format as SupportedFormat)
    ) as SupportedFormat[];
  }

  /**
   * Get pending implementation formats
   */
  static getPendingFormats(): SupportedFormat[] {
    return Object.keys(this.generatorRegistry).filter(format => 
      !this.isFormatImplemented(format as SupportedFormat)
    ) as SupportedFormat[];
  }

  /**
   * Check if format is supported
   */
  static isFormatSupported(format: string): boolean {
    return format in this.generatorRegistry;
  }

  /**
   * Check if format is implemented
   */
  static isFormatImplemented(format: SupportedFormat): boolean {
    try {
      const generator = new this.generatorRegistry[format].class();
      // Try to call a method to see if it's implemented
      generator.getFileExtension();
      return !generator.constructor.name.includes('NotImplemented');
    } catch (error) {
      return false;
    }
  }

  /**
   * Get format from ExportFormat object
   */
  static extractFormatFromRequest(exportFormat: ExportFormat): SupportedFormat {
    const format = exportFormat.type;
    
    if (!this.isFormatSupported(format)) {
      throw new Error(`Unsupported format: ${format}`);
    }

    return format as SupportedFormat;
  }

  /**
   * Estimate export size for format
   */
  static estimateExportSize(
    format: SupportedFormat,
    dataPackage: PatientDataPackage
  ): {
    estimatedSize: number;
    confidence: 'low' | 'medium' | 'high';
    breakdown?: Record<string, number>;
  } {
    const capabilities = this.generatorRegistry[format]?.capabilities;
    if (!capabilities) {
      return { estimatedSize: 0, confidence: 'low' };
    }

    // Calculate base size from data
    const baseSize = this.calculateBaseDataSize(dataPackage);
    const multiplier = capabilities.estimatedSizeMultiplier;
    const estimatedSize = Math.round(baseSize * multiplier);

    return {
      estimatedSize,
      confidence: this.isFormatImplemented(format) ? 'high' : 'medium',
      breakdown: this.calculateSizeBreakdown(dataPackage, multiplier),
    };
  }

  /**
   * Generate multiple formats concurrently
   */
  static async generateMultipleFormats(
    formats: SupportedFormat[],
    dataPackage: PatientDataPackage,
    exportDir: string,
    options: GenerationOptions = {}
  ): Promise<Record<SupportedFormat, GenerationResult | Error>> {
    const results: Record<string, GenerationResult | Error> = {};
    
    // Filter to only implemented formats
    const implementedFormats = formats.filter(format => this.isFormatImplemented(format));
    
    // Generate exports in parallel
    const generationPromises = implementedFormats.map(async (format) => {
      try {
        const result = await this.generateExport(format, dataPackage, exportDir, options);
        return { format, result };
      } catch (error) {
        return { format, result: error as Error };
      }
    });

    const completed = await Promise.all(generationPromises);
    
    completed.forEach(({ format, result }) => {
      results[format] = result;
    });

    return results as Record<SupportedFormat, GenerationResult | Error>;
  }

  /**
   * Validate generation request
   */
  private static validateGenerationRequest(
    format: SupportedFormat,
    dataPackage: PatientDataPackage,
    options: GenerationOptions
  ): void {
    if (!format) {
      throw new Error('Export format is required');
    }

    if (!dataPackage) {
      throw new Error('Data package is required');
    }

    if (!dataPackage.patientInfo?.id) {
      throw new Error('Patient ID is required in data package');
    }

    if (options.chunkSize && options.chunkSize < 1024) {
      throw new Error('Chunk size must be at least 1024 bytes');
    }
  }

  /**
   * Execute generation with progress tracking
   */
  private static async executeWithProgress(
    generator: ExportGenerator,
    dataPackage: PatientDataPackage,
    exportDir: string,
    options: GenerationOptions
  ): Promise<string> {
    // Report progress start
    if (options.progressCallback) {
      options.progressCallback(0);
    }

    // Execute generation
    const filePath = await generator.generate(dataPackage, exportDir);

    // Report progress complete
    if (options.progressCallback) {
      options.progressCallback(100);
    }

    return filePath;
  }

  /**
   * Calculate base data size
   */
  private static calculateBaseDataSize(dataPackage: PatientDataPackage): number {
    // Rough estimation based on JSON serialization
    const jsonString = JSON.stringify(dataPackage);
    return jsonString.length;
  }

  /**
   * Calculate size breakdown by category
   */
  private static calculateSizeBreakdown(
    dataPackage: PatientDataPackage,
    multiplier: number
  ): Record<string, number> {
    const breakdown: Record<string, number> = {};
    
    // Patient info size
    const patientInfoSize = JSON.stringify(dataPackage.patientInfo).length * multiplier;
    breakdown.patientInfo = Math.round(patientInfoSize);

    // Medical data by category
    Object.entries(dataPackage.medicalData).forEach(([category, data]) => {
      if (Array.isArray(data) && data.length > 0) {
        const categorySize = JSON.stringify(data).length * multiplier;
        breakdown[category] = Math.round(categorySize);
      }
    });

    // Metadata size
    const metadataSize = JSON.stringify(dataPackage.metadata).length * multiplier;
    breakdown.metadata = Math.round(metadataSize);

    return breakdown;
  }

  /**
   * Get file size utility
   */
  private static getFileSize(filePath: string): number {
    try {
      const fs = require('fs');
      const stats = fs.statSync(filePath);
      return stats.size;
    } catch (error) {
      console.warn(`Could not get file size for ${filePath}:`, error);
      return 0;
    }
  }

  /**
   * Clear generator cache
   */
  static clearCache(): void {
    this.instances.clear();
  }

  /**
   * Get cached generator count
   */
  static getCachedGeneratorCount(): number {
    return this.instances.size;
  }

  /**
   * Get capabilities for specific format
   */
  static getFormatCapabilities(format: SupportedFormat): GeneratorCapabilities | null {
    return this.generatorRegistry[format]?.capabilities || null;
  }
}

// Export convenience functions
export const getGenerator = GeneratorFactory.getGenerator.bind(GeneratorFactory);
export const generateExport = GeneratorFactory.generateExport.bind(GeneratorFactory);
export const getAvailableFormats = GeneratorFactory.getAvailableFormats.bind(GeneratorFactory);
export const estimateExportSize = GeneratorFactory.estimateExportSize.bind(GeneratorFactory);

// Export singleton instance
export const generatorFactory = GeneratorFactory;