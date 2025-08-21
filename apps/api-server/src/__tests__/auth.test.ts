import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import {
  UnifiedAuthService,
  UserRole,
  createAuthContext
} from '../auth/UnifiedAuthSystem';

// Mock de Firebase Admin
vi.mock('../lib/firebase-admin', () => ({
  getAuthAdmin: vi.fn(() => ({
    verifyIdToken: vi.fn().mockResolvedValue({
      uid: 'test-uid',
      email: 'test@example.com',
      role: 'patient',
      permissions: []
    }),
    setCustomUserClaims: vi.fn().mockResolvedValue(undefined),
    getUser: vi.fn().mockResolvedValue({
      uid: 'test-uid',
      email: 'test@example.com'
    })
  })),
  getFirestoreAdmin: vi.fn(() => ({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            uid: 'test-uid',
            email: 'test@example.com',
            role: 'patient'
          })
        }),
        set: vi.fn().mockResolvedValue(undefined),
        update: vi.fn().mockResolvedValue(undefined)
      }))
    }))
  }))
}));

describe('Auth Service Tests', () => {
  const testUser = {
    userId: 'test-user-123',
    email: 'test@altamedica.com',
    role: UserRole.PATIENT,
    permissions: ['medical:read']
  };

  describe('JWT Token Generation and Verification', () => {
    it('should generate a valid JWT token', () => {
      const token = generateAuthToken(testUser);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      // Decodificar para verificar payload
      const decoded = jwt.decode(token) as any;
      expect(decoded.userId).toBe(testUser.userId);
      expect(decoded.email).toBe(testUser.email);
      expect(decoded.role).toBe(testUser.role);
    });

    it('should verify a valid JWT token', async () => {
      const token = generateAuthToken(testUser);
      const verified = await verifyAuthToken(token);
      
      expect(verified).toBeDefined();
      expect(verified?.userId).toBe(testUser.userId);
      expect(verified?.email).toBe(testUser.email);
      expect(verified?.role).toBe(testUser.role);
    });

    it('should reject an invalid JWT token', async () => {
      const invalidToken = 'invalid.token.here';
      const verified = await verifyAuthToken(invalidToken);
      
      expect(verified).toBeNull();
    });

    it('should reject an expired token', async () => {
      // Generar token con expiraci�n inmediata
      const expiredToken = generateAuthToken(testUser, '0s');
      
      // Esperar un momento para asegurar que expire
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const verified = await verifyAuthToken(expiredToken);
      expect(verified).toBeNull();
    });
  });

  describe('Refresh Token', () => {
    it('should generate a valid refresh token', () => {
      const refreshToken = generateRefreshToken(testUser.userId);
      expect(refreshToken).toBeDefined();
      expect(typeof refreshToken).toBe('string');
    });

    it('should verify a valid refresh token', async () => {
      const refreshToken = generateRefreshToken(testUser.userId);
      const verified = await verifyRefreshToken(refreshToken);
      
      expect(verified).toBeDefined();
      expect(verified?.userId).toBe(testUser.userId);
    });

    it('should reject an invalid refresh token', async () => {
      const verified = await verifyRefreshToken('invalid-refresh-token');
      expect(verified).toBeNull();
    });
  });

  describe('Role and Permission Validation', () => {
    it('should validate user roles correctly', () => {
      const authContext = createAuthContext({
        ...testUser,
        exp: Date.now() + 3600000,
        iat: Date.now()
      });

      expect(authContext.hasRole(UserRole.PATIENT)).toBe(true);
      expect(authContext.hasRole(UserRole.DOCTOR)).toBe(false);
      expect(authContext.hasRole(UserRole.ADMIN)).toBe(false);
    });

    it('should validate user permissions correctly', () => {
      const authContext = createAuthContext({
        ...testUser,
        exp: Date.now() + 3600000,
        iat: Date.now()
      });

      expect(authContext.hasPermission('medical:read')).toBe(true);
      expect(authContext.hasPermission('medical:write')).toBe(false);
      expect(authContext.hasPermission('admin:access')).toBe(false);
    });

    it('should handle users without permissions', () => {
      const userWithoutPermissions = {
        ...testUser,
        permissions: undefined,
        exp: Date.now() + 3600000,
        iat: Date.now()
      };

      const authContext = createAuthContext(userWithoutPermissions);
      expect(authContext.hasPermission('any:permission')).toBe(false);
    });
  });

  describe('Auth Context Creation', () => {
    it('should create auth context for authenticated user', () => {
      const authContext = createAuthContext({
        ...testUser,
        exp: Date.now() + 3600000,
        iat: Date.now()
      });

      expect(authContext.isAuthenticated).toBe(true);
      expect(authContext.user).toBeDefined();
      expect(authContext.user?.email).toBe(testUser.email);
    });

    it('should create auth context for unauthenticated user', () => {
      const authContext = createAuthContext(null);

      expect(authContext.isAuthenticated).toBe(false);
      expect(authContext.user).toBeNull();
      expect(authContext.hasRole(UserRole.PATIENT)).toBe(false);
      expect(authContext.hasPermission('any:permission')).toBe(false);
    });
  });

  describe('Role-based Access Control', () => {
    const roles = Object.values(UserRole);

    roles.forEach(role => {
      it(`should handle ${role} role correctly`, () => {
        const userWithRole = {
          ...testUser,
          role,
          exp: Date.now() + 3600000,
          iat: Date.now()
        };

        const authContext = createAuthContext(userWithRole);
        expect(authContext.hasRole(role)).toBe(true);
        
        // Verificar que no tiene otros roles
        roles.filter(r => r !== role).forEach(otherRole => {
          expect(authContext.hasRole(otherRole)).toBe(false);
        });
      });
    });
  });

  describe('Token Security', () => {
    it('should not expose sensitive information in token', () => {
      const sensitiveUser = {
        ...testUser,
        password: 'should-not-appear', // Este campo no deber�a aparecer
        ssn: '123-45-6789' // Informaci�n sensible
      };

      const token = generateAuthToken(sensitiveUser as any);
      const decoded = jwt.decode(token) as any;

      expect(decoded.password).toBeUndefined();
      expect(decoded.ssn).toBeUndefined();
    });

    it('should include required claims in token', () => {
      const token = generateAuthToken(testUser);
      const decoded = jwt.decode(token) as any;

      expect(decoded.iss).toBe('altamedica-api');
      expect(decoded.aud).toBe('altamedica-platform');
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });
  });
});

describe('Firebase Integration Tests', () => {
  it('should set custom claims for a user', async () => {
    const result = await setUserClaims('test-uid', UserRole.DOCTOR, ['medical:write']);
    expect(result).toBe(true);
  });

  it('should handle Firebase errors gracefully', async () => {
    // Mock Firebase error
    vi.mocked(require('../lib/firebase-admin').getAuthAdmin).mockReturnValueOnce(null);
    
    const result = await setUserClaims('test-uid', UserRole.DOCTOR, []);
    expect(result).toBe(false);
  });
});