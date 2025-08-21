/**
 * SecureStorage - Encriptación para localStorage/sessionStorage
 * Implementa AES-GCM para proteger tokens y datos sensibles
 */

export class SecureStorage {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12;
  private static readonly SALT_LENGTH = 16;
  private static readonly ITERATIONS = 100000;

  private static cryptoKey: CryptoKey | null = null;

  /**
   * Deriva una clave de encriptación desde una contraseña
   */
  private static async deriveKey(password: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey'],
    );

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: this.ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: this.ALGORITHM, length: this.KEY_LENGTH },
      false,
      ['encrypt', 'decrypt'],
    );
  }

  /**
   * Inicializa la clave de encriptación
   */
  static async initialize(): Promise<void> {
    if (typeof window === 'undefined' || !window.crypto?.subtle) {
      throw new Error('Web Crypto API not available');
    }

    const appKey = process.env.NEXT_PUBLIC_APP_KEY || 'altamedica-default-key-2025';
    this.cryptoKey = await this.deriveKey(appKey);
  }

  /**
   * Encripta un valor para almacenamiento seguro
   */
  static async encrypt(data: unknown): Promise<string> {
    if (!this.cryptoKey) {
      await this.initialize();
    }

    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));

    const encrypted = await crypto.subtle.encrypt(
      {
        name: this.ALGORITHM,
        iv,
      },
      this.cryptoKey!,
      encoder.encode(JSON.stringify(data)),
    );

    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  /**
   * Desencripta un valor almacenado
   */
  static async decrypt(encryptedData: string): Promise<unknown> {
    if (!this.cryptoKey) {
      await this.initialize();
    }

    try {
      const combined = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));
      const iv = combined.slice(0, this.IV_LENGTH);
      const encrypted = combined.slice(this.IV_LENGTH);

      const decrypted = await crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv,
        },
        this.cryptoKey!,
        encrypted,
      );

      const decoder = new TextDecoder();
      return JSON.parse(decoder.decode(decrypted));
    } catch {
      // console.error('Decryption failed:', error);
      return null;
    }
  }

  /**
   * Guarda un valor encriptado en localStorage
   */
  static async setItem(key: string, value: unknown): Promise<void> {
    if (typeof window === 'undefined') return;

    const encrypted = await this.encrypt(value);
    localStorage.setItem(key, encrypted);
  }

  /**
   * Obtiene y desencripta un valor de localStorage
   */
  static async getItem(key: string): Promise<unknown> {
    if (typeof window === 'undefined') return null;

    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;

    return await this.decrypt(encrypted);
  }

  /**
   * Guarda un valor encriptado en sessionStorage
   */
  static async setSessionItem(key: string, value: unknown): Promise<void> {
    if (typeof window === 'undefined') return;

    const encrypted = await this.encrypt(value);
    sessionStorage.setItem(key, encrypted);
  }

  /**
   * Obtiene y desencripta un valor de sessionStorage
   */
  static async getSessionItem(key: string): Promise<unknown> {
    if (typeof window === 'undefined') return null;

    const encrypted = sessionStorage.getItem(key);
    if (!encrypted) return null;

    return await this.decrypt(encrypted);
  }

  /**
   * Elimina un item de localStorage
   */
  static removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  }

  /**
   * Elimina un item de sessionStorage
   */
  static removeSessionItem(key: string): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(key);
  }

  /**
   * Limpia todos los datos encriptados
   */
  static clear(): void {
    if (typeof window === 'undefined') return;

    const keysToKeep = ['theme', 'language', 'preferences'];

    Object.keys(localStorage).forEach((key) => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });

    sessionStorage.clear();
  }

  /**
   * Migra datos existentes no encriptados a formato seguro
   */
  static async migrateExistingData(): Promise<void> {
    if (typeof window === 'undefined') return;

    const sensitiveKeys = ['token', 'refreshToken', 'user', 'session', 'auth'];

    for (const key of sensitiveKeys) {
      const plainValue = localStorage.getItem(key);
      if (plainValue && !plainValue.startsWith('eyJ')) {
        try {
          const parsed = JSON.parse(plainValue);
          await this.setItem(key, parsed);
          // console.info(`Migrated ${key} to secure storage`);
        } catch {
          await this.setItem(key, plainValue);
        }
      }
    }
  }
}

/**
 * Hook para React - useSecureStorage
 */
export function useSecureStorage() {
  const setSecureItem = async (key: string, value: unknown) => {
    await SecureStorage.setItem(key, value);
  };

  const getSecureItem = async (key: string) => {
    return await SecureStorage.getItem(key);
  };

  const removeSecureItem = (key: string) => {
    SecureStorage.removeItem(key);
  };

  return {
    setSecureItem,
    getSecureItem,
    removeSecureItem,
    clearSecure: SecureStorage.clear,
  };
}

export default SecureStorage;
