/**
import { logger } from '@altamedica/shared/services/logger.service';

 * Storage utilities for local and session storage
 */

export const storage = {
  // Local Storage
  get: (key: string): any => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },

  set: (key: string, value: any): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      logger.error("Error saving to localStorage:", error);
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      logger.error("Error removing from localStorage:", error);
    }
  },

  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      logger.error("Error clearing localStorage:", error);
    }
  },
};

export const sessionStorage = {
  // Session Storage
  get: (key: string): any => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },

  set: (key: string, value: any): void => {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      logger.error("Error saving to sessionStorage:", error);
    }
  },

  remove: (key: string): void => {
    try {
      window.sessionStorage.removeItem(key);
    } catch (error) {
      logger.error("Error removing from sessionStorage:", error);
    }
  },

  clear: (): void => {
    try {
      window.sessionStorage.clear();
    } catch (error) {
      logger.error("Error clearing sessionStorage:", error);
    }
  },
};

// Medical-specific storage keys
export const MEDICAL_STORAGE_KEYS = {
  USER_TOKEN: "altamedica_user_token",
  USER_DATA: "altamedica_user_data",
  PATIENT_DATA: "altamedica_patient_data",
  DOCTOR_DATA: "altamedica_doctor_data",
  APPOINTMENTS: "altamedica_appointments",
  PRESCRIPTIONS: "altamedica_prescriptions",
  MEDICAL_RECORDS: "altamedica_medical_records",
  FAVORITES: "altamedica_favorites",
  SETTINGS: "altamedica_settings",
} as const;

// ==================== MEDICAL DATA STORAGE ====================

export const medicalStorage = {
  // Patient Data
  setPatientData: (patientId: string, data: any): void => {
    storage.set(`patient_${patientId}`, data);
  },

  getPatientData: <T>(patientId: string): T | null => {
    return storage.get(`patient_${patientId}`) as T | null;
  },

  // Medical Records
  setMedicalRecords: (patientId: string, records: any[]): void => {
    storage.set(`medical_records_${patientId}`, records);
  },

  getMedicalRecords: (patientId: string): any[] => {
    return storage.get(`medical_records_${patientId}`) || [];
  },

  // Prescriptions
  setPrescriptions: (patientId: string, prescriptions: any[]): void => {
    storage.set(`prescriptions_${patientId}`, prescriptions);
  },

  getPrescriptions: (patientId: string): any[] => {
    return storage.get(`prescriptions_${patientId}`) || [];
  },

  // Appointments
  setAppointments: (patientId: string, appointments: any[]): void => {
    storage.set(`appointments_${patientId}`, appointments);
  },

  getAppointments: (patientId: string): any[] => {
    return storage.get(`appointments_${patientId}`) || [];
  },

  // Lab Results
  setLabResults: (patientId: string, results: any[]): void => {
    storage.set(`lab_results_${patientId}`, results);
  },

  getLabResults: (patientId: string): any[] => {
    return storage.get(`lab_results_${patientId}`) || [];
  },

  // User Preferences
  setUserPreferences: (userId: string, preferences: any): void => {
    storage.set(`user_preferences_${userId}`, preferences);
  },

  getUserPreferences: <T>(userId: string): T | null => {
    return storage.get(`user_preferences_${userId}`) as T | null;
  },

  // Clear all medical data for a patient
  clearPatientData: (patientId: string): void => {
    storage.remove(`patient_${patientId}`);
    storage.remove(`medical_records_${patientId}`);
    storage.remove(`prescriptions_${patientId}`);
    storage.remove(`appointments_${patientId}`);
    storage.remove(`lab_results_${patientId}`);
  },
};

// ==================== CACHE UTILITIES ====================

export const cache = {
  private: new Map<string, { data: any; timestamp: number; ttl: number }>(),

  set: (key: string, data: any, ttl: number = 300000): void => {
    // 5 minutes default
    cache.private.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  },

  get: <T>(key: string): T | null => {
    const item = cache.private.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      cache.private.delete(key);
      return null;
    }

    return item.data;
  },

  has: (key: string): boolean => {
    const item = cache.private.get(key);
    if (!item) return false;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      cache.private.delete(key);
      return false;
    }

    return true;
  },

  delete: (key: string): boolean => {
    return cache.private.delete(key);
  },

  clear: (): void => {
    cache.private.clear();
  },

  // Clean expired entries
  cleanup: (): void => {
    const now = Date.now();
    for (const [key, item] of cache.private.entries()) {
      if (now - item.timestamp > item.ttl) {
        cache.private.delete(key);
      }
    }
  },
};

// ==================== ENCRYPTED STORAGE ====================

export const secureStorage = {
  // Simple encryption for sensitive data (not for production use)
  encrypt: (data: string): string => {
    if (typeof window === "undefined") return data;
    try {
      return btoa(encodeURIComponent(data));
    } catch {
      return data;
    }
  },

  decrypt: (data: string): string => {
    if (typeof window === "undefined") return data;
    try {
      return decodeURIComponent(atob(data));
    } catch {
      return data;
    }
  },

  setSecure: (key: string, value: any): void => {
    const encrypted = secureStorage.encrypt(JSON.stringify(value));
    storage.set(`secure_${key}`, encrypted);
  },

  getSecure: <T>(key: string, defaultValue?: T): T | null => {
    try {
      const encrypted = storage.get(`secure_${key}`);
      if (!encrypted) return defaultValue || null;

      const decrypted = secureStorage.decrypt(encrypted);
      return JSON.parse(decrypted);
    } catch {
      return defaultValue || null;
    }
  },

  removeSecure: (key: string): void => {
    storage.remove(`secure_${key}`);
  },
};

// ==================== STORAGE EVENTS ====================

export const createStorageEvent = (
  key: string,
  value: any,
  type: "local" | "session" = "local"
): CustomEvent => {
  return new CustomEvent("storage-change", {
    detail: {
      key,
      value,
      type,
      timestamp: Date.now(),
    },
  });
};

export const listenToStorageChanges = (
  callback: (event: CustomEvent) => void
): void => {
  if (typeof window !== "undefined") {
    window.addEventListener("storage-change", callback as EventListener);
  }
};

export const removeStorageListener = (
  callback: (event: CustomEvent) => void
): void => {
  if (typeof window !== "undefined") {
    window.removeEventListener("storage-change", callback as EventListener);
  }
};