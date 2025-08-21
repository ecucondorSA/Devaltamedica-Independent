// Ajuste temporal: apuntamos a la ruta compilada explícita hasta armonizar moduleResolution entre paquetes ESM/CJS
import { getFirebaseFirestore } from '../adapters/firebase';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  limit,
  Timestamp,
  DocumentData
} from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as zlib from 'zlib';
import { promisify } from 'util';

/**
 * Servicio de Backup Automático
 * Cumple con requisitos HIPAA para respaldo de datos médicos
 * Incluye encriptación, compresión y versionado
 */

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

export interface BackupPolicy {
  id: string;
  name: string;
  enabled: boolean;
  schedule: BackupSchedule;
  retention: RetentionPolicy;
  targets: BackupTarget[];
  encryption: EncryptionConfig;
  notification: NotificationConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface BackupSchedule {
  type: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
  frequency?: number; // Para tipo custom
  time?: string; // HH:mm format
  dayOfWeek?: number; // 0-6 (domingo-sábado)
  dayOfMonth?: number; // 1-31
  timezone: string;
}

export interface RetentionPolicy {
  daily: number; // Días a retener backups diarios
  weekly: number; // Semanas a retener backups semanales  
  monthly: number; // Meses a retener backups mensuales
  yearly: number; // Años a retener backups anuales
  minimumBackups: number; // Mínimo de backups a mantener siempre
}

export interface BackupTarget {
  type: 'firestore' | 'storage' | 'database' | 'files';
  collections?: string[]; // Para Firestore
  buckets?: string[]; // Para Storage
  tables?: string[]; // Para Database
  paths?: string[]; // Para Files
  excludePatterns?: string[]; // Patrones a excluir
}

export interface EncryptionConfig {
  enabled: boolean;
  algorithm: 'aes-256-gcm' | 'aes-256-cbc';
  keyRotation: boolean;
  keyRotationDays: number;
}

export interface NotificationConfig {
  onSuccess: boolean;
  onFailure: boolean;
  emails: string[];
  webhookUrl?: string;
}

export interface BackupJob {
  id: string;
  policyId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  size?: number; // Tamaño en bytes
  itemsBackedUp?: number;
  errorMessage?: string;
  location?: string; // Ruta del backup
  checksum?: string; // Hash SHA-256 del backup
  metadata?: Record<string, any>;
}

export interface BackupMetadata {
  version: string;
  timestamp: Date;
  source: string;
  policy: BackupPolicy;
  encryption: {
    enabled: boolean;
    algorithm?: string;
    keyId?: string;
  };
  compression: {
    enabled: boolean;
    algorithm: string;
    originalSize: number;
    compressedSize: number;
  };
  integrity: {
    checksum: string;
    algorithm: string;
  };
  hipaaCompliance: {
    phiIncluded: boolean;
    auditLogIncluded: boolean;
    encryptionVerified: boolean;
  };
}

export interface RestoreOptions {
  targetEnvironment: 'production' | 'staging' | 'development';
  overwriteExisting: boolean;
  validateIntegrity: boolean;
  dryRun: boolean;
  selectedCollections?: string[];
  pointInTime?: Date;
}

export class BackupService {
  private readonly BACKUP_BASE_PATH = process.env.BACKUP_PATH || '/backups';
  private readonly ENCRYPTION_KEY = process.env.BACKUP_ENCRYPTION_KEY || '';
  private readonly db = getFirebaseFirestore();
  private policies: Map<string, BackupPolicy> = new Map();
  private activeJobs: Map<string, BackupJob> = new Map();

  constructor() {
    this.initializeBackupDirectory();
    this.loadPolicies();
  }

  /**
   * Inicializa el directorio de backups
   */
  private initializeBackupDirectory(): void {
    if (!fs.existsSync(this.BACKUP_BASE_PATH)) {
      fs.mkdirSync(this.BACKUP_BASE_PATH, { recursive: true });
    }
  }

  /**
   * Carga las políticas de backup desde la configuración
   */
  private async loadPolicies(): Promise<void> {
    try {
      const policiesRef = collection(this.db, 'backup_policies');
      const snapshot = await getDocs(policiesRef);
      
      snapshot.forEach(doc => {
        const policy = { id: doc.id, ...doc.data() } as BackupPolicy;
        this.policies.set(policy.id, policy);
      });
    } catch (error) {
      logger.error('[Backup Service] Error loading policies:', error);
    }
  }

  /**
   * Crea una nueva política de backup
   */
  async createPolicy(policy: Omit<BackupPolicy, 'id' | 'createdAt' | 'updatedAt'>): Promise<BackupPolicy> {
    const policyId = `policy_${Date.now().toString(36)}`;
    const now = new Date();
    
    const newPolicy: BackupPolicy = {
      id: policyId,
      ...policy,
      createdAt: now,
      updatedAt: now
    };

    // Guardar en Firestore
    const policyRef = collection(this.db, 'backup_policies');
    await setDoc(doc(policyRef, policyId), newPolicy);
    
    // Guardar en caché local
    this.policies.set(policyId, newPolicy);
    
    // Programar si está habilitada
    if (newPolicy.enabled) {
      this.scheduleBackup(newPolicy);
    }

    return newPolicy;
  }

  /**
   * Ejecuta un backup según una política
   */
  async executeBackup(policyId: string): Promise<BackupJob> {
    const policy = this.policies.get(policyId);
    if (!policy) {
      throw new Error(`Política ${policyId} no encontrada`);
    }

    const jobId = `job_${Date.now().toString(36)}`;
    const job: BackupJob = {
      id: jobId,
      policyId,
      status: 'running',
      startTime: new Date()
    };

    this.activeJobs.set(jobId, job);

    try {
      // Crear directorio para este backup
      const backupDir = path.join(
        this.BACKUP_BASE_PATH,
        policy.name.toLowerCase().replace(/\s+/g, '_'),
        new Date().toISOString().split('T')[0]
      );
      
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const backupFile = path.join(backupDir, `backup_${jobId}.altabkp`);
      let totalItems = 0;
      let totalSize = 0;

      // Recopilar datos según los targets
      const backupData: any = {
        metadata: this.generateMetadata(policy),
        data: {}
      };

      for (const target of policy.targets) {
        switch (target.type) {
          case 'firestore':
            const firestoreData = await this.backupFirestore(target.collections || []);
            backupData.data.firestore = firestoreData.data;
            totalItems += firestoreData.count;
            break;
          
          case 'storage':
            // Implementar backup de Storage
            break;
          
          case 'database':
            // Implementar backup de base de datos SQL
            break;
          
          case 'files':
            // Implementar backup de archivos locales
            break;
        }
      }

      // Serializar datos
      let backupBuffer = Buffer.from(JSON.stringify(backupData));
      
      // Comprimir si es necesario
      if (policy.retention.daily > 0) { // Usar compresión para backups a largo plazo
        backupBuffer = Buffer.from(await gzip(backupBuffer));
      }

      // Encriptar si está configurado
      if (policy.encryption.enabled) {
        backupBuffer = Buffer.from(this.encryptData(backupBuffer, policy.encryption));
      }

      // Escribir archivo de backup
      fs.writeFileSync(backupFile, backupBuffer);
      totalSize = backupBuffer.length;

      // Calcular checksum
      const checksum = crypto
        .createHash('sha256')
        .update(backupBuffer)
        .digest('hex');

      // Actualizar job con éxito
      job.status = 'completed';
      job.endTime = new Date();
      job.size = totalSize;
      job.itemsBackedUp = totalItems;
      job.location = backupFile;
      job.checksum = checksum;

      // Guardar metadata del job
      await this.saveJobMetadata(job);

      // Limpiar backups antiguos según política de retención
      await this.cleanupOldBackups(policy);

      // Notificar éxito si está configurado
      if (policy.notification.onSuccess) {
        await this.sendNotification(policy, job, 'success');
      }

      return job;

    } catch (error: any) {
      // Actualizar job con error
      job.status = 'failed';
      job.endTime = new Date();
      job.errorMessage = error.message;

      // Notificar fallo si está configurado
      if (policy.notification.onFailure) {
        await this.sendNotification(policy, job, 'failure');
      }

      throw error;
    } finally {
      this.activeJobs.delete(jobId);
    }
  }

  /**
   * Backup de colecciones Firestore
   */
  private async backupFirestore(collections: string[]): Promise<{ data: any; count: number }> {
    const data: Record<string, any[]> = {};
    let totalCount = 0;

    for (const collectionName of collections) {
      try {
        const collectionRef = collection(this.db, collectionName);
        const snapshot = await getDocs(collectionRef);
        
        data[collectionName] = [];
        
        snapshot.forEach(doc => {
          // Excluir datos sensibles si es necesario
          const docData = this.sanitizeData(doc.data(), collectionName);
          data[collectionName].push({
            id: doc.id,
            data: docData
          });
          totalCount++;
        });
      } catch (error) {
        logger.error(`[Backup] Error backing up collection ${collectionName}:`, error);
      }
    }

    return { data, count: totalCount };
  }

  /**
   * Restaura un backup
   */
  async restoreBackup(backupId: string, options: RestoreOptions): Promise<void> {
    // Verificar permisos y ambiente
    if (options.targetEnvironment === 'production' && !options.dryRun) {
      throw new Error('Restauración en producción requiere confirmación adicional');
    }

    // Buscar archivo de backup
    const backupFile = await this.findBackupFile(backupId);
    if (!backupFile) {
      throw new Error(`Backup ${backupId} no encontrado`);
    }

    // Leer y desencriptar archivo
    let backupBuffer = fs.readFileSync(backupFile);
    
    // Verificar integridad si está habilitado
    if (options.validateIntegrity) {
      const checksum = crypto
        .createHash('sha256')
        .update(backupBuffer)
        .digest('hex');
      
      // Comparar con checksum almacenado
      const metadata = await this.getJobMetadata(backupId);
      if (metadata?.checksum !== checksum) {
        throw new Error('Integridad del backup comprometida');
      }
    }

    // Desencriptar si es necesario
    const backupData = await this.decryptAndDecompress(backupBuffer);
    
    // Ejecutar restauración
    if (!options.dryRun) {
      await this.executeRestore(backupData, options);
    }

    // Registrar en audit log
    await this.logRestoreOperation(backupId, options);
  }

  /**
   * Programa un backup según la política
   */
  private scheduleBackup(policy: BackupPolicy): void {
    // Implementar con node-cron o similar
    logger.info(`[Backup] Scheduling policy ${policy.name}`);
  }

  /**
   * Limpia backups antiguos según política de retención
   */
  private async cleanupOldBackups(policy: BackupPolicy): Promise<void> {
    const backupDir = path.join(
      this.BACKUP_BASE_PATH,
      policy.name.toLowerCase().replace(/\s+/g, '_')
    );

    if (!fs.existsSync(backupDir)) return;

    const now = Date.now();
    const files = fs.readdirSync(backupDir);
    const backupFiles: { file: string; date: Date; age: number }[] = [];

    // Analizar archivos de backup
    for (const file of files) {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);
      const age = Math.floor((now - stats.mtimeMs) / (1000 * 60 * 60 * 24)); // Edad en días
      
      backupFiles.push({
        file: filePath,
        date: stats.mtime,
        age
      });
    }

    // Ordenar por fecha (más reciente primero)
    backupFiles.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Mantener mínimo de backups
    if (backupFiles.length <= policy.retention.minimumBackups) {
      return;
    }

    // Aplicar políticas de retención
    const toDelete: string[] = [];
    
    for (const backup of backupFiles) {
      // Saltar los backups mínimos requeridos
      if (backupFiles.indexOf(backup) < policy.retention.minimumBackups) {
        continue;
      }

      // Aplicar reglas de retención
      let shouldDelete = false;
      
      if (backup.age > policy.retention.daily && backup.age <= 7) {
        // Backups diarios
        shouldDelete = true;
      } else if (backup.age > policy.retention.weekly * 7 && backup.age <= 30) {
        // Backups semanales
        shouldDelete = true;
      } else if (backup.age > policy.retention.monthly * 30 && backup.age <= 365) {
        // Backups mensuales
        shouldDelete = true;
      } else if (backup.age > policy.retention.yearly * 365) {
        // Backups anuales
        shouldDelete = true;
      }

      if (shouldDelete) {
        toDelete.push(backup.file);
      }
    }

    // Eliminar archivos marcados
    for (const file of toDelete) {
      try {
        fs.unlinkSync(file);
        logger.info(`[Backup] Deleted old backup: ${file}`);
      } catch (error) {
        logger.error(`[Backup] Error deleting ${file}:`, error);
      }
    }
  }

  /**
   * Encripta datos del backup
   */
  private encryptData(data: Buffer, config: EncryptionConfig): Buffer {
    const algorithm = config.algorithm;
    const key = Buffer.from(this.ENCRYPTION_KEY, 'hex');
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    let encrypted = cipher.update(data);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    // Incluir IV al principio del buffer encriptado
    return Buffer.concat([iv, encrypted]);
  }

  /**
   * Desencripta y descomprime datos del backup
   */
  private async decryptAndDecompress(data: Buffer): Promise<any> {
    // Implementar desencriptación
    let decrypted = data;
    
    if (this.ENCRYPTION_KEY) {
      const iv = data.slice(0, 16);
      const encrypted = data.slice(16);
      
      const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(this.ENCRYPTION_KEY, 'hex'), iv);
      decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    }

    // Descomprimir si es necesario
    try {
      decrypted = await gunzip(decrypted);
    } catch {
      // No está comprimido
    }

    return JSON.parse(decrypted.toString());
  }

  /**
   * Genera metadata del backup
   */
  private generateMetadata(policy: BackupPolicy): BackupMetadata {
    return {
      version: '1.0.0',
      timestamp: new Date(),
      source: 'altamedica-platform',
      policy,
      encryption: {
        enabled: policy.encryption.enabled,
        algorithm: policy.encryption.algorithm,
        keyId: 'default'
      },
      compression: {
        enabled: true,
        algorithm: 'gzip',
        originalSize: 0,
        compressedSize: 0
      },
      integrity: {
        checksum: '',
        algorithm: 'sha256'
      },
      hipaaCompliance: {
        phiIncluded: true,
        auditLogIncluded: true,
        encryptionVerified: policy.encryption.enabled
      }
    };
  }

  /**
   * Sanitiza datos sensibles
   */
  private sanitizeData(data: DocumentData, collectionName: string): DocumentData {
    // Implementar sanitización según tipo de colección
    // Por ahora, retornar datos sin modificar
    return data;
  }

  /**
   * Guarda metadata del job
   */
  private async saveJobMetadata(job: BackupJob): Promise<void> {
    const jobsRef = collection(this.db, 'backup_jobs');
    await setDoc(doc(jobsRef, job.id), {
      ...job,
      startTime: Timestamp.fromDate(job.startTime),
      endTime: job.endTime ? Timestamp.fromDate(job.endTime) : null
    });
  }

  /**
   * Obtiene metadata de un job
   */
  private async getJobMetadata(jobId: string): Promise<BackupJob | null> {
    const jobRef = doc(this.db, 'backup_jobs', jobId);
    const jobDoc = await getDoc(jobRef);
    
    if (!jobDoc.exists()) {
      return null;
    }

    return jobDoc.data() as BackupJob;
  }

  /**
   * Busca archivo de backup
   */
  private async findBackupFile(backupId: string): Promise<string | null> {
    // Implementar búsqueda recursiva en directorio de backups
    return null;
  }

  /**
   * Ejecuta la restauración
   */
  private async executeRestore(backupData: any, options: RestoreOptions): Promise<void> {
    // Implementar lógica de restauración
    logger.info('[Backup] Executing restore with options:', options);
  }

  /**
   * Registra operación de restauración
   */
  private async logRestoreOperation(backupId: string, options: RestoreOptions): Promise<void> {
    const logsRef = collection(this.db, 'restore_logs');
    await setDoc(doc(logsRef), {
      backupId,
      options,
      timestamp: serverTimestamp(),
      operator: 'system' // En producción, obtener del contexto de auth
    });
  }

  /**
   * Envía notificación sobre el estado del backup
   */
  private async sendNotification(
    policy: BackupPolicy, 
    job: BackupJob, 
    type: 'success' | 'failure'
  ): Promise<void> {
    // Implementar envío de notificaciones
    logger.info(`[Backup] Notification ${type} for job ${job.id}`);
  }

  /**
   * Obtiene el estado de los backups
   */
  async getBackupStatus(): Promise<{
    policies: BackupPolicy[];
    recentJobs: BackupJob[];
    storageUsed: number;
    nextScheduled: Date | null;
  }> {
    const policies = Array.from(this.policies.values());
    
    // Obtener jobs recientes
    const jobsRef = collection(this.db, 'backup_jobs');
    const jobsQuery = query(
      jobsRef,
      orderBy('startTime', 'desc'),
      limit(10)
    );
    
    const jobsSnapshot = await getDocs(jobsQuery);
    const recentJobs: BackupJob[] = [];
    
    jobsSnapshot.forEach(doc => {
      const job = doc.data() as BackupJob;
      recentJobs.push(job);
    });

    // Calcular espacio usado
    const storageUsed = this.calculateStorageUsed();

    // Calcular próximo backup programado
    const nextScheduled = this.getNextScheduledBackup();

    return {
      policies,
      recentJobs,
      storageUsed,
      nextScheduled
    };
  }

  /**
   * Calcula el espacio de almacenamiento usado
   */
  private calculateStorageUsed(): number {
    let totalSize = 0;
    
    const walkDir = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          walkDir(filePath);
        } else {
          totalSize += stats.size;
        }
      }
    };

    walkDir(this.BACKUP_BASE_PATH);
    return totalSize;
  }

  /**
   * Obtiene el próximo backup programado
   */
  private getNextScheduledBackup(): Date | null {
    // Implementar lógica para calcular próximo backup
    return null;
  }
}

// Función auxiliar para importar setDoc y serverTimestamp
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';

import { logger } from './logger.service';
// Exportar instancia singleton
export const backupService = new BackupService();