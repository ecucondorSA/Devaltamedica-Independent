/**
 * 🛡️ ALTAMEDICA - SECURITY TESTS
 * Tests críticos de seguridad
 * Límite PROACTIVO: 250 líneas
 */
import { beforeAll, describe, expect, test } from '@jest/globals'
import { NextRequest } from 'next/server'
import { authenticateRequest, validateInput } from '../lib/security'
import { securityTestHelpers, testUtils } from './test-utils'

import { logger } from '@altamedica/shared/services/logger.service';
describe('Security Tests', () => {
  beforeAll(() => {
    logger.info('🛡️ Testing Security measures...')
  })
  describe('Input Validation', () => {
    test('should detect SQL injection attempts', () => {
      for (const input of securityTestHelpers.sqlInjectionPayloads) {
        const result = validateInput({ query: input })
        expect(result.isValid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
      }
    })

    test('should detect XSS attempts', () => {
      for (const input of securityTestHelpers.xssPayloads) {
        const result = validateInput({ content: input })
        expect(result.isValid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
      }
    })

    test('should detect NoSQL injection attempts', () => {
      const noSqlInputs = [
        { $where: "function() { return true; }" },
        "function() { return true; }",
        "eval(maliciousCode)"
      ]

      for (const input of noSqlInputs) {
        const result = validateInput(input)
        expect(result.isValid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
      }
    })

    test('should reject overly long inputs', () => {
      const longInput = 'a'.repeat(15000)
      const result = validateInput({ data: longInput })
      
      expect(result.isValid).toBe(false)
      expect(result.errors.some(error => error.includes('demasiado largo'))).toBe(true)
    })

    test('should allow safe inputs', () => {
      const safeInputs = [
        { name: "Juan Pérez", email: "juan@example.com" },
        { age: 30, city: "Madrid" },
        { description: "Esta es una descripción segura" }
      ]

      for (const input of safeInputs) {
        const result = validateInput(input)
        expect(result.isValid).toBe(true)
        expect(result.errors.length).toBe(0)
      }
    })
  })

  describe('Authentication', () => {
    test('should reject requests without authorization header', async () => {
      const request = new NextRequest('http://localhost:3001/api/v1/test')
      const result = await authenticateRequest(request)
      
      expect(result.isAuthenticated).toBe(false)
      expect(result.error).toContain('Token de autorización faltante')
    })

    test('should reject malformed authorization headers', async () => {
      const request = new NextRequest('http://localhost:3001/api/v1/test', {
        headers: { 'authorization': 'InvalidFormat' }
      })
      const result = await authenticateRequest(request)
      
      expect(result.isAuthenticated).toBe(false)
      expect(result.error).toContain('Token de autorización faltante')
    })

    test('should accept valid test token', async () => {
      const request = new NextRequest('http://localhost:3001/api/v1/test', {
        headers: { 'authorization': 'Bearer test-jwt-token-altamedica' }
      })
      const result = await authenticateRequest(request)
      
      expect(result.isAuthenticated).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.user.uid).toBe('test-user-123')
    })

    test('should reject invalid tokens', async () => {
      const request = new NextRequest('http://localhost:3001/api/v1/test', {
        headers: { 'authorization': 'Bearer invalid-token' }
      })
      const result = await authenticateRequest(request)
      
      expect(result.isAuthenticated).toBe(false)
      expect(result.error).toContain('Token inválido')
    })
  })

  describe('Rate Limiting', () => {
    test('should apply rate limiting to sensitive endpoints', async () => {
      // Simular múltiples requests de login
      const loginRequests = []
      
      for (let i = 0; i < 10; i++) {
        loginRequests.push(
          testUtils.makeRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({
              email: `test${i}@example.com`,
              password: 'password123'
            })
          })
        )
      }

      const results = await Promise.all(loginRequests)
      
      // Al menos algunos requests deberían ser bloqueados por rate limiting
      const blockedRequests = results.filter((r: any) => r.status === 429)
      expect(blockedRequests.length).toBeGreaterThan(0)
    })
  })
  describe('Security Headers', () => {
    test('should include security headers in responses', async () => {
      const response = await testUtils.makeRequest('/health')
      
      // Verificar headers críticos de seguridad
      const securityHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection',
        'referrer-policy'
      ];
      
      for (const header of securityHeaders) {
        expect(response.headers[header]).toBeDefined()
      }
    })

    test('should prevent clickjacking with X-Frame-Options', async () => {
      const response = await testUtils.makeRequest('/health')
      expect(response.headers['x-frame-options']).toBe('DENY')
    })

    test('should prevent MIME sniffing', async () => {
      const response = await testUtils.makeRequest('/health')
      expect(response.headers['x-content-type-options']).toBe('nosniff')
    })
  })
})
