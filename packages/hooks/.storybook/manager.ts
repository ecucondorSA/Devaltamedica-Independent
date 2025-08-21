/**
 * @fileoverview Configuración del manager de Storybook
 * @description Personalización de la UI de Storybook para AltaMedica
 */

import { addons } from '@storybook/manager-api';
import { create } from '@storybook/theming/create';

// Tema personalizado de AltaMedica
const altamedicaTheme = create({
  base: 'light',
  
  // Branding
  brandTitle: '@altamedica/hooks',
  brandUrl: 'https://altamedica.com',
  brandImage: undefined, // Logo URL aquí si existe
  brandTarget: '_self',
  
  // Colores principales
  colorPrimary: '#0ea5e9', // Azul médico
  colorSecondary: '#06b6d4', // Cyan médico
  
  // UI
  appBg: '#f8fafc',
  appContentBg: '#ffffff',
  appBorderColor: '#e2e8f0',
  appBorderRadius: 6,
  
  // Tipografía
  fontBase: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontCode: '"SF Mono", Monaco, Inconsolata, "Roboto Mono", monospace',
  
  // Texto
  textColor: '#1e293b',
  textInverseColor: '#ffffff',
  textMutedColor: '#64748b',
  
  // Barra de herramientas
  barTextColor: '#64748b',
  barSelectedColor: '#0ea5e9',
  barBg: '#ffffff',
  
  // Formularios
  inputBg: '#ffffff',
  inputBorder: '#d1d5db',
  inputTextColor: '#1e293b',
  inputBorderRadius: 4
});

addons.setConfig({
  theme: altamedicaTheme,
  
  // Panel de configuración
  panelPosition: 'bottom',
  selectedPanel: 'controls',
  
  // Configuración de la barra lateral
  sidebar: {
    showRoots: true,
    collapsedRoots: ['Ejemplos Avanzados']
  },
  
  // Configuración de toolbar
  toolbar: {
    title: { hidden: false },
    zoom: { hidden: false },
    eject: { hidden: true },
    copy: { hidden: false },
    fullscreen: { hidden: false }
  }
});