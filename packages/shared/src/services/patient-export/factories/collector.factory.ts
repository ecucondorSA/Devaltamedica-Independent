import type { DataCategory, DataCollector } from '../types';
import {
  MedicalRecordsCollector,
  LabResultsCollector,
  AppointmentsCollector,
  VitalSignsCollector,
} from '../collectors';
import { logger } from '../../logger.service';

/**
 * Collector Factory
 * Implements Factory Pattern for creating data collectors
 * Provides centralized collector instantiation and management
 */

export class CollectorFactory {
  private static instances = new Map<DataCategory, DataCollector>();

  /**
   * Create or get existing collector instance
   */
  static getCollector(category: DataCategory): DataCollector {
    // Return cached instance if exists
    if (this.instances.has(category)) {
      return this.instances.get(category)!;
    }

    // Create new instance
    const collector = this.createCollector(category);
    this.instances.set(category, collector);
    
    return collector;
  }

  /**
   * Create a new collector instance
   */
  private static createCollector(category: DataCategory): DataCollector {
    switch (category) {
      case 'medical_records':
        return new MedicalRecordsCollector();
      
      case 'lab_results':
        return new LabResultsCollector();
      
      case 'appointments':
        return new AppointmentsCollector();
      
      case 'vital_signs':
        return new VitalSignsCollector();
      
      // TODO: Add remaining collectors in future sprints
      case 'prescriptions':
        throw new Error('PrescriptionsCollector not yet implemented');
      
      case 'immunizations':
        throw new Error('ImmunizationsCollector not yet implemented');
      
      case 'allergies':
        throw new Error('AllergiesCollector not yet implemented');
      
      case 'procedures':
        throw new Error('ProceduresCollector not yet implemented');
      
      case 'diagnoses':
        throw new Error('DiagnosesCollector not yet implemented');
      
      case 'clinical_notes':
        throw new Error('ClinicalNotesCollector not yet implemented');
      
      case 'imaging':
        throw new Error('ImagingCollector not yet implemented');
      
      case 'documents':
        throw new Error('DocumentsCollector not yet implemented');
      
      case 'billing':
        throw new Error('BillingCollector not yet implemented');
      
      case 'consents':
        throw new Error('ConsentsCollector not yet implemented');
      
      case 'audit_logs':
        throw new Error('AuditLogsCollector not yet implemented');
      
      default:
        throw new Error(`Unknown data category: ${category}`);
    }
  }

  /**
   * Get all available collector categories
   */
  static getAvailableCategories(): DataCategory[] {
    return [
      'medical_records',
      'lab_results',
      'appointments',
      'vital_signs',
    ];
  }

  /**
   * Get all implemented collector categories (excluding not-yet-implemented)
   */
  static getImplementedCategories(): DataCategory[] {
    return this.getAvailableCategories();
  }

  /**
   * Get pending implementation categories
   */
  static getPendingCategories(): DataCategory[] {
    return [
      'prescriptions',
      'immunizations',
      'allergies',
      'procedures',
      'diagnoses',
      'clinical_notes',
      'imaging',
      'documents',
      'billing',
      'consents',
      'audit_logs',
    ];
  }

  /**
   * Check if category is implemented
   */
  static isImplemented(category: DataCategory): boolean {
    return this.getImplementedCategories().includes(category);
  }

  /**
   * Collect data for multiple categories
   */
  static async collectMultiple(
    categories: DataCategory[],
    patientId: string,
    dateRange?: { from: Date; to: Date }
  ): Promise<Record<DataCategory, any[]>> {
    const results: Record<string, any[]> = {};
    
    // Filter to only implemented categories
    const implementedCategories = categories.filter(cat => this.isImplemented(cat));
    
    // Collect data in parallel for better performance
    const collectionPromises = implementedCategories.map(async (category) => {
      try {
        const collector = this.getCollector(category);
        const data = await collector.collect(patientId, dateRange);
        return { category, data };
      } catch (error) {
        logger.error(`Failed to collect ${category} data`, 'CollectorFactory', error);
        return { category, data: [] };
      }
    });

    const collectionResults = await Promise.all(collectionPromises);
    
    // Build results object
    collectionResults.forEach(({ category, data }) => {
      results[category] = data;
    });

    return results as Record<DataCategory, any[]>;
  }

  /**
   * Validate collected data for multiple categories
   */
  static validateCollectedData(
    collectedData: Partial<Record<DataCategory, any[]>>
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    for (const [category, data] of Object.entries(collectedData)) {
      if (!this.isImplemented(category as DataCategory)) {
        continue;
      }
      
      try {
        const collector = this.getCollector(category as DataCategory);
        const isValid = collector.validate(data);
        
        if (!isValid) {
          errors.push(`Validation failed for category: ${category}`);
        }
      } catch (error) {
        errors.push(`Validation error for ${category}: ${error}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Clear all cached collector instances
   */
  static clearCache(): void {
    this.instances.clear();
  }

  /**
   * Get collector instance count (for monitoring)
   */
  static getInstanceCount(): number {
    return this.instances.size;
  }

  /**
   * Get cached categories (for debugging)
   */
  static getCachedCategories(): DataCategory[] {
    return Array.from(this.instances.keys());
  }
}

// Export singleton factory functions for convenience
export const getCollector = CollectorFactory.getCollector.bind(CollectorFactory);
export const collectMultiple = CollectorFactory.collectMultiple.bind(CollectorFactory);
export const validateCollectedData = CollectorFactory.validateCollectedData.bind(CollectorFactory);

// Export singleton instance
export const collectorFactory = CollectorFactory;
