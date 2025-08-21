/**
 * 🧪 ALTAMEDICA - TEST TYPES
 * Tipos globales para testing
 */

declare global {
  const TEST_API_BASE: string
  const TEST_TOKEN: string
  const TEST_TIMEOUT: number
  const TEST_HEADERS: Record<string, string>
  
  const testUtils: {
    makeRequest(endpoint: string, options?: RequestInit): Promise<{
      status: number
      data: any
      ok: boolean
      headers: Headers
    }>
    generateTestPatient(): any
    generateTestDoctor(): any
    validateApiResponse(response: any, expectSuccess?: boolean): boolean
  }
  
  const mockFirebaseAdmin: {
    auth(): any
    firestore(): any
  }
}

export {}
