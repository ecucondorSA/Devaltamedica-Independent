/**
 * @fileoverview Configuración de preview de Storybook
 * @description Setup global para stories de hooks médicos
 */

import type { Preview } from '@storybook/react';
import { themes } from '@storybook/theming';
import React from 'react';

// Decorador para contexto médico
const MedicalContextDecorator = (Story: React.ComponentType) => {
  return (
    <div style={{ 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      backgroundColor: '#fafafa',
      minHeight: '100vh',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '2rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <Story />
      </div>
    </div>
  );
};

const preview: Preview = {
  parameters: {
    // Configuración de acciones
    actions: { 
      argTypesRegex: '^on[A-Z].*' 
    },
    
    // Configuración de controles
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/
      },
      expanded: true,
      sort: 'requiredFirst'
    },
    
    // Configuración de docs
    docs: {
      theme: themes.light,
      toc: {
        contentsSelector: '.sbdocs-content',
        headingSelector: 'h1, h2, h3, h4, h5, h6',
        title: 'Tabla de Contenidos',
        disable: false,
        unsafeTocbotOptions: {
          orderedList: false
        }
      }
    },
    
    // Configuración de viewport
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '667px'
          }
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px'
          }
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1440px',
            height: '900px'
          }
        },
        medicalWorkstation: {
          name: 'Medical Workstation',
          styles: {
            width: '1920px',
            height: '1080px'
          }
        }
      }
    },
    
    // Configuración de backgrounds
    backgrounds: {
      default: 'medical-light',
      values: [
        {
          name: 'medical-light',
          value: '#f8fafc'
        },
        {
          name: 'medical-dark',
          value: '#1e293b'
        },
        {
          name: 'hospital-white',
          value: '#ffffff'
        },
        {
          name: 'emergency-red',
          value: '#fef2f2'
        }
      ]
    },
    
    // Configuración de layout
    layout: 'padded',
    
    // Configuración específica para hooks médicos
    options: {
      storySort: {
        order: [
          'Introducción',
          ['Getting Started', 'Arquitectura', 'Compliance HIPAA'],
          'Medical Hooks',
          ['usePatients', 'useMedicalAI', 'useVitalSigns'],
          'Auth Hooks', 
          ['useAuth', 'usePermissions'],
          'Realtime Hooks',
          ['useWebSocket', 'useNotifications'],
          'Performance Hooks',
          ['usePerformance', 'useOffline'],
          'Utility Hooks',
          ['useDebounce', 'useLocalStorage'],
          'Composed Hooks',
          ['useTelemedicineSession', 'useMedicalDashboard'],
          'Ejemplos Avanzados'
        ]
      }
    }
  },
  
  // Decoradores globales
  decorators: [
    MedicalContextDecorator
  ],
  
  // Args globales
  args: {
    // Args por defecto para todos los hooks
  },
  
  // ArgTypes globales
  argTypes: {
    // Configuración común para hooks médicos
    onError: {
      action: 'error',
      description: 'Callback ejecutado cuando ocurre un error'
    },
    onSuccess: {
      action: 'success', 
      description: 'Callback ejecutado cuando la operación es exitosa'
    },
    hipaaCompliant: {
      control: 'boolean',
      description: 'Habilitar compliance HIPAA',
      defaultValue: true
    },
    auditLog: {
      control: 'boolean',
      description: 'Habilitar logging de auditoría',
      defaultValue: true
    }
  },
  
  // Tags globales
  tags: ['autodocs']
};

export default preview;