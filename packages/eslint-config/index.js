module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:react/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    require.resolve('eslint-config-prettier'),
    'plugin:prettier/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    },
    // No forzar un único tsconfig para evitar errores en apps sin raíz TSConfig.
    // Los proyectos TypeScript serán detectados por resolvers en settings y overrides.
  },
  plugins: [
    '@typescript-eslint',
    'react',
    'jsx-a11y',
    'import',
    'prettier'
  ],
  env: {
    browser: true,
    node: true,
    es2022: true,
    jest: true
  },
  settings: {
    react: {
      version: 'detect'
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        // Resolver desde el proyecto que ejecuta ESLint
        project: ['./tsconfig.json']
      }
    }
  },
  rules: {
    // TypeScript
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': 'error',

    // React
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // Import
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true
        }
      }
    ],
    'import/no-duplicates': 'error',
    // Prohibir imports internos salvo entradas públicas permitidas
    'import/no-internal-modules': [
      'error',
      {
        allow: [
          '@altamedica/*',
          '@altamedica/*/client',
          '@altamedica/*/server',
          '@altamedica/*/services',
          '@altamedica/*/hooks'
        ]
      }
    ],
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@altamedica/*/src/*', '@altamedica/*/dist/*'],
            message:
              'No importes desde src/ o dist/ de los paquetes. Usa las API públicas o subpaths permitidos (client, server, services, hooks).'
          },
          {
            group: ['@altamedica/*/constants/*'],
            message:
              'Constantes internas no son API pública. Expórtalas desde el entrypoint del paquete si deben usarse.'
          }
        ]
      }
    ],

    // General
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'no-alert': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',

    // Medical/Security specific
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error'
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        // Usar el tsconfig del proyecto actual (app/paquete)
        project: ['./tsconfig.json'],
        tsconfigRootDir: process.cwd(),
      },
      rules: {}
    },
    {
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      env: {
        jest: true
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off'
      }
    },
    {
      files: ['**/*.js'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off'
      }
    }
  ]
};