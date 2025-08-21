/**
 * 📚 SWAGGER/OPENAPI CONFIGURATION - ALTAMEDICA
 * Configuración centralizada para documentación API
 */

import type { SwaggerDefinition } from 'swagger-jsdoc';

export const swaggerDefinition: SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'AltaMedica API',
    version: '1.0.0',
    description: 'API REST para la plataforma de telemedicina AltaMedica',
    termsOfService: 'https://altamedica.com/terms',
    contact: {
      name: 'API Support',
      url: 'https://altamedica.com/support',
      email: 'api@altamedica.com'
    },
    license: {
      name: 'Proprietary',
      url: 'https://altamedica.com/license'
    }
  },
  servers: [
    {
      url: 'http://localhost:3001/api/v1',
      description: 'Development server'
    },
    {
      url: 'https://api.altamedica.com/api/v1',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token for authentication'
      },
      firebaseAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'Firebase ID Token',
        description: 'Firebase ID token for authentication'
      }
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          message: {
            type: 'string',
            example: 'Error message'
          },
          code: {
            type: 'string',
            example: 'ERROR_CODE'
          },
          details: {
            type: 'object',
            description: 'Additional error details (only in development)'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2025-01-28T12:00:00Z'
          }
        }
      },
      Success: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          data: {
            type: 'object',
            description: 'Response data'
          },
          message: {
            type: 'string',
            example: 'Operation successful'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2025-01-28T12:00:00Z'
          }
        }
      },
      PaginatedResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          data: {
            type: 'array',
            items: {
              type: 'object'
            }
          },
          pagination: {
            type: 'object',
            properties: {
              page: {
                type: 'integer',
                example: 1
              },
              limit: {
                type: 'integer',
                example: 20
              },
              total: {
                type: 'integer',
                example: 100
              },
              pages: {
                type: 'integer',
                example: 5
              }
            }
          },
          timestamp: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'user123'
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com'
          },
          firstName: {
            type: 'string',
            example: 'John'
          },
          lastName: {
            type: 'string',
            example: 'Doe'
          },
          role: {
            type: 'string',
            enum: ['admin', 'doctor', 'patient', 'company', 'nurse'],
            example: 'patient'
          },
          phoneNumber: {
            type: 'string',
            example: '+1234567890'
          },
          isActive: {
            type: 'boolean',
            example: true
          },
          emailVerified: {
            type: 'boolean',
            example: false
          },
          companyId: {
            type: 'string',
            example: 'company123'
          },
          profile: {
            type: 'object',
            properties: {
              avatar: {
                type: 'string',
                format: 'uri',
                example: 'https://example.com/avatar.jpg'
              },
              bio: {
                type: 'string',
                example: 'Medical professional with 10 years experience'
              },
              specialties: {
                type: 'array',
                items: {
                  type: 'string'
                },
                example: ['Cardiology', 'Internal Medicine']
              },
              languages: {
                type: 'array',
                items: {
                  type: 'string'
                },
                example: ['English', 'Spanish']
              },
              timezone: {
                type: 'string',
                example: 'America/Mexico_City'
              }
            }
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2025-01-28T12:00:00Z'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2025-01-28T12:00:00Z'
          }
        }
      },
      LoginRequest: {
        type: 'object',
        required: ['token'],
        properties: {
          token: {
            type: 'string',
            description: 'Firebase ID token',
            example: 'eyJhbGciOiJSUzI1NiIsImtpZCI...'
          }
        }
      },
      RegisterRequest: {
        type: 'object',
        required: ['email', 'password', 'name', 'role'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com'
          },
          password: {
            type: 'string',
            minLength: 6,
            example: 'securePassword123'
          },
          name: {
            type: 'string',
            example: 'John Doe'
          },
          role: {
            type: 'string',
            enum: ['doctor', 'patient', 'admin'],
            example: 'patient'
          }
        }
      },
      Appointment: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'appt123'
          },
          patientId: {
            type: 'string',
            example: 'patient123'
          },
          doctorId: {
            type: 'string',
            example: 'doctor123'
          },
          date: {
            type: 'string',
            format: 'date-time',
            example: '2025-01-30T10:00:00Z'
          },
          duration: {
            type: 'integer',
            description: 'Duration in minutes',
            example: 30
          },
          type: {
            type: 'string',
            enum: ['consultation', 'follow-up', 'emergency', 'telemedicine'],
            example: 'consultation'
          },
          status: {
            type: 'string',
            enum: ['scheduled', 'in-progress', 'completed', 'cancelled', 'no-show'],
            example: 'scheduled'
          },
          notes: {
            type: 'string',
            example: 'Regular check-up'
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      MedicalRecord: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'record123'
          },
          patientId: {
            type: 'string',
            example: 'patient123'
          },
          doctorId: {
            type: 'string',
            example: 'doctor123'
          },
          appointmentId: {
            type: 'string',
            example: 'appt123'
          },
          type: {
            type: 'string',
            enum: ['consultation', 'lab-result', 'imaging', 'prescription', 'procedure'],
            example: 'consultation'
          },
          diagnosis: {
            type: 'string',
            example: 'Hypertension'
          },
          symptoms: {
            type: 'array',
            items: {
              type: 'string'
            },
            example: ['Headache', 'Dizziness']
          },
          treatment: {
            type: 'string',
            example: 'Prescribed medication and lifestyle changes'
          },
          medications: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  example: 'Lisinopril'
                },
                dosage: {
                  type: 'string',
                  example: '10mg'
                },
                frequency: {
                  type: 'string',
                  example: 'Once daily'
                },
                duration: {
                  type: 'string',
                  example: '30 days'
                }
              }
            }
          },
          vitalSigns: {
            type: 'object',
            properties: {
              bloodPressure: {
                type: 'string',
                example: '120/80'
              },
              heartRate: {
                type: 'integer',
                example: 72
              },
              temperature: {
                type: 'number',
                example: 36.5
              },
              weight: {
                type: 'number',
                example: 70.5
              },
              height: {
                type: 'number',
                example: 175
              }
            }
          },
          attachments: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  example: 'lab-report'
                },
                url: {
                  type: 'string',
                  format: 'uri',
                  example: 'https://storage.altamedica.com/reports/123.pdf'
                },
                name: {
                  type: 'string',
                  example: 'Blood Test Results'
                }
              }
            }
          },
          isConfidential: {
            type: 'boolean',
            example: false
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time'
          }
        }
      }
    }
  },
  tags: [
    {
      name: 'Authentication',
      description: 'Authentication and authorization endpoints'
    },
    {
      name: 'Users',
      description: 'User management endpoints'
    },
    {
      name: 'Appointments',
      description: 'Appointment scheduling and management'
    },
    {
      name: 'Medical Records',
      description: 'Medical records and history management'
    },
    {
      name: 'Prescriptions',
      description: 'Prescription management'
    },
    {
      name: 'Telemedicine',
      description: 'Telemedicine sessions and WebRTC'
    },
    {
      name: 'AI',
      description: 'AI-powered medical features'
    },
    {
      name: 'Payments',
      description: 'Payment processing'
    },
    {
      name: 'Marketplace',
      description: 'Medical marketplace and job listings'
    }
  ]
};

export const swaggerOptions = {
  definition: swaggerDefinition,
  apis: [
    './src/app/api/v1/**/*.ts',
    './src/lib/swagger/schemas/*.ts'
  ]
};