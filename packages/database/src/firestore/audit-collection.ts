import { getFirestore, collection, CollectionReference } from 'firebase/firestore';
import { AuditLog } from '@altamedica/types';

import { logger } from '@altamedica/shared/services/logger.service';
/**
 * Firestore Audit Collection Utilities
 * Provides typed access to the audit collection for HIPAA compliance
 */
export class AuditCollection {
  private static db = getFirestore();
  private static collectionRef: CollectionReference<AuditLog> = collection(
    AuditCollection.db,
    'audit_logs'
  ) as CollectionReference<AuditLog>;

  /**
   * Get the audit logs collection reference
   */
  static getCollection(): CollectionReference<AuditLog> {
    return AuditCollection.collectionRef;
  }

  /**
   * Initialize audit collection with proper indexes
   * This should be called during application startup
   */
  static async initializeCollection(): Promise<void> {
    try {
      // Collection will be created automatically when first document is added
      // Firestore indexes should be configured via firestore.indexes.json
      logger.info('Audit collection initialized successfully');
    } catch (error) {
      logger.error('Error initializing audit collection:', error);
      throw error;
    }
  }

  /**
   * Get collection name for use in Firestore rules
   */
  static getCollectionName(): string {
    return 'audit_logs';
  }
}

export default AuditCollection;