/**
 * @fileoverview Configuración principal de Storybook para @altamedica/hooks
 * @description Configuración especializada para documentación interactiva de hooks médicos
 */

import type { StorybookConfig } from '@storybook/react-vite';
import { resolve } from 'path';

const config: StorybookConfig = {
  stories: [
    '../stories/**/*.stories.@(js|jsx|ts|tsx|mdx)',
    '../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'
  ],
  
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-links',
    '@storybook/addon-docs',
    '@storybook/addon-controls',
    '@storybook/addon-viewport',
    '@storybook/addon-backgrounds',
    '@storybook/addon-measure',
    '@storybook/addon-outline',
    '@storybook/addon-a11y',
    {
      name: '@storybook/addon-storysource',
      options: {
        rule: {
          test: [/\.stories\.(jsx?|tsx?)$/],
          include: [resolve(__dirname, '../stories')]
        },
        loaderOptions: {
          prettierConfig: { printWidth: 80, singleQuote: false }
        }
      }
    }
  ],
  
  framework: {
    name: '@storybook/react-vite',
    options: {}
  },
  
  features: {
    buildStoriesJson: true,
    storyStoreV7: true
  },
  
  typescript: {
    check: false,
    checkOptions: {},
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
      compilerOptions: {
        allowSyntheticDefaultImports: false,
        esModuleInterop: false
      }
    }
  },
  
  viteFinal: async (config) => {
    // Configuración específica para hooks médicos
    config.define = {
      ...config.define,
      __DEV__: true,
      __STORYBOOK__: true,
      __MEDICAL_MODE__: true,
      __HIPAA_COMPLIANT__: true
    };
    
    // Alias para imports
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        '@': resolve(__dirname, '../src'),
        '@medical': resolve(__dirname, '../src/medical'),
        '@auth': resolve(__dirname, '../src/auth'),
        '@utils': resolve(__dirname, '../src/utils'),
        '@realtime': resolve(__dirname, '../src/realtime'),
        '@performance': resolve(__dirname, '../src/performance'),
        '@stories': resolve(__dirname, '../stories')
      }
    };
    
    return config;
  },
  
  docs: {
    autodocs: 'tag'
  },
  
  staticDirs: ['../public']
};

export default config;