// jest.config.js
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/apps', '<rootDir>/packages', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js|jsx)',
    '**/?(*.)+(spec|test).+(ts|tsx|js|jsx)'
  ],
  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths || {}, {
      prefix: '<rootDir>/',
    }),
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@altamedica/(.*)$': '<rootDir>/packages/$1/src',
    '^@/contexts/AuthContext$': '<rootDir>/tests/__mocks__/AuthContext.tsx',
    '\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/tests/__mocks__/fileMock.js',
  },
  transform: {
    '^.+\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },
  globals: {
    'ts-jest': {
      isolatedModules: true,
      diagnostics: {
        warnOnly: process.env.CI === 'true',
      },
    },
    MEDICAL_ENV: 'test',
    HIPAA_MODE: true,
    FHIR_VERSION: 'R4',
  },
  setupFiles: ['<rootDir>/tests/setup/environment.js', '<rootDir>/tests/setup/medical-mocks.js'],
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup/jest.setup.js',
    '<rootDir>/tests/setup/medical-matchers.js',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.turbo/',
    '/dist/',
    '/build/',
    '/.next/',
    '/coverage/',
    '<rootDir>/apps/api-server/src/__tests__',
    '<rootDir>/apps/companies/src/__tests__',
    '<rootDir>/apps/doctors/src/__tests__',
    '<rootDir>/apps/web-app/src/__tests__',
    '<rootDir>/packages/shared/src/__tests__',
    '<rootDir>/packages/ui/src/__tests__',
    '<rootDir>/apps/api-server/src/app/api/v1/analytics/custom-reports/test.js',
    '<rootDir>/apps/api-server/src/app/api/v1/prescriptions/test.js',
    '<rootDir>/apps/api-server/src/app/api/v1/medical-records/test.js',
    '<rootDir>/apps/api-server/src/app/api/v1/lab-results/test.js',
    '<rootDir>/apps/web-app/responsiveTest.spec.js',
    '<rootDir>/apps/api-server/src/test/security.test.ts',
    '<rootDir>/packages/medical-security/src/__tests__/setup.ts',
    '<rootDir>/apps/web-app/lib/clinical-decision/clinical-decision-engine.test.ts',
    '<rootDir>/apps/web-app/src/lib/api-client.test.ts',
    '<rootDir>/apps/web-app/src/hooks/api-hooks.test.tsx',
    '<rootDir>/apps/web-app/src/components/auth/SimpleAuthSystem.test.tsx',
    '<rootDir>/apps/companies/src/components/CompanyCard.test.tsx',
    '<rootDir>/apps/companies/src/hooks/useCompanies.test.tsx',
    '<rootDir>/apps/api-server/src/test/health.test.ts',
    '<rootDir>/packages/core/src/index.test.ts',
    '<rootDir>/apps/doctors/src/app.test.ts',
    '<rootDir>/apps/admin/src/app.test.ts',
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    'apps/**/src/**/*.{ts,tsx,js,jsx}',
    'packages/**/src/**/*.{ts,tsx,js,jsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/*.test.{ts,tsx,js,jsx}',
    '!**/*.spec.{ts,tsx,js,jsx}',
    '!**/dist/**',
    '!**/build/**',
    '!**/.next/**',
    '!**/apps/api-server/src/app/api/**/test.js',
    '!**/apps/patients/src/app/lab-results/page.tsx',
    '!**/apps/patients/src/app/health-metrics/page.tsx',
    '!**/apps/doctors/src/hooks/use-auth.ts',
    '!**/apps/doctors/src/hooks/useAuth.ts',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['json', 'lcov', 'text', 'html', 'cobertura'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};