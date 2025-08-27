import cookieParser from 'cookie-parser';
import cors from 'cors';
import 'dotenv/config'; // ESM: carga automática de variables desde .env*
import express from 'express';
import rateLimit from 'express-rate-limit';
import { initializeMiddlewares } from './middleware';
import { csrfMiddleware } from './middleware/csrf.middleware';
import authFirebaseRoutes from './routes/auth-firebase.routes';
// SSO routes removed - using session-based auth only
import { initSecrets } from './config/secrets-loader';
import mfaRoutes from './routes/mfa.routes';

const app = express();
const PORT = process.env.PORT || 3001; // Changed from 3002 to 3001

// P0 Security: Global rate limiting (before other middlewares)
const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
  handler: (req: any, res: any) => {
    logger.warn(`[RATE_LIMIT] IP ${req.ip} exceeded global rate limit`);
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: 60,
      message: 'Rate limit exceeded. Please try again in 1 minute.',
    });
  },
});

// Apply global rate limiter to all routes
app.use(globalRateLimiter as any);

// Inicializar middlewares de seguridad
initializeMiddlewares(app, process.env.ENCRYPTION_SECRET || 'default-key-change-in-production');

// Cookie parser ANTES de CORS para que funcione correctamente
app.use(cookieParser());

// CORS configuration - CRÍTICO para cookies cross-origin
app.use(
  cors({
    origin: [
      /localhost:(3000|3001|3002|3003|3004|3005|3006|3008)$/,
      'http://localhost:3000',
      'http://localhost:3001', // Updated port
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:3004',
      'http://localhost:3005',
      'http://localhost:3006',
      'http://localhost:3008',
    ],
    credentials: true, // CRÍTICO para cookies httpOnly
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    // Permitir header CSRF para clientes (unificado)
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-csrf-token'],
    exposedHeaders: ['Set-Cookie'], // Para debugging
  }),
);

// Configuración básica de Express
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 🏥 RUTAS HEALTH - CRITICAL FOR API TESTING (public, no CSRF needed)
import healthRoutes from './routes/health.v2.routes';
app.use('/api/v1/health', healthRoutes);
logger.info('✅ Health Routes mounted at /api/v1/health');

// P1 Monitoring: Prometheus metrics (public endpoint)
import metricsRoutes from './routes/metrics.routes';
app.use('/api/v1', metricsRoutes);
logger.info('✅ Metrics Routes mounted at /api/v1/metrics');

// P0 Security: CSRF protection BEFORE sensitive routes
app.use(csrfMiddleware);

// 🔐 RUTAS Firebase Session (único sistema de autenticación)
app.use('/api/v1/auth', authFirebaseRoutes);
logger.info('✅ Auth Routes mounted at /api/v1/auth');

// 🔐 RUTAS MFA (enable/disable) - GAP-002-T2
app.use('/api/v1/mfa', mfaRoutes);
logger.info('✅ MFA Routes mounted at /api/v1/mfa');

// 📊 RUTAS BÁSICAS - Para pruebas de conectividad
import basicEndpointsRoutes from './routes/basic-endpoints.routes';
app.use('/api/v1', basicEndpointsRoutes);
logger.info('✅ Basic Endpoints mounted at /api/v1');

// GAP-009-T2: Stub ingest QoS WebRTC (pendiente persistencia)
// import { QoSIngestRequestSchema } from '@altamedica/types';

app.post('/api/v1/telemedicine/qos', (req, res) => {
  try {
    const samples = Array.isArray(req.body?.samples) ? req.body.samples : [];
    return res.status(202).json({
      ok: true,
      accepted: samples.length,
      pendingPersistence: true,
      next: { recommendedBatchMs: 5000, maxSamplesPerBatch: 50 },
    });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: 'internal_error', message: e.message });
  }
});
logger.info('✅ QoS Ingest Stub mounted at /api/v1/telemedicine/qos');

// 🤖 RUTAS DIAGNOSTIC ENGINE - TEMPORARILY DISABLED
// import diagnosticRoutes from './routes/diagnostic.routes';
// app.use('/api/v1/diagnostic', diagnosticRoutes);
// logger.info('✅ Diagnostic Routes mounted at /api/v1/diagnostic');

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'AltaMedica API Server',
    version: '2.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    architecture: 'Express.js + TypeScript',
    documentation: '/api/v1/health',
    endpoints: {
      health: '/api/v1/health',
      auth: '/api/v1/auth',
      ai: '/api/v1/ai',
      telemedicine: '/api/v1/telemedicine',
      marketplace: '/api/v1/marketplace',
      notifications: '/api/v1/notifications',
      metrics: '/api/v1/metrics',
    },
    migration: {
      status: 'completed',
      migratedRoutes: [
        'ai-jobs -> /api/v1/ai/jobs',
        'telemedicine-routes -> /api/v1/telemedicine',
        'marketplace-routes -> /api/v1/marketplace',
        'notification-routes -> /api/v1/notifications',
        'metrics -> /api/v1/metrics',
      ],
    },
  });
});

// Quick health check endpoint (inline for testing)
app.get('/api/v1/health/quick', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'Quick health check - API Server is running',
  });
});

// Root health for simple probes (legacy support)
app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true, status: 'healthy' });
});

// Temporary test user creation endpoint
app.post('/api/v1/test/create-user', (req, res) => {
  // Mock user creation for testing
  res.json({
    success: true,
    message: 'Test user created successfully',
    user: {
      id: 'test-user-123',
      email: 'doctor.test@altamedica.com',
      name: 'Dr. Test User',
      role: 'DOCTOR',
      status: 'active',
    },
    timestamp: new Date().toISOString(),
  });
});

// Mock users for different role testing
const mockTestUsers = {
  'doctor.test@altamedica.com': {
    id: 'doctor-123',
    email: 'doctor.test@altamedica.com',
    firstName: 'Dr. Test',
    lastName: 'Doctor',
    role: 'DOCTOR',
    specialization: 'Testing Specialist',
    redirectUrl: 'http://localhost:3002',
  },
  'patient.test@altamedica.com': {
    id: 'patient-123',
    email: 'patient.test@altamedica.com',
    firstName: 'Test',
    lastName: 'Patient',
    role: 'PATIENT',
    redirectUrl: 'http://localhost:3003',
  },
  'company.test@altamedica.com': {
    id: 'company-123',
    email: 'company.test@altamedica.com',
    firstName: 'Test',
    lastName: 'Company',
    role: 'COMPANY',
    company: 'Test Company Corp',
    redirectUrl: 'http://localhost:3004',
  },
  'admin.test@altamedica.com': {
    id: 'admin-123',
    email: 'admin.test@altamedica.com',
    firstName: 'Test',
    lastName: 'Admin',
    role: 'ADMIN',
    permissions: ['FULL_ACCESS'],
    redirectUrl: 'http://localhost:3005',
  },
};

// Enhanced mock login endpoint with multiple test users
app.post('/api/v1/auth/test-login', (req, res) => {
  const { email, password } = req.body;

  // Check if test user exists and password is correct
  const testUser = mockTestUsers[email as keyof typeof mockTestUsers];

  if (testUser && password === 'test123456') {
    // Generate role-specific token
    const roleToken = `mock-jwt-${testUser.role.toLowerCase()}-${testUser.id}`;

    res.cookie('altamedica_auth_token', roleToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.json({
      success: true,
      message: 'Login successful',
      user: testUser,
      token: roleToken,
      redirectUrl: testUser.redirectUrl,
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(401).json({
      error: 'Credenciales inválidas',
      message: 'Email o contraseña incorrectos',
    });
  }
});

// Enhanced mock auth/me endpoint for testing multiple roles
app.get('/api/v1/auth/test-me', (req, res) => {
  const authCookie = req.cookies?.altamedica_auth_token;

  if (!authCookie) {
    return res.status(401).json({
      error: 'No autenticado',
      message: 'Token de autenticación requerido',
    });
  }

  // Find user by token pattern
  let authenticatedUser = null;

  // Check for role-specific tokens
  if (authCookie.includes('mock-jwt-doctor-')) {
    authenticatedUser = mockTestUsers['doctor.test@altamedica.com'];
  } else if (authCookie.includes('mock-jwt-patient-')) {
    authenticatedUser = mockTestUsers['patient.test@altamedica.com'];
  } else if (authCookie.includes('mock-jwt-company-')) {
    authenticatedUser = mockTestUsers['company.test@altamedica.com'];
  } else if (authCookie.includes('mock-jwt-admin-')) {
    authenticatedUser = mockTestUsers['admin.test@altamedica.com'];
  } else if (authCookie === 'mock-jwt-token-123') {
    // Backward compatibility for original doctor token
    authenticatedUser = mockTestUsers['doctor.test@altamedica.com'];
  }

  if (authenticatedUser) {
    return res.json({
      ...authenticatedUser,
      authenticated: true,
      timestamp: new Date().toISOString(),
      tokenInfo: {
        token: authCookie,
        issuedAt: new Date().toISOString(),
      },
    });
  } else {
    return res.status(401).json({
      error: 'Token inválido',
      message: 'Token de autenticación no válido',
    });
  }
});

// Endpoint to list all available test users for role testing
app.get('/api/v1/auth/test-users', (req, res) => {
  const testUsers = Object.entries(mockTestUsers).map(([email, userData]) => ({
    email,
    role: userData.role,
    name: `${userData.firstName} ${userData.lastName}`,
    redirectUrl: userData.redirectUrl,
    description: `Test user for ${userData.role.toLowerCase()} role`,
  }));

  res.json({
    message: 'Available test users for role-based authentication testing',
    users: testUsers,
    credentials: {
      password: 'test123456',
      note: 'All test users use the same password: test123456',
    },
    usage: 'Use these credentials to test role-based redirection functionality',
    timestamp: new Date().toISOString(),
  });
});

// Legacy health check endpoint (redirect to new endpoint)
app.get('/api/health', (req, res) => {
  res.redirect(301, '/api/v1/health');
});

// Legacy API redirects for backward compatibility
app.use('/api/ai/*', (req, res) => {
  const newPath = req.path.replace('/api/ai', '/api/v1/ai');
  res.redirect(301, newPath);
});

app.use('/api/telemedicine/*', (req, res) => {
  const newPath = req.path.replace('/api/telemedicine', '/api/v1/telemedicine');
  res.redirect(301, newPath);
});

app.use('/api/marketplace/*', (req, res) => {
  const newPath = req.path.replace('/api/marketplace', '/api/v1/marketplace');
  res.redirect(301, newPath);
});

// Aplicar middlewares específicos por endpoint para rutas legacy (si las hay)
import { applyEndpointConfig } from './middleware';

// Endpoints de datos médicos (legacy - mantener si hay implementaciones)
app.use('/api/patients', applyEndpointConfig('medicalData'));
app.use('/api/medical-records', applyEndpointConfig('medicalData'));
app.use('/api/diagnoses', applyEndpointConfig('medicalData'));

// Endpoints de búsqueda (legacy - mantener si hay implementaciones)
app.use('/api/search', applyEndpointConfig('search'));

// Endpoints generales (legacy - mantener si hay implementaciones)
app.use('/api/general', applyEndpointConfig('general'));

// P1 Security: Import error handler
import { errorHandler, notFoundHandler } from './middleware/error-handler';

import { logger } from '@altamedica/shared';
// 404 handler - must be before error handler
app.use('*', notFoundHandler);

// P1 Security: Global error handler - must be last middleware
app.use(errorHandler);

function startServer(port: number, attemptsLeft = 2) {
  const server = app.listen(port, () => {
    logger.info(`🚀 API Server running on port ${port}`);
    logger.info(`🔒 Security middlewares applied`);
    logger.info(`📊 Health check: http://localhost:${port}/api/v1/health`);
    logger.info(`📍 Legacy health: http://localhost:${port}/health`);
  });

  server.on('error', (err: any) => {
    if (err && err.code === 'EADDRINUSE' && attemptsLeft > 0) {
      const nextPort = Number(port) + 1;
      logger.warn(
        `⚠️  Port ${port} in use. Retrying on ${nextPort} (remaining attempts: ${attemptsLeft})`,
      );
      setTimeout(() => startServer(nextPort, attemptsLeft - 1), 500);
    } else {
      logger.error('🚨 Server failed to start:', err);
      process.exit(1);
    }
  });
}

;(async () => {
  // Cargar secretos antes de iniciar el servidor (JWT, etc.)
  await initSecrets()
  startServer(Number(PORT))
})()

export default app;
