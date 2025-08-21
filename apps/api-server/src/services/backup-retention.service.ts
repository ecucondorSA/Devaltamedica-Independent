import { Firestore, Timestamp } from '@google-cloud/firestore';
import { Storage } from '@google-cloud/storage';
import * as cron from 'node-cron';
import { z } from 'zod';
import crypto from 'crypto';
import { promisify } from 'util';
import { pipeline } from 'stream';
import { createGzip, createGunzip } from 'zlib';

import { logger } from '@altamedica/shared/services/logger.service';
const pipelineAsync = promisify(pipeline);

/**
 * Backup and Retention Service
 * 
 * Implements automated backup and data retention policies:
 * - Scheduled Firestore backups
 * - Encrypted backup storage
 * - Retention policy enforcement
 * - Point-in-time recovery
 * - Compliance with medical data regulations
 * 
 * Compliance:
 * - HIPAA: 6-year retention for medical records
 * - Argentina Ley 26.529: 10-year minimum retention
 * - EU GDPR: Right to erasure after retention period
 */

// Configuration schema
const BackupConfigSchema = z.object({
  backup: z.object({
    enabled: z.boolean().default(true),
    schedule: z.string().default('0 2 * * *'), // Daily at 2 AM
    bucket: z.string().min(1),
    encryptionKey: z.string().min(32).optional(),
    compression: z.boolean().default(true),
    collections: z.array(z.string()).default([]),
  }),
  retention: z.object({
    medical: z.object({
      years: z.number().default(10), // Argentina law requirement
      deleteAfter: z.boolean().default(false),
    }),
    audit: z.object({
      years: z.number().default(7), // HIPAA + buffer
      deleteAfter: z.boolean().default(false),
    }),
    appointments: z.object({
      years: z.number().default(3),
      deleteAfter: z.boolean().default(true),
    }),
    telemedicine: z.object({
      years: z.number().default(7), // Include recordings
      deleteAfter: z.boolean().default(false),
    }),
    general: z.object({
      years: z.number().default(1),
      deleteAfter: z.boolean().default(true),
    }),
  }),
  cleanup: z.object({
    enabled: z.boolean().default(true),
    schedule: z.string().default('0 3 * * 0'), // Weekly Sunday at 3 AM
    batchSize: z.number().default(500),
  }),
});

type BackupConfig = z.infer<typeof BackupConfigSchema>;

// Backup metadata
interface BackupMetadata {
  id: string;
  timestamp: Date;
  collections: string[];
  encrypted: boolean;
  compressed: boolean;
  size: number;
  checksum: string;
  retention: string;
  expiresAt?: Date;
}

// Retention policy
interface RetentionPolicy {
  collection: string;
  retentionYears: number;
  deleteAfterExpiry: boolean;
  lastCleanup?: Date;
}

export class BackupRetentionService {
  private config: BackupConfig;
  private firestore: Firestore;
  private storage: Storage;
  private backupTask?: cron.ScheduledTask;
  private cleanupTask?: cron.ScheduledTask;
  private retentionPolicies: Map<string, RetentionPolicy> = new Map();

  constructor() {
    this.config = this.loadConfig();
    this.firestore = new Firestore();
    this.storage = new Storage();
    this.initializeRetentionPolicies();
    this.scheduleBackups();
    this.scheduleCleanup();
  }

  /**
   * Load backup configuration
   */
  private loadConfig(): BackupConfig {
    const config = BackupConfigSchema.parse({
      backup: {
        enabled: process.env.BACKUP_ENABLED !== 'false',
        schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *',
        bucket: process.env.BACKUP_BUCKET || 'altamedica-backups',
        encryptionKey: process.env.BACKUP_ENCRYPTION_KEY,
        compression: process.env.BACKUP_COMPRESSION !== 'false',
        collections: process.env.BACKUP_COLLECTIONS?.split(',') || [
          'patients',
          'appointments',
          'prescriptions',
          'medicalRecords',
          'auditLogs',
          'telemedicineSessions',
        ],
      },
      retention: {
        medical: {
          years: parseInt(process.env.RETENTION_MEDICAL_YEARS || '10'),
          deleteAfter: process.env.RETENTION_MEDICAL_DELETE === 'true',
        },
        audit: {
          years: parseInt(process.env.RETENTION_AUDIT_YEARS || '7'),
          deleteAfter: process.env.RETENTION_AUDIT_DELETE === 'true',
        },
        appointments: {
          years: parseInt(process.env.RETENTION_APPOINTMENTS_YEARS || '3'),
          deleteAfter: process.env.RETENTION_APPOINTMENTS_DELETE !== 'false',
        },
        telemedicine: {
          years: parseInt(process.env.RETENTION_TELEMEDICINE_YEARS || '7'),
          deleteAfter: process.env.RETENTION_TELEMEDICINE_DELETE === 'true',
        },
        general: {
          years: parseInt(process.env.RETENTION_GENERAL_YEARS || '1'),
          deleteAfter: process.env.RETENTION_GENERAL_DELETE !== 'false',
        },
      },
      cleanup: {
        enabled: process.env.CLEANUP_ENABLED !== 'false',
        schedule: process.env.CLEANUP_SCHEDULE || '0 3 * * 0',
        batchSize: parseInt(process.env.CLEANUP_BATCH_SIZE || '500'),
      },
    });

    // Validate bucket exists
    this.validateBucket(config.backup.bucket);

    return config;
  }

  /**
   * Validate storage bucket exists
   */
  private async validateBucket(bucketName: string): Promise<void> {
    try {
      const bucket = this.storage.bucket(bucketName);
      const [exists] = await bucket.exists();
      
      if (!exists) {
        logger.info(`[Backup] Creating bucket: ${bucketName}`);
        await bucket.create({
          location: 'US',
          storageClass: 'NEARLINE', // Cost-effective for backups
          versioning: { enabled: true },
          lifecycle: {
            rule: [{
              action: { type: 'Delete' },
              condition: { age: 365 * 11 }, // 11 years max retention
            }],
          },
        });
      }
    } catch (error) {
      logger.error('[Backup] Bucket validation failed:', undefined, error);
    }
  }

  /**
   * Initialize retention policies
   */
  private initializeRetentionPolicies(): void {
    // Medical collections
    ['patients', 'medicalRecords', 'prescriptions', 'labResults'].forEach(collection => {
      this.retentionPolicies.set(collection, {
        collection,
        retentionYears: this.config.retention.medical.years,
        deleteAfterExpiry: this.config.retention.medical.deleteAfter,
      });
    });

    // Audit collections
    ['auditLogs', 'accessLogs'].forEach(collection => {
      this.retentionPolicies.set(collection, {
        collection,
        retentionYears: this.config.retention.audit.years,
        deleteAfterExpiry: this.config.retention.audit.deleteAfter,
      });
    });

    // Appointments
    this.retentionPolicies.set('appointments', {
      collection: 'appointments',
      retentionYears: this.config.retention.appointments.years,
      deleteAfterExpiry: this.config.retention.appointments.deleteAfter,
    });

    // Telemedicine
    this.retentionPolicies.set('telemedicineSessions', {
      collection: 'telemedicineSessions',
      retentionYears: this.config.retention.telemedicine.years,
      deleteAfterExpiry: this.config.retention.telemedicine.deleteAfter,
    });

    logger.info(`[Backup] Initialized ${this.retentionPolicies.size} retention policies`);
  }

  /**
   * Schedule automated backups
   */
  private scheduleBackups(): void {
    if (!this.config.backup.enabled) {
      logger.info('[Backup] Automated backups disabled');
      return;
    }

    this.backupTask = cron.schedule(this.config.backup.schedule, async () => {
      logger.info('[Backup] Starting scheduled backup');
      await this.performBackup();
    });

    logger.info(`[Backup] Scheduled backups: ${this.config.backup.schedule}`);
  }

  /**
   * Schedule retention cleanup
   */
  private scheduleCleanup(): void {
    if (!this.config.cleanup.enabled) {
      logger.info('[Backup] Retention cleanup disabled');
      return;
    }

    this.cleanupTask = cron.schedule(this.config.cleanup.schedule, async () => {
      logger.info('[Backup] Starting retention cleanup');
      await this.performCleanup();
    });

    logger.info(`[Backup] Scheduled cleanup: ${this.config.cleanup.schedule}`);
  }

  /**
   * Perform backup
   */
  public async performBackup(collections?: string[]): Promise<BackupMetadata> {
    const backupId = `backup_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const timestamp = new Date();
    const collectionsToBackup = collections || this.config.backup.collections;

    logger.info(`[Backup] Starting backup ${backupId} for collections:`, collectionsToBackup);

    const metadata: BackupMetadata = {
      id: backupId,
      timestamp,
      collections: collectionsToBackup,
      encrypted: !!this.config.backup.encryptionKey,
      compressed: this.config.backup.compression,
      size: 0,
      checksum: '',
      retention: 'standard',
    };

    try {
      // Export each collection
      for (const collection of collectionsToBackup) {
        await this.backupCollection(backupId, collection);
      }

      // Create metadata file
      await this.saveBackupMetadata(backupId, metadata);

      logger.info(`[Backup] Completed backup ${backupId}`);

      // Track metric
      if (global.prometheusMetrics) {
        global.prometheusMetrics.trackBusinessMetric('backup', {
          status: 'success',
          collections: collectionsToBackup.length.toString(),
        });
      }

      return metadata;
    } catch (error) {
      logger.error(`[Backup] Failed backup ${backupId}:`, undefined, error);
      
      // Track failure metric
      if (global.prometheusMetrics) {
        global.prometheusMetrics.trackBusinessMetric('backup', {
          status: 'failed',
          error: error instanceof Error ? error.message : 'unknown',
        });
      }

      throw error;
    }
  }

  /**
   * Backup individual collection
   */
  private async backupCollection(backupId: string, collection: string): Promise<void> {
    const bucket = this.storage.bucket(this.config.backup.bucket);
    const fileName = `${backupId}/${collection}.json${this.config.backup.compression ? '.gz' : ''}`;
    const file = bucket.file(fileName);

    // Query all documents
    const snapshot = await this.firestore.collection(collection).get();
    const documents = snapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data(),
      createTime: doc.createTime?.toDate(),
      updateTime: doc.updateTime?.toDate(),
    }));

    logger.info(`[Backup] Backing up ${documents.length} documents from ${collection}`);

    // Convert to JSON
    let data = Buffer.from(JSON.stringify(documents, null, 2));

    // Encrypt if configured
    if (this.config.backup.encryptionKey) {
      data = this.encrypt(data, this.config.backup.encryptionKey);
    }

    // Create write stream
    const stream = file.createWriteStream({
      metadata: {
        contentType: 'application/json',
        metadata: {
          backupId,
          collection,
          documentCount: documents.length.toString(),
          encrypted: this.config.backup.encryptionKey ? 'true' : 'false',
          timestamp: new Date().toISOString(),
        },
      },
    });

    // Compress if configured
    if (this.config.backup.compression) {
      const gzip = createGzip({ level: 9 });
      await pipelineAsync(
        data,
        gzip,
        stream
      );
    } else {
      stream.end(data);
    }

    logger.info(`[Backup] Saved ${collection} to ${fileName}`);
  }

  /**
   * Perform retention cleanup
   */
  public async performCleanup(): Promise<{
    deleted: number;
    errors: number;
  }> {
    let totalDeleted = 0;
    let totalErrors = 0;

    for (const [collection, policy] of this.retentionPolicies) {
      if (!policy.deleteAfterExpiry) {
        logger.info(`[Cleanup] Skipping ${collection} (retention only, no deletion)`);
        continue;
      }

      try {
        const deleted = await this.cleanupCollection(collection, policy);
        totalDeleted += deleted;
        
        // Update last cleanup time
        policy.lastCleanup = new Date();
      } catch (error) {
        logger.error(`[Cleanup] Error cleaning ${collection}:`, undefined, error);
        totalErrors++;
      }
    }

    // Cleanup old backups
    try {
      await this.cleanupOldBackups();
    } catch (error) {
      logger.error('[Cleanup] Error cleaning old backups:', undefined, error);
      totalErrors++;
    }

    logger.info(`[Cleanup] Completed: ${totalDeleted} records deleted, ${totalErrors} errors`);

    return { deleted: totalDeleted, errors: totalErrors };
  }

  /**
   * Cleanup expired documents in collection
   */
  private async cleanupCollection(
    collection: string,
    policy: RetentionPolicy
  ): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - policy.retentionYears);

    logger.info(`[Cleanup] Cleaning ${collection} older than ${cutoffDate.toISOString()}`);

    let deleted = 0;
    let lastDoc: any = null;

    // Process in batches
    while (true) {
      let query = this.firestore
        .collection(collection)
        .where('createdAt', '<', Timestamp.fromDate(cutoffDate))
        .limit(this.config.cleanup.batchSize);

      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }

      const snapshot = await query.get();

      if (snapshot.empty) {
        break;
      }

      // Delete batch
      const batch = this.firestore.batch();
      
      snapshot.docs.forEach(doc => {
        // Archive before deletion if medical data
        if (policy.retentionYears >= 10) {
          this.archiveDocument(collection, doc.id, doc.data());
        }
        
        batch.delete(doc.ref);
        deleted++;
      });

      await batch.commit();
      
      lastDoc = snapshot.docs[snapshot.docs.length - 1];
      
      logger.info(`[Cleanup] Deleted ${deleted} documents from ${collection}`);
    }

    return deleted;
  }

  /**
   * Archive document before deletion
   */
  private async archiveDocument(
    collection: string,
    docId: string,
    data: any
  ): Promise<void> {
    const archiveCollection = `${collection}_archive`;
    
    await this.firestore
      .collection(archiveCollection)
      .doc(docId)
      .set({
        ...data,
        archivedAt: Timestamp.now(),
        originalCollection: collection,
      });
  }

  /**
   * Cleanup old backup files
   */
  private async cleanupOldBackups(): Promise<void> {
    const bucket = this.storage.bucket(this.config.backup.bucket);
    const maxAge = 365; // Keep backups for 1 year
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAge);

    const [files] = await bucket.getFiles();
    
    for (const file of files) {
      const metadata = file.metadata;
      const created = new Date(metadata.timeCreated);
      
      if (created < cutoffDate) {
        logger.info(`[Cleanup] Deleting old backup: ${file.name}`);
        await file.delete();
      }
    }
  }

  /**
   * Restore from backup
   */
  public async restoreFromBackup(
    backupId: string,
    collections?: string[]
  ): Promise<void> {
    logger.info(`[Restore] Starting restore from backup ${backupId}`);

    const bucket = this.storage.bucket(this.config.backup.bucket);
    const [files] = await bucket.getFiles({ prefix: backupId });

    if (files.length === 0) {
      throw new Error(`Backup ${backupId} not found`);
    }

    for (const file of files) {
      const collection = file.name.split('/')[1].replace('.json.gz', '').replace('.json', '');
      
      if (collections && !collections.includes(collection)) {
        continue;
      }

      await this.restoreCollection(file, collection);
    }

    logger.info(`[Restore] Completed restore from backup ${backupId}`);
  }

  /**
   * Restore individual collection
   */
  private async restoreCollection(file: any, collection: string): Promise<void> {
    logger.info(`[Restore] Restoring collection ${collection}`);

    // Download file
    const [contents] = await file.download();
    let data = contents;

    // Decompress if needed
    if (file.name.endsWith('.gz')) {
      const gunzip = createGunzip();
      data = await pipelineAsync(data, gunzip);
    }

    // Decrypt if needed
    if (file.metadata.metadata?.encrypted === 'true' && this.config.backup.encryptionKey) {
      data = this.decrypt(data, this.config.backup.encryptionKey);
    }

    // Parse JSON
    const documents = JSON.parse(data.toString());

    // Restore documents
    const batch = this.firestore.batch();
    let count = 0;

    for (const doc of documents) {
      const ref = this.firestore.collection(collection).doc(doc.id);
      batch.set(ref, doc.data);
      count++;

      // Commit batch every 500 documents
      if (count % 500 === 0) {
        await batch.commit();
        logger.info(`[Restore] Restored ${count} documents to ${collection}`);
      }
    }

    // Commit remaining
    if (count % 500 !== 0) {
      await batch.commit();
    }

    logger.info(`[Restore] Restored ${count} total documents to ${collection}`);
  }

  /**
   * Save backup metadata
   */
  private async saveBackupMetadata(backupId: string, metadata: BackupMetadata): Promise<void> {
    const bucket = this.storage.bucket(this.config.backup.bucket);
    const file = bucket.file(`${backupId}/metadata.json`);
    
    await file.save(JSON.stringify(metadata, null, 2), {
      contentType: 'application/json',
    });
  }

  /**
   * Encrypt data
   */
  private encrypt(data: Buffer, key: string): Buffer {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-gcm',
      Buffer.from(key, 'hex'),
      iv
    );

    const encrypted = Buffer.concat([
      cipher.update(data),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return Buffer.concat([iv, authTag, encrypted]);
  }

  /**
   * Decrypt data
   */
  private decrypt(data: Buffer, key: string): Buffer {
    const iv = data.slice(0, 16);
    const authTag = data.slice(16, 32);
    const encrypted = data.slice(32);

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(key, 'hex'),
      iv
    );

    decipher.setAuthTag(authTag);

    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
  }

  /**
   * Get backup statistics
   */
  public async getStatistics(): Promise<any> {
    const bucket = this.storage.bucket(this.config.backup.bucket);
    const [files] = await bucket.getFiles();

    const backups = new Map<string, any>();

    for (const file of files) {
      const backupId = file.name.split('/')[0];
      if (!backups.has(backupId)) {
        backups.set(backupId, {
          id: backupId,
          files: [],
          totalSize: 0,
          created: file.metadata.timeCreated,
        });
      }

      const backup = backups.get(backupId);
      backup.files.push(file.name);
      backup.totalSize += parseInt(file.metadata.size || '0');
    }

    return {
      totalBackups: backups.size,
      backups: Array.from(backups.values()),
      retentionPolicies: Array.from(this.retentionPolicies.values()),
      nextBackup: this.backupTask?.nextDate(),
      nextCleanup: this.cleanupTask?.nextDate(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Cleanup resources
   */
  public dispose(): void {
    if (this.backupTask) {
      this.backupTask.stop();
      this.backupTask = undefined;
    }

    if (this.cleanupTask) {
      this.cleanupTask.stop();
      this.cleanupTask = undefined;
    }

    logger.info('[Backup] Service disposed');
  }
}

// Singleton instance
let backupRetentionService: BackupRetentionService | null = null;

export function getBackupRetentionService(): BackupRetentionService {
  if (!backupRetentionService) {
    backupRetentionService = new BackupRetentionService();
  }
  return backupRetentionService;
}

// Export default instance
export default getBackupRetentionService();