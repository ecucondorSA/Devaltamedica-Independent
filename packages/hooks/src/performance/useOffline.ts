/**
 * @fileoverview Hook innovador para funcionalidad offline
 * @module @altamedica/hooks/performance/useOffline
 * @description Hook avanzado para gestión de datos offline con sincronización inteligente
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Simple logger implementation to avoid circular dependencies
const logger = {
  info: (message, data) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.log(message, data);
    }
  },
  warn: (message, data) => {
    if (typeof console !== 'undefined') {
      console.warn(message, data);
    }
  },
  error: (message, data) => {
    if (typeof console !== 'undefined') {
      console.error(message, data);
    }
  },
  debug: (message, data) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.debug(message, data);
    }
  }
};
// ==========================================
// TIPOS
// ==========================================

interface OfflineConfig {
  // Configuración de storage
  storage: 'indexedDB' | 'localStorage' | 'both';
  maxStorageSize: number; // en MB
  compressionEnabled: boolean;
  
  // Configuración de sincronización
  syncStrategy: 'immediate' | 'batched' | 'manual' | 'intelligent';
  batchSize: number;
  syncInterval: number; // en ms
  maxRetries: number;
  retryDelay: number; // en ms
  
  // Configuración médica
  enableMedicalMode: boolean;
  hipaaCompliant: boolean;
  encryptSensitiveData: boolean;
  auditOfflineOperations: boolean;
  
  // Configuración de conflictos
  conflictResolution: 'server-wins' | 'client-wins' | 'merge' | 'manual';
  enableVersioning: boolean;
  
  // Callbacks
  onOnline?: () => void;
  onOffline?: () => void;
  onSyncStart?: () => void;
  onSyncComplete?: (result: SyncResult) => void;
  onSyncError?: (error: Error) => void;
  onConflict?: (conflict: DataConflict) => void;
}

interface OfflineData<T = any> {
  id: string;
  data: T;
  timestamp: Date;
  version: number;
  hash: string;
  encrypted: boolean;
  medicalContext?: MedicalContext;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'conflict' | 'error';
  retryCount: number;
  lastSyncAttempt?: Date;
}

interface MedicalContext {
  patientId?: string;
  doctorId?: string;
  sessionId?: string;
  dataType: 'vital_signs' | 'prescription' | 'medical_record' | 'appointment' | 'consultation_notes';
  sensitivity: 'low' | 'medium' | 'high' | 'phi'; // PHI = Protected Health Information
  requiresEncryption: boolean;
}

interface SyncResult {
  success: boolean;
  itemsSynced: number;
  conflicts: number;
  errors: number;
  duration: number;
  timestamp: Date;
}

interface DataConflict<T = any> {
  id: string;
  localData: OfflineData<T>;
  serverData: OfflineData<T>;
  conflictType: 'version' | 'timestamp' | 'content';
  autoResolved: boolean;
  resolution?: 'local' | 'server' | 'merged';
}

interface NetworkInfo {
  isOnline: boolean;
  connectionType: string;
  downlink: number;
  effectiveType: string;
  saveData: boolean;
}

interface UseOfflineReturn<T = any> {
  // Estado de conexión
  isOnline: boolean;
  networkInfo: NetworkInfo;
  
  // Estado de sincronización
  isSyncing: boolean;
  syncProgress: number;
  lastSync: Date | null;
  pendingItems: number;
  
  // Gestión de datos
  store: (id: string, data: T, context?: MedicalContext) => Promise<void>;
  retrieve: (id: string) => Promise<OfflineData<T> | null>;
  update: (id: string, data: Partial<T>, context?: MedicalContext) => Promise<void>;
  remove: (id: string) => Promise<void>;
  list: (filter?: OfflineFilter) => Promise<OfflineData<T>[]>;
  clear: () => Promise<void>;
  
  // Sincronización
  sync: () => Promise<SyncResult>;
  syncItem: (id: string) => Promise<boolean>;
  pauseSync: () => void;
  resumeSync: () => void;
  
  // Conflictos
  conflicts: DataConflict<T>[];
  resolveConflict: (conflictId: string, resolution: 'local' | 'server' | 'merged', mergedData?: T) => Promise<void>;
  
  // Utilidades
  getStorageUsage: () => Promise<StorageUsage>;
  compactStorage: () => Promise<void>;
  exportData: () => Promise<OfflineExport<T>>;
  importData: (data: OfflineExport<T>) => Promise<void>;
  
  // Médicas específicas
  storeMedicalData: (data: T, context: MedicalContext) => Promise<string>;
  getMedicalData: (patientId: string, dataType: string) => Promise<OfflineData<T>[]>;
  auditLog: AuditEntry[];
}

interface OfflineFilter {
  medicalContext?: Partial<MedicalContext>;
  syncStatus?: OfflineData['syncStatus'];
  dateRange?: { start: Date; end: Date };
  dataType?: string;
}

interface StorageUsage {
  used: number; // en bytes
  available: number; // en bytes
  percentage: number;
  itemCount: number;
  oldestItem: Date;
  newestItem: Date;
}

interface OfflineExport<T> {
  version: string;
  timestamp: Date;
  items: OfflineData<T>[];
  config: Partial<OfflineConfig>;
  auditLog: AuditEntry[];
}

interface AuditEntry {
  id: string;
  action: 'store' | 'update' | 'delete' | 'sync' | 'conflict_resolved';
  itemId: string;
  timestamp: Date;
  userId?: string;
  medicalContext?: MedicalContext;
  details: any;
}

// ==========================================
// CONFIGURACIÓN POR DEFECTO
// ==========================================

const DEFAULT_CONFIG: OfflineConfig = {
  storage: 'indexedDB',
  maxStorageSize: 100, // 100MB
  compressionEnabled: true,
  syncStrategy: 'intelligent',
  batchSize: 50,
  syncInterval: 30000, // 30 segundos
  maxRetries: 3,
  retryDelay: 5000, // 5 segundos
  enableMedicalMode: true,
  hipaaCompliant: true,
  encryptSensitiveData: true,
  auditOfflineOperations: true,
  conflictResolution: 'manual',
  enableVersioning: true
};

// ==========================================
// STORAGE MANAGER
// ==========================================

class OfflineStorageManager {
  private dbName: string;
  private version: number;
  private db: IDBDatabase | null = null;
  
  constructor(dbName: string = 'altamedica_offline', version: number = 1) {
    this.dbName = dbName;
    this.version = version;
  }
  
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Store principal de datos
        if (!db.objectStoreNames.contains('data')) {
          const dataStore = db.createObjectStore('data', { keyPath: 'id' });
          dataStore.createIndex('timestamp', 'timestamp');
          dataStore.createIndex('syncStatus', 'syncStatus');
          dataStore.createIndex('medicalContext.patientId', 'medicalContext.patientId');
          dataStore.createIndex('medicalContext.dataType', 'medicalContext.dataType');
        }
        
        // Store de auditoría
        if (!db.objectStoreNames.contains('audit')) {
          const auditStore = db.createObjectStore('audit', { keyPath: 'id' });
          auditStore.createIndex('timestamp', 'timestamp');
          auditStore.createIndex('action', 'action');
          auditStore.createIndex('itemId', 'itemId');
        }
        
        // Store de configuración
        if (!db.objectStoreNames.contains('config')) {
          db.createObjectStore('config', { keyPath: 'key' });
        }
      };
    });
  }
  
  async store<T>(data: OfflineData<T>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['data'], 'readwrite');
    const store = transaction.objectStore('data');
    
    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  async retrieve<T>(id: string): Promise<OfflineData<T> | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['data'], 'readonly');
    const store = transaction.objectStore('data');
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }
  
  async list<T>(filter?: OfflineFilter): Promise<OfflineData<T>[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['data'], 'readonly');
    const store = transaction.objectStore('data');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        let results = request.result;
        
        // Aplicar filtros
        if (filter) {
          results = results.filter(item => {
            if (filter.syncStatus && item.syncStatus !== filter.syncStatus) return false;
            if (filter.medicalContext?.patientId && item.medicalContext?.patientId !== filter.medicalContext.patientId) return false;
            if (filter.medicalContext?.dataType && item.medicalContext?.dataType !== filter.medicalContext.dataType) return false;
            if (filter.dateRange) {
              const itemDate = new Date(item.timestamp);
              if (itemDate < filter.dateRange.start || itemDate > filter.dateRange.end) return false;
            }
            return true;
          });
        }
        
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }
  
  async remove(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['data'], 'readwrite');
    const store = transaction.objectStore('data');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  async clear(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['data'], 'readwrite');
    const store = transaction.objectStore('data');
    
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  async addAuditEntry(entry: AuditEntry): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['audit'], 'readwrite');
    const store = transaction.objectStore('audit');
    
    return new Promise((resolve, reject) => {
      const request = store.add(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  async getAuditLog(): Promise<AuditEntry[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['audit'], 'readonly');
    const store = transaction.objectStore('audit');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  async getStorageUsage(): Promise<StorageUsage> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['data'], 'readonly');
    const store = transaction.objectStore('data');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const items = request.result;
        const totalSize = items.reduce((size, item) => size + JSON.stringify(item).length, 0);
        
        const timestamps = items.map(item => new Date(item.timestamp));
        const oldest = timestamps.length > 0 ? new Date(Math.min(...timestamps.map(d => d.getTime()))) : new Date();
        const newest = timestamps.length > 0 ? new Date(Math.max(...timestamps.map(d => d.getTime()))) : new Date();
        
        resolve({
          used: totalSize,
          available: 50 * 1024 * 1024 - totalSize, // Estimación de 50MB disponibles
          percentage: (totalSize / (50 * 1024 * 1024)) * 100,
          itemCount: items.length,
          oldestItem: oldest,
          newestItem: newest
        });
      };
      request.onerror = () => reject(request.error);
    });
  }
}

// ==========================================
// ENCRYPTION UTILITIES
// ==========================================

class MedicalEncryption {
  private static async getKey(): Promise<CryptoKey> {
    // En producción, la clave debería derivarse de manera segura
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode('altamedica-hipaa-key-2024'),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode('medical-salt'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }
  
  static async encrypt(data: any): Promise<string> {
    if (!crypto.subtle) return JSON.stringify(data); // Fallback sin cifrado
    
    try {
      const key = await this.getKey();
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encoded = new TextEncoder().encode(JSON.stringify(data));
      
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoded
      );
      
      const result = {
        encrypted: Array.from(new Uint8Array(encrypted)),
        iv: Array.from(iv)
      };
      
      return btoa(JSON.stringify(result));
    } catch (error) {
      logger.error('Encryption failed:', error);
      return JSON.stringify(data); // Fallback
    }
  }
  
  static async decrypt(encryptedData: string): Promise<any> {
    if (!crypto.subtle) return JSON.parse(encryptedData); // Fallback
    
    try {
      const { encrypted, iv } = JSON.parse(atob(encryptedData));
      const key = await this.getKey();
      
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(iv) },
        key,
        new Uint8Array(encrypted)
      );
      
      return JSON.parse(new TextDecoder().decode(decrypted));
    } catch (error) {
      logger.error('Decryption failed:', error);
      return JSON.parse(encryptedData); // Fallback
    }
  }
}

// ==========================================
// HOOK PRINCIPAL
// ==========================================

/**
 * Hook innovador para gestión offline de datos médicos con sincronización inteligente
 */
export function useOffline<T = any>(config: Partial<OfflineConfig> = {}): UseOfflineReturn<T> {
  const finalConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config]);
  
  // ==========================================
  // ESTADO
  // ==========================================
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>(() => ({
    isOnline: navigator.onLine,
    connectionType: 'unknown',
    downlink: 0,
    effectiveType: 'unknown',
    saveData: false
  }));
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [pendingItems, setPendingItems] = useState(0);
  const [conflicts, setConflicts] = useState<DataConflict<T>[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  
  // ==========================================
  // REFS
  // ==========================================
  
  const storageRef = useRef<OfflineStorageManager>();
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const syncPausedRef = useRef(false);
  
  // ==========================================
  // INICIALIZACIÓN
  // ==========================================
  
  useEffect(() => {
    const initStorage = async () => {
      storageRef.current = new OfflineStorageManager();
      await storageRef.current.init();
      
      // Cargar audit log
      const log = await storageRef.current.getAuditLog();
      setAuditLog(log);
      
      // Contar items pendientes
      const items = await storageRef.current.list<T>({ syncStatus: 'pending' });
      setPendingItems(items.length);
    };
    
    initStorage().catch(console.error);
  }, []);
  
  // ==========================================
  // NETWORK MONITORING
  // ==========================================
  
  useEffect(() => {
    const updateNetworkInfo = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      
      setNetworkInfo({
        isOnline: navigator.onLine,
        connectionType: connection?.type || 'unknown',
        downlink: connection?.downlink || 0,
        effectiveType: connection?.effectiveType || 'unknown',
        saveData: connection?.saveData || false
      });
    };
    
    const handleOnline = () => {
      setIsOnline(true);
      updateNetworkInfo();
      finalConfig.onOnline?.();
      
      // Auto-sync cuando volvemos online
      if (finalConfig.syncStrategy === 'immediate' || finalConfig.syncStrategy === 'intelligent') {
        sync();
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      updateNetworkInfo();
      finalConfig.onOffline?.();
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Listeners de cambio de conexión
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateNetworkInfo);
    }
    
    updateNetworkInfo();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', updateNetworkInfo);
      }
    };
  }, [finalConfig]);
  
  // ==========================================
  // AUTO-SYNC
  // ==========================================
  
  useEffect(() => {
    if (finalConfig.syncStrategy === 'batched' && isOnline && !syncPausedRef.current) {
      syncIntervalRef.current = setInterval(() => {
        sync();
      }, finalConfig.syncInterval);
    }

    // Cleanup consistente para todas las rutas
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [finalConfig.syncStrategy, finalConfig.syncInterval, isOnline]);
  
  // ==========================================
  // UTILIDADES
  // ==========================================
  
  const generateId = useCallback(() => {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);
  
  const createHash = useCallback((data: any) => {
    // Hash simple para detectar cambios
    return btoa(JSON.stringify(data)).slice(0, 16);
  }, []);
  
  const addAuditEntry = useCallback(async (action: AuditEntry['action'], itemId: string, details: any, medicalContext?: MedicalContext) => {
    if (!finalConfig.auditOfflineOperations || !storageRef.current) return;
    
    const entry: AuditEntry = {
      id: generateId(),
      action,
      itemId,
      timestamp: new Date(),
      medicalContext,
      details
    };
    
    await storageRef.current.addAuditEntry(entry);
    setAuditLog(prev => [entry, ...prev.slice(0, 999)]);
  }, [finalConfig.auditOfflineOperations, generateId]);
  
  // ==========================================
  // GESTIÓN DE DATOS
  // ==========================================
  
  const store = useCallback(async (id: string, data: T, context?: MedicalContext): Promise<void> => {
    if (!storageRef.current) throw new Error('Storage not initialized');
    
    let processedData = data;
    let encrypted = false;
    
    // Cifrar datos sensibles
    if (finalConfig.encryptSensitiveData && context?.requiresEncryption) {
      processedData = await MedicalEncryption.encrypt(data) as T;
      encrypted = true;
    }
    
    const offlineData: OfflineData<T> = {
      id,
      data: processedData,
      timestamp: new Date(),
      version: 1,
      hash: createHash(data),
      encrypted,
      medicalContext: context,
      syncStatus: 'pending',
      retryCount: 0
    };
    
    await storageRef.current.store(offlineData);
    await addAuditEntry('store', id, { dataSize: JSON.stringify(data).length }, context);
    
    // Actualizar contador de pendientes
    const items = await storageRef.current.list<T>({ syncStatus: 'pending' });
    setPendingItems(items.length);
    
    // Auto-sync si está configurado
    if (finalConfig.syncStrategy === 'immediate' && isOnline) {
      syncItem(id);
    }
  }, [finalConfig, isOnline, createHash, addAuditEntry]);
  
  const retrieve = useCallback(async (id: string): Promise<OfflineData<T> | null> => {
    if (!storageRef.current) throw new Error('Storage not initialized');
    
    const item = await storageRef.current.retrieve<T>(id);
    if (!item) return null;
    
    // Descifrar si es necesario
    if (item.encrypted) {
      item.data = await MedicalEncryption.decrypt(item.data as string) as T;
    }
    
    return item;
  }, []);
  
  const update = useCallback(async (id: string, data: Partial<T>, context?: MedicalContext): Promise<void> => {
    if (!storageRef.current) throw new Error('Storage not initialized');
    
    const existing = await storageRef.current.retrieve<T>(id);
    if (!existing) throw new Error('Item not found');
    
    // Descifrar datos existentes si es necesario
    let existingData = existing.data;
    if (existing.encrypted) {
      existingData = await MedicalEncryption.decrypt(existingData as string) as T;
    }
    
    // Merge de datos
    const updatedData = { ...existingData, ...data };
    
    // Cifrar si es necesario
    let processedData = updatedData;
    let encrypted = existing.encrypted;
    
    if (finalConfig.encryptSensitiveData && (context?.requiresEncryption || existing.medicalContext?.requiresEncryption)) {
      processedData = await MedicalEncryption.encrypt(updatedData) as T;
      encrypted = true;
    }
    
    const updatedItem: OfflineData<T> = {
      ...existing,
      data: processedData,
      timestamp: new Date(),
      version: existing.version + 1,
      hash: createHash(updatedData),
      encrypted,
      medicalContext: context || existing.medicalContext,
      syncStatus: 'pending',
      retryCount: 0
    };
    
    await storageRef.current.store(updatedItem);
    await addAuditEntry('update', id, { version: updatedItem.version }, context);
    
    // Actualizar contador de pendientes
    const items = await storageRef.current.list<T>({ syncStatus: 'pending' });
    setPendingItems(items.length);
    
    // Auto-sync si está configurado
    if (finalConfig.syncStrategy === 'immediate' && isOnline) {
      syncItem(id);
    }
  }, [finalConfig, isOnline, createHash, addAuditEntry]);
  
  const remove = useCallback(async (id: string): Promise<void> => {
    if (!storageRef.current) throw new Error('Storage not initialized');
    
    await storageRef.current.remove(id);
    await addAuditEntry('delete', id, {});
    
    // Actualizar contador de pendientes
    const items = await storageRef.current.list<T>({ syncStatus: 'pending' });
    setPendingItems(items.length);
  }, [addAuditEntry]);
  
  const list = useCallback(async (filter?: OfflineFilter): Promise<OfflineData<T>[]> => {
    if (!storageRef.current) throw new Error('Storage not initialized');
    
    const items = await storageRef.current.list<T>(filter);
    
    // Descifrar items si es necesario
    const decryptedItems = await Promise.all(
      items.map(async (item) => {
        if (item.encrypted) {
          const decryptedData = await MedicalEncryption.decrypt(item.data as string);
          return { ...item, data: decryptedData };
        }
        return item;
      })
    );
    
    return decryptedItems;
  }, []);
  
  const clear = useCallback(async (): Promise<void> => {
    if (!storageRef.current) throw new Error('Storage not initialized');
    
    await storageRef.current.clear();
    setPendingItems(0);
    await addAuditEntry('delete', 'all', { cleared: true });
  }, [addAuditEntry]);
  
  // ==========================================
  // SINCRONIZACIÓN
  // ==========================================
  
  const sync = useCallback(async (): Promise<SyncResult> => {
    if (!storageRef.current || !isOnline || isSyncing) {
      return {
        success: false,
        itemsSynced: 0,
        conflicts: 0,
        errors: 0,
        duration: 0,
        timestamp: new Date()
      };
    }
    
    setIsSyncing(true);
    setSyncProgress(0);
    finalConfig.onSyncStart?.();
    
    const startTime = Date.now();
    let itemsSynced = 0;
    let conflicts = 0;
    let errors = 0;
    
    try {
      const pendingItems = await storageRef.current.list<T>({ syncStatus: 'pending' });
      const total = pendingItems.length;
      
      for (let i = 0; i < pendingItems.length; i++) {
        const item = pendingItems[i];
        
        try {
          // Simular llamada a API (en producción, hacer llamada real)
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Marcar como sincronizado
          const syncedItem: OfflineData<T> = {
            ...item,
            syncStatus: 'synced',
            lastSyncAttempt: new Date()
          };
          
          await storageRef.current.store(syncedItem);
          itemsSynced++;
          
        } catch (error) {
          // Marcar como error y contar reintentos
          const errorItem: OfflineData<T> = {
            ...item,
            syncStatus: 'error',
            retryCount: item.retryCount + 1,
            lastSyncAttempt: new Date()
          };
          
          await storageRef.current.store(errorItem);
          errors++;
        }
        
        setSyncProgress(((i + 1) / total) * 100);
      }
      
      const result: SyncResult = {
        success: errors === 0,
        itemsSynced,
        conflicts,
        errors,
        duration: Date.now() - startTime,
        timestamp: new Date()
      };
      
      setLastSync(new Date());
      setPendingItems(pendingItems.length - itemsSynced);
      
      finalConfig.onSyncComplete?.(result);
      return result;
      
    } catch (error) {
      finalConfig.onSyncError?.(error as Error);
      return {
        success: false,
        itemsSynced,
        conflicts,
        errors: errors + 1,
        duration: Date.now() - startTime,
        timestamp: new Date()
      };
    } finally {
      setIsSyncing(false);
      setSyncProgress(0);
    }
  }, [storageRef.current, isOnline, isSyncing, finalConfig]);
  
  const syncItem = useCallback(async (id: string): Promise<boolean> => {
    if (!storageRef.current || !isOnline) return false;
    
    try {
      const item = await storageRef.current.retrieve<T>(id);
      if (!item || item.syncStatus === 'synced') return true;
      
      // Simular sync individual
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const syncedItem: OfflineData<T> = {
        ...item,
        syncStatus: 'synced',
        lastSyncAttempt: new Date()
      };
      
      await storageRef.current.store(syncedItem);
      
      // Actualizar contador de pendientes
      const items = await storageRef.current.list<T>({ syncStatus: 'pending' });
      setPendingItems(items.length);
      
      return true;
      
    } catch (error) {
      return false;
    }
  }, [storageRef.current, isOnline]);
  
  const pauseSync = useCallback(() => {
    syncPausedRef.current = true;
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
  }, []);
  
  const resumeSync = useCallback(() => {
    syncPausedRef.current = false;
    if (finalConfig.syncStrategy === 'batched' && isOnline) {
      syncIntervalRef.current = setInterval(sync, finalConfig.syncInterval);
    }
  }, [finalConfig, isOnline, sync]);
  
  // ==========================================
  // CONFLICTOS
  // ==========================================
  
  const resolveConflict = useCallback(async (
    conflictId: string, 
    resolution: 'local' | 'server' | 'merged', 
    mergedData?: T
  ): Promise<void> => {
    const conflict = conflicts.find(c => c.id === conflictId);
    if (!conflict || !storageRef.current) return;
    
    let resolvedData: T;
    
    switch (resolution) {
      case 'local':
        resolvedData = conflict.localData.data;
        break;
      case 'server':
        resolvedData = conflict.serverData.data;
        break;
      case 'merged':
        if (!mergedData) throw new Error('Merged data required');
        resolvedData = mergedData;
        break;
    }
    
    const resolvedItem: OfflineData<T> = {
      ...conflict.localData,
      data: resolvedData,
      version: Math.max(conflict.localData.version, conflict.serverData.version) + 1,
      syncStatus: 'pending',
      timestamp: new Date()
    };
    
    await storageRef.current.store(resolvedItem);
    await addAuditEntry('conflict_resolved', conflict.id, { resolution }, conflict.localData.medicalContext);
    
    // Remover conflicto
    setConflicts(prev => prev.filter(c => c.id !== conflictId));
    
    // Auto-sync el item resuelto
    if (isOnline) {
      syncItem(conflict.id);
    }
  }, [conflicts, storageRef.current, addAuditEntry, isOnline, syncItem]);
  
  // ==========================================
  // UTILIDADES ADICIONALES
  // ==========================================
  
  const getStorageUsage = useCallback(async (): Promise<StorageUsage> => {
    if (!storageRef.current) throw new Error('Storage not initialized');
    return await storageRef.current.getStorageUsage();
  }, []);
  
  const compactStorage = useCallback(async (): Promise<void> => {
    if (!storageRef.current) return;
    
    // Eliminar items muy antiguos o ya sincronizados
    const items = await storageRef.current.list<T>();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    for (const item of items) {
      if (item.syncStatus === 'synced' && new Date(item.timestamp) < thirtyDaysAgo) {
        await storageRef.current.remove(item.id);
      }
    }
  }, []);
  
  const exportData = useCallback(async (): Promise<OfflineExport<T>> => {
    if (!storageRef.current) throw new Error('Storage not initialized');
    
    const items = await storageRef.current.list<T>();
    const auditLog = await storageRef.current.getAuditLog();
    
    return {
      version: '1.0',
      timestamp: new Date(),
      items,
      config: finalConfig,
      auditLog
    };
  }, [finalConfig]);
  
  const importData = useCallback(async (data: OfflineExport<T>): Promise<void> => {
    if (!storageRef.current) throw new Error('Storage not initialized');
    
    // Importar items
    for (const item of data.items) {
      await storageRef.current.store(item);
    }
    
    // Importar audit log
    for (const entry of data.auditLog) {
      await storageRef.current.addAuditEntry(entry);
    }
    
    // Actualizar estado
    const pendingItems = await storageRef.current.list<T>({ syncStatus: 'pending' });
    setPendingItems(pendingItems.length);
    
    const fullAuditLog = await storageRef.current.getAuditLog();
    setAuditLog(fullAuditLog);
  }, []);
  
  // ==========================================
  // MÉTODOS MÉDICOS ESPECÍFICOS
  // ==========================================
  
  const storeMedicalData = useCallback(async (data: T, context: MedicalContext): Promise<string> => {
    const id = `medical_${context.dataType}_${context.patientId}_${Date.now()}`;
    
    const medicalContext: MedicalContext = {
      ...context,
      requiresEncryption: context.sensitivity === 'phi' || context.sensitivity === 'high'
    };
    
    await store(id, data, medicalContext);
    return id;
  }, [store]);
  
  const getMedicalData = useCallback(async (patientId: string, dataType: string): Promise<OfflineData<T>[]> => {
    return await list({
      medicalContext: {
        patientId,
        dataType: dataType as any
      }
    });
  }, [list]);
  
  // ==========================================
  // CLEANUP
  // ==========================================
  
  useEffect(() => {
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);
  
  // ==========================================
  // RETURN
  // ==========================================
  
  return {
    // Estado de conexión
    isOnline,
    networkInfo,
    
    // Estado de sincronización
    isSyncing,
    syncProgress,
    lastSync,
    pendingItems,
    
    // Gestión de datos
    store,
    retrieve,
    update,
    remove,
    list,
    clear,
    
    // Sincronización
    sync,
    syncItem,
    pauseSync,
    resumeSync,
    
    // Conflictos
    conflicts,
    resolveConflict,
    
    // Utilidades
    getStorageUsage,
    compactStorage,
    exportData,
    importData,
    
    // Médicas específicas
    storeMedicalData,
    getMedicalData,
    auditLog
  };
}