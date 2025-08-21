// 🎯 Organized API Configuration - Clear & Accessible
// Total APIs: 256 organized by domain
// Structure: domain.service.endpoint for easy access

// 📚 Available Domains:
// - patients: Gestión de Pacientes (12 APIs)
// - doctors: Gestión de Doctores (16 APIs)
// - appointments: Citas Médicas (12 APIs)
// - telemedicine: Telemedicina y Videollamadas (44 APIs)
// - anamnesis: Anamnesis y Historiales (5 APIs)
// - medical_records: Expedientes Médicos (3 APIs)
// - prescriptions: Recetas Médicas (8 APIs)
// - reports: Reportes Médicos (4 APIs)
// - companies: Empresas/Instituciones (13 APIs)
// - marketplace: Marketplace B2B (18 APIs)
// - jobs: Ofertas de Trabajo (7 APIs)
// - auth: Autenticación y Autorización (4 APIs)
// - admin: Administración del Sistema (10 APIs)
// - users: Gestión de Usuarios (8 APIs)
// - payments: Pagos y Facturación (4 APIs)
// - ai: Inteligencia Artificial (11 APIs)
// - health: Estado del Sistema (14 APIs)
// - matching: Sistema de Matching (4 APIs)
// - other: Otros Endpoints (59 APIs)

export const API_DOMAINS = {
  // Gestión de Pacientes
  patients: {
    description: 'Gestión de Pacientes',
    totalApis: 12,
    services: {
      api_server: {
        port: 3001,
        baseUrl: 'http://localhost:3001',
        endpoints: {
          list: '/api/v1/patients',
          id_appointments: '/api/v1/patients/:id/appointments',
          patients_simple: '/api/v1/patients/simple',
        }
      },
      patients: {
        port: 3003,
        baseUrl: 'http://localhost:3003',
        endpoints: {
          byId: '/api/v1/anamnesis/paciente/:id',
          id_resumen: '/api/v1/anamnesis/paciente/:id/resumen',
        }
      },
      doctors: {
        port: 3002,
        baseUrl: 'http://localhost:3002',
        endpoints: {
          list: '/api/patients',
        }
      },
      web_app: {
        port: 3000,
        baseUrl: 'http://localhost:3000',
        endpoints: {
          list: '/api/patients',
        }
      },
    }
  },

  // Gestión de Doctores
  doctors: {
    description: 'Gestión de Doctores',
    totalApis: 16,
    services: {
      api_server: {
        port: 3001,
        baseUrl: 'http://localhost:3001',
        endpoints: {
          byId: '/api/v1/doctors/:id',
          id_appointments: '/api/v1/doctors/:id/appointments',
          id_reviews: '/api/v1/doctors/:id/reviews',
          id_schedule: '/api/v1/doctors/:id/schedule',
          id_stats: '/api/v1/doctors/:id/stats',
          id_verification: '/api/v1/doctors/:id/verification',
          search: '/api/v1/doctors/search/location',
          doctors_visible: '/api/v1/doctors/visible',
          independent_doctors: '/api/v1/independent-doctors',
          marketplace_doctors: '/api/v1/marketplace/doctors',
          doctor_message: '/doctor-message',
        }
      },
    }
  },

  // Citas Médicas
  appointments: {
    description: 'Citas Médicas',
    totalApis: 12,
    services: {
      api_server: {
        port: 3001,
        baseUrl: 'http://localhost:3001',
        endpoints: {
          list: '/api/appointments',
          status: '/api/appointments/:appointmentId/status',
          video_session: '/api/v1/appointments/:id/video-session',
          appointment_reminder: '/appointment-reminder',
        }
      },
      doctors: {
        port: 3002,
        baseUrl: 'http://localhost:3002',
        endpoints: {
          list: '/api/appointments',
        }
      },
      web_app: {
        port: 3000,
        baseUrl: 'http://localhost:3000',
        endpoints: {
          list: '/api/appointments',
        }
      },
    }
  },

  // Telemedicina y Videollamadas
  telemedicine: {
    description: 'Telemedicina y Videollamadas',
    totalApis: 44,
    services: {
      api_server: {
        port: 3001,
        baseUrl: 'http://localhost:3001',
        endpoints: {
          rooms: '/api/rooms',
          rooms_roomId: '/api/rooms/:roomId',
          telemedicine_ai: '/api/telemedicine-ai',
          telemedicine_session: '/api/telemedicine/session',
          telemedicine_sessions: '/api/telemedicine/sessions',
          byId: '/api/telemedicine/sessions/:id',
          id_cancel: '/api/telemedicine/sessions/:id/cancel',
          id_chat: '/api/telemedicine/sessions/:id/chat',
          id_end: '/api/telemedicine/sessions/:id/end',
          id_start: '/api/telemedicine/sessions/:id/start',
          telemedicine_billing: '/api/v1/telemedicine/billing',
          byId: '/api/v1/telemedicine/billing/:id',
          id_end: '/api/v1/telemedicine/sessions/:id/end',
          rooms_roomId: '/api/v1/telemedicine/webrtc/rooms/:roomId',
          webrtc_signaling: '/api/v1/telemedicine/webrtc/signaling',
          webrtc: '/api/webrtc',
          roomId_availability: '/rooms/:roomId/availability',
          _sessions: '/sessions',
          sessions_sessionId: '/sessions/:sessionId',
          sessionId_cancel: '/sessions/:sessionId/cancel',
          sessionId_chat: '/sessions/:sessionId/chat',
          sessionId_end: '/sessions/:sessionId/end',
          sessionId_start: '/sessions/:sessionId/start',
          telemedicine_confirmation: '/telemedicine-confirmation',
        }
      },
      doctors: {
        port: 3002,
        baseUrl: 'http://localhost:3002',
        endpoints: {
          list: '/api/telemedicine',
        }
      },
      web_app: {
        port: 3000,
        baseUrl: 'http://localhost:3000',
        endpoints: {
          list: '/api/telemedicine',
        }
      },
    }
  },

  // Anamnesis y Historiales
  anamnesis: {
    description: 'Anamnesis y Historiales',
    totalApis: 5,
    services: {
      patients: {
        port: 3003,
        baseUrl: 'http://localhost:3003',
        endpoints: {
          list: '/api/v1/anamnesis',
          anamnesis_importar: '/api/v1/anamnesis/importar',
        }
      },
    }
  },

  // Expedientes Médicos
  medical_records: {
    description: 'Expedientes Médicos',
    totalApis: 3,
    services: {
      api_server: {
        port: 3001,
        baseUrl: 'http://localhost:3001',
        endpoints: {
          'auth_helpers.ts': '/api/v1/medical-records/auth-helpers.ts',
          'simple_route.ts': '/api/v1/medical-records/simple-route.ts',
        }
      },
    }
  },

  // Recetas Médicas
  prescriptions: {
    description: 'Recetas Médicas',
    totalApis: 8,
    services: {
      api_server: {
        port: 3001,
        baseUrl: 'http://localhost:3001',
        endpoints: {
          'route_new.ts': '/api/v1/prescriptions/:id/route-new.ts',
          'prescriptions_route.ts': '/api/v1/prescriptions/prescriptions-route.ts',
          'route_new_global.ts': '/api/v1/prescriptions/route-new.ts',
        }
      },
    }
  },

  // Reportes Médicos
  reports: {
    description: 'Reportes Médicos',
    totalApis: 4,
    services: {
      api_server: {
        port: 3001,
        baseUrl: 'http://localhost:3001',
        endpoints: {
          'custom_reports': '/api/v1/analytics/custom-reports',
          'reports_schemas.ts': '/api/v1/analytics/custom-reports/schemas.ts',
          'medical_reports': '/api/v1/reports/medical-reports',
        }
      },
    }
  },

  // Empresas/Instituciones
  companies: {
    description: 'Empresas/Instituciones',
    totalApis: 13,
    services: {
      api_server: {
        port: 3001,
        baseUrl: 'http://localhost:3001',
        endpoints: {
          list: '/api/companies',
          list: '/api/v1/companies',
          byId: '/api/v1/companies/:id',
          companies_visible: '/api/v1/companies/visible',
          _companies: '/companies',
          byId: '/companies/:id',
        }
      },
      python_tools: {
        port: 8888,
        baseUrl: 'http://localhost:8888',
        endpoints: {
          'id_recommendations': '/api/matching/companies/{company_id}/recommendations',
        }
      },
    }
  },

  // Marketplace B2B
  marketplace: {
    description: 'Marketplace B2B',
    totalApis: 18,
    services: {
      api_server: {
        port: 3001,
        baseUrl: 'http://localhost:3001',
        endpoints: {
          job_listings: '/api/v1/job-listings',
          byId: '/api/v1/job-listings/:id',
          list: '/api/v1/marketplace',
          marketplace_notifications: '/api/v1/marketplace/notifications',
          byId: '/marketplace/applications/:id',
          marketplace_listings: '/marketplace/listings',
          byId: '/marketplace/listings/:id',
          id_applications: '/marketplace/listings/:id/applications',
          id_apply: '/marketplace/listings/:id/apply',
        }
      },
      web_app: {
        port: 3000,
        baseUrl: 'http://localhost:3000',
        endpoints: {
          list: '/api/marketplace',
        }
      },
    }
  },

  // Ofertas de Trabajo
  jobs: {
    description: 'Ofertas de Trabajo',
    totalApis: 7,
    services: {
      api_server: {
        port: 3001,
        baseUrl: 'http://localhost:3001',
        endpoints: {
          job_applications: '/api/v1/job-applications',
          list: '/api/v1/jobs',
        }
      },
    }
  },

  // Autenticación y Autorización
  auth: {
    description: 'Autenticación y Autorización',
    totalApis: 4,
    services: {
      api_server: {
        port: 3001,
        baseUrl: 'http://localhost:3001',
        endpoints: {
          auth_register: '/api/auth/register',
          auth_register: '/api/v1/auth/register',
          verify_sso: '/api/v1/auth/verify-sso',
        }
      },
      web_app: {
        port: 3000,
        baseUrl: 'http://localhost:3000',
        endpoints: {
          auth_refresh: '/api/auth/refresh',
        }
      },
    }
  },

  // Administración del Sistema
  admin: {
    description: 'Administración del Sistema',
    totalApis: 10,
    services: {
      api_server: {
        port: 3001,
        baseUrl: 'http://localhost:3001',
        endpoints: {
          admin_all: '/admin/all',
          admin_cleanup: '/admin/cleanup',
          admin_dashboard: '/api/admin/dashboard',
          admin_monitoring: '/api/admin/monitoring',
          admin_stats: '/api/admin/stats',
          health: '/api/admin/system/health',
          admin_users: '/api/admin/users',
          userId_role: '/api/admin/users/:userId/role',
          userId_suspend: '/api/admin/users/:userId/suspend',
          status: '/system/status',
        }
      },
    }
  },

  // Gestión de Usuarios
  users: {
    description: 'Gestión de Usuarios',
    totalApis: 8,
    services: {
      api_server: {
        port: 3001,
        baseUrl: 'http://localhost:3001',
        endpoints: {
          users_profile: '/api/users/profile',
          users_stats: '/api/users/stats',
          list: '/api/v1/users',
          user_userId: '/user/:userId',
          read_all: '/user/:userId/read-all',
          userId_stats: '/user/:userId/stats',
        }
      },
    }
  },

  // Pagos y Facturación
  payments: {
    description: 'Pagos y Facturación',
    totalApis: 4,
    services: {
      api_server: {
        port: 3001,
        baseUrl: 'http://localhost:3001',
        endpoints: {
          payments_mercadopago: '/api/v1/payments/mercadopago',
          mercadopago_webhook: '/api/v1/payments/mercadopago/webhook',
        }
      },
    }
  },

  // Inteligencia Artificial
  ai: {
    description: 'Inteligencia Artificial',
    totalApis: 11,
    services: {
      api_server: {
        port: 3001,
        baseUrl: 'http://localhost:3001',
        endpoints: {
          analyze_symptoms: '/api/v1/ai/analyze-symptoms',
          diagnosis_support: '/api/v1/ai/diagnosis-support',
          disease_prediction: '/api/v1/ai/disease-prediction',
          image_analysis: '/api/v1/ai/image-analysis',
          lab_analysis: '/api/v1/ai/lab-analysis',
          personalized_recommendations: '/api/v1/ai/personalized-recommendations',
          risk_assessment: '/api/v1/ai/risk-assessment',
        }
      },
    }
  },

  // Estado del Sistema
  health: {
    description: 'Estado del Sistema',
    totalApis: 14,
    services: {
      api_server: {
        port: 3001,
        baseUrl: 'http://localhost:3001',
        endpoints: {
          list: '/api/health',
          list: '/api/v1/health',
          health: '/health',
        }
      },
      patients: {
        port: 3003,
        baseUrl: 'http://localhost:3003',
        endpoints: {
          list: '/api/health',
        }
      },
      doctors: {
        port: 3002,
        baseUrl: 'http://localhost:3002',
        endpoints: {
          list: '/api/health',
        }
      },
      admin: {
        port: 3005,
        baseUrl: 'http://localhost:3005',
        endpoints: {
          list: '/api/health',
        }
      },
      companies: {
        port: 3004,
        baseUrl: 'http://localhost:3004',
        endpoints: {
          list: '/api/health',
        }
      },
      web_app: {
        port: 3000,
        baseUrl: 'http://localhost:3000',
        endpoints: {
          list: '/api/health',
          health: '/api/health/detailed',
          status: '/status',
        }
      },
    }
  },

  // Sistema de Matching
  matching: {
    description: 'Sistema de Matching',
    totalApis: 4,
    services: {
      python_tools: {
        port: 8888,
        baseUrl: 'http://localhost:8888',
        endpoints: {
          find_partners: '/api/matching/find-partners',
          create: '/api/matching/partnership/create',
        }
      },
    }
  },

  // Otros Endpoints
  other: {
    description: 'Otros Endpoints',
    totalApis: 59,
    services: {
      api_server: {
        port: 3001,
        baseUrl: 'http://localhost:3001',
        endpoints: {
          _: '/',
          _notificationId: '/:notificationId',
          notificationId_archive: '/:notificationId/archive',
          notificationId_read: '/:notificationId/read',
          ai_medical: '/api/ai-medical',
          alertId_acknowledge: '/api/alerts/:alertId/acknowledge',
          cors_example: '/api/cors-example',
          medical_specialties: '/api/medical/specialties',
          test: '/api/test',
          applications: '/api/v1/applications',
          dashboard: '/api/v1/dashboard',
          dashboard_analytics: '/api/v1/dashboard/analytics',
          debug_refresh: '/api/v1/debug-refresh',
          cost_estimation: '/api/v1/finops/cost-estimation',
          lab_results: '/api/v1/lab-results',
          medical_locations: '/api/v1/medical-locations',
          messages: '/api/v1/messages',
          messages_conversationId: '/api/v1/messages/:conversationId',
          metrics: '/api/v1/metrics',
          all_read: '/api/v1/notifications/mark-all-read',
          notifications_websocket: '/api/v1/notifications/websocket',
          limit_stats: '/api/v1/rate-limit-stats',
          test_firebase: '/api/v1/test-firebase',
          test_register: '/api/v1/test-register',
          websocket: '/api/websocket',
          medical_alert: '/medical-alert',
          _metrics: '/metrics',
          metrics_json: '/metrics-json',
          _stats: '/stats',
          _test: '/test',
        }
      },
      web_app: {
        port: 3000,
        baseUrl: 'http://localhost:3000',
        endpoints: {
          empty: '/api/empty',
          grok: '/api/grok',
          _connect: '/connect',
          _disconnect: '/disconnect',
          hospital3d_simulator: '/hospital3d-simulator',
          _send: '/send',
        }
      },
    }
  },

} as const;

// 🚀 Helper Functions for Easy Access
export const API = {
  // Build complete URL
  url: (domain: keyof typeof API_DOMAINS, service: string, endpoint: string): string => {
    const domainConfig = API_DOMAINS[domain];
    const serviceConfig = domainConfig.services[service as keyof typeof domainConfig.services];
    return `${serviceConfig.baseUrl}${serviceConfig.endpoints[endpoint as keyof typeof serviceConfig.endpoints]}`;
  },

  // Get service info
  service: (domain: keyof typeof API_DOMAINS, service: string) => {
    return API_DOMAINS[domain].services[service as keyof typeof API_DOMAINS[domain].services];
  },

  // Get all endpoints for a domain
  domain: (domain: keyof typeof API_DOMAINS) => {
    return API_DOMAINS[domain];
  }
};

// 📖 Usage Examples:
// API.url('patients', 'api_server', 'list')        // http://localhost:3001/api/v1/patients
// API.url('telemedicine', 'api_server', 'create')  // http://localhost:3001/api/telemedicine/sessions
// API.service('doctors', 'doctors').port           // 3002
// API.domain('auth').description                   // 'Autenticación y Autorización'

// 📊 Summary: 256 APIs organized across 19 domains