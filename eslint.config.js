import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';

export default [
  // Global ignores for the monorepo (flat config)
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'build/**',
      'coverage/**',
      'dist/**',
      'apps/*/.next/**',
      'apps/*/dist/**',
      'packages/*/dist/**',
      '**/*.d.ts',
      'packages/hooks/src/**/*.test.{ts,tsx,js,jsx}',
      'packages/hooks/src/**/DEPRECATED_*.ts'
    ]
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        // Browser globals
        console: 'readonly',
        window: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        navigator: 'readonly',
        MediaStream: 'readonly',
        RTCPeerConnection: 'readonly',
        RTCDataChannel: 'readonly',
        RTCPeerConnectionState: 'readonly',
        RTCConfiguration: 'readonly',
        RTCSessionDescriptionInit: 'readonly',
        RTCIceCandidate: 'readonly',
        RTCStatsReport: 'readonly',
        performance: 'readonly',
        URL: 'readonly',
        btoa: 'readonly',
        atob: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        CryptoKey: 'readonly',
        crypto: 'readonly',
        // Node.js globals
        process: 'readonly',
        Buffer: 'readonly',
        clearTimeout: 'readonly',
        setTimeout: 'readonly',
        NodeJS: 'readonly',
        // Testing globals
        expect: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        afterEach: 'readonly',
        // Web APIs
        WebSocket: 'readonly',
        Notification: 'readonly',
        MediaRecorder: 'readonly',
        AudioContext: 'readonly',
        RTCIceConnectionState: 'readonly',
        RTCIceCandidatePair: 'readonly',
        MediaStreamConstraints: 'readonly',
        HTMLVideoElement: 'readonly',
        // Node.js specific
        __dirname: 'readonly',
        // React hooks
        useState: 'readonly',
        useEffect: 'readonly',
        useCallback: 'readonly',
        // Other globals
        io: 'readonly',
        Socket: 'readonly',
        logger: 'readonly',
        fetch: 'readonly',
        AbortController: 'readonly',
        URLSearchParams: 'readonly',
        // Additional globals
        setInterval: 'readonly',
        clearInterval: 'readonly',
        document: 'readonly',
        PerformanceObserver: 'readonly',
        // React Query DevTools
        ReactQueryDevtools: 'readonly',
        // Additional browser globals used in legacy/rtc code
        Blob: 'readonly',
        RTCRtpReceiver: 'readonly',
        React: 'readonly',
        FormData: 'readonly',
        SpeechSynthesisUtterance: 'readonly',
        alert: 'readonly',
        matchMedia: 'readonly',
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin
    },
    rules: {
      // Core rules
      'no-unused-vars': 'off',
      'no-console': 'warn',
      'no-undef': 'off',

      // TypeScript specific
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',

      // Medical/Security specific
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error'
    },
    ignores: [
      'node_modules/**',
      '.next/**',
      'build/**',
      'coverage/**',
      '**/*.d.ts',
      'apps/*/node_modules/**',
      'packages/*/node_modules/**',
      'apps/*/.next/**',
      'dist/**',
      // Ignore deprecated/backup legacy hooks
      'apps/**/src/hooks/DEPRECATED_*',
      'apps/**/src/hooks/BACKUP_*',
      'packages/**/src/**/DEPRECATED_*',
      // Ignore e2e and generated test artifacts
      'packages/e2e-tests/**'
    ]
  }
  ,
  // Hooks package: relajar reglas estrictas para hooks
  {
    files: ['packages/hooks/src/**/*.{ts,tsx,js,jsx}'],
    rules: {
      'no-case-declarations': 'warn',
      'no-empty': ['warn', { allowEmptyCatch: true }]
    }
  }
  ,
  // Type definitions: parse as TS but skip problematic rules
  {
    files: ['**/*.d.ts'],
    languageOptions: {
      parser: tsParser,
    },
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off'
    }
  }
  ,
  // Ensure Node.js globals are recognized in config files and mjs/cjs
  {
    files: ['**/*.mjs', '**/*.cjs', '**/*config.{js,mjs,cjs}', '**/next.config.mjs'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        process: 'readonly',
        __dirname: 'readonly',
        module: 'readonly',
        require: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly'
      }
    },
    rules: {
      'no-undef': 'off'
    }
  }
  ,
  {
    files: ['packages/shared/src/services/**/*.{ts,tsx}'],
    rules: {
      'no-console': 'error'
    }
  }
  ,
  {
    files: ['packages/services/src/**/*.{ts,tsx}', 'packages/database/src/**/*.{ts,tsx}'],
    rules: {
      'no-console': 'error'
    }
  }
  ,
  {
    files: ['**/__tests__/**/*.{js,jsx,ts,tsx}', 'packages/e2e-tests/**/*.{js,ts}'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off'
    }
  }
];
