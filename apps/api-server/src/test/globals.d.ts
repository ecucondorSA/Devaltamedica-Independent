/**
 * 🔧 ALTAMEDICA - GLOBAL TYPES DECLARATION
 * Declaraciones de tipos globales para testing
 * Solución basada en https://typescript.tv/errors/
 */

declare global {
  // Variables globales de testing
  var TEST_API_BASE: string;
  var TEST_TOKEN: string;
  var TEST_TIMEOUT: number;
  var TEST_HEADERS: {
    'Content-Type': string;
    'Authorization': string;
    'X-Test-Environment': string;
  };

  // Mock de Firebase Admin
  var mockFirebaseAdmin: {
    auth: () => {
      verifyIdToken: (token: string) => Promise<{
        uid: string;
        email: string;
        role: string;
      }>;
      createCustomToken: (uid: string) => Promise<string>;
    };
    firestore: () => {
      collection: (name: string) => any;
      doc: (path: string) => any;
    };
  };

  // Utilidades de testing
  var testUtils: {
    makeRequest: (endpoint: string, options?: any) => Promise<any>;
    createTestPatient: () => any;
    createTestDoctor: () => any;
    cleanup: () => Promise<void>;
  };

  // Namespace para funciones globales de test
  namespace globalThis {
    var TEST_API_BASE: string;
    var TEST_TOKEN: string;
    var TEST_TIMEOUT: number;
    var TEST_HEADERS: typeof TEST_HEADERS;
    var mockFirebaseAdmin: typeof mockFirebaseAdmin;
    var testUtils: typeof testUtils;
  }
}

// Export para hacer que este archivo sea un módulo
export {};
