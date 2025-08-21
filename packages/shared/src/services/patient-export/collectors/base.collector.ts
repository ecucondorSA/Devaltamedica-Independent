import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import { getFirebaseFirestore } from '../../../adapters/firebase';
import type { DataCollector, DateRange, CollectionResult, DataCategory } from '../types';

/**
 * Base abstract class for all data collectors
 * Provides common Firebase operations and error handling
 */
export abstract class BaseCollector<T = any> implements DataCollector<T> {
  protected readonly db = getFirebaseFirestore();
  protected abstract readonly collectionName: string;
  protected abstract readonly category: DataCategory;
  protected abstract readonly dateField: string;

  /**
   * Collect data for a patient with optional date range
   */
  async collect(patientId: string, dateRange?: DateRange): Promise<T[]> {
    try {
      const baseQuery = this.buildBaseQuery(patientId);
      const finalQuery = dateRange
        ? this.addDateRangeFilter(baseQuery, dateRange)
        : this.addDefaultOrdering(baseQuery);

      const snapshot = await getDocs(finalQuery);
      const rawData: T[] = [];

      snapshot.forEach((doc) => {
        rawData.push(this.transformDocument(doc.id, doc.data()));
      });

      // Apply validation and sanitization
      const validatedData = this.validate(rawData) ? rawData : [];
      const sanitizedData = this.sanitize(validatedData);

      return sanitizedData;
    } catch (error) {
      console.error(`[${this.category}Collector] Error collecting data:`, error);
      throw new Error(`Failed to collect ${this.category} data: ${error}`);
    }
  }

  /**
   * Validate collected data
   */
  validate(data: T[]): boolean {
    if (!Array.isArray(data)) {
      return false;
    }

    // Basic validation - can be overridden by specific collectors
    return data.every((item) => item && typeof item === 'object');
  }

  /**
   * Sanitize data for export
   */
  sanitize(data: T[]): T[] {
    // Basic sanitization - can be overridden by specific collectors
    return data.map((item) => ({
      ...item,
      // Remove any undefined or null values
      ...Object.fromEntries(
        Object.entries(item as Record<string, any>).filter(([, value]) => value != null)
      ),
    }));
  }

  /**
   * Get collection result with metadata
   */
  async getCollectionResult(patientId: string, dateRange?: DateRange): Promise<CollectionResult<T>> {
    const data = await this.collect(patientId, dateRange);

    return {
      data,
      category: this.category,
      recordCount: data.length,
      collectedAt: new Date(),
    };
  }

  /**
   * Build base query for the collection
   */
  protected buildBaseQuery(patientId: string) {
    const collectionRef = collection(this.db, this.collectionName);
    return query(collectionRef, where('patientId', '==', patientId));
  }

  /**
   * Add date range filter to query
   */
  protected addDateRangeFilter(baseQuery: any, dateRange: DateRange) {
    return query(
      baseQuery,
      where(this.dateField, '>=', Timestamp.fromDate(dateRange.from)),
      where(this.dateField, '<=', Timestamp.fromDate(dateRange.to)),
      orderBy(this.dateField, 'desc')
    );
  }

  /**
   * Add default ordering to query
   */
  protected addDefaultOrdering(baseQuery: any) {
    return query(baseQuery, orderBy(this.dateField, 'desc'));
  }

  /**
   * Transform Firestore document to typed object
   * Override this method in specific collectors for custom transformations
   */
  protected transformDocument(id: string, data: any): T {
    return {
      id,
      ...data,
      // Convert Firestore timestamps to Date objects
      [this.dateField]: data[this.dateField]?.toDate?.() || data[this.dateField],
    } as T;
  }

  /**
   * Check if export is enabled for this collector
   */
  protected checkExportEnabled(): void {
    const exportEnabled = (process.env.PATIENT_EXPORT_ENABLED || 'false') === 'true';
    if (!exportEnabled) {
      throw new Error(`Patient data export is disabled for ${this.category}`);
    }
  }

  /**
   * Get mock data for development/testing
   * Override in specific collectors to provide realistic mock data
   */
  protected getMockData(patientId: string): T[] {
    return [];
  }

  /**
   * Check if should use mock data
   */
  protected shouldUseMockData(): boolean {
    return (
      (process.env.PATIENT_EXPORT_USE_MOCKS || 'false') === 'true' &&
      process.env.NODE_ENV !== 'production'
    );
  }
}