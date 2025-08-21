// Middleware principal para el API Server de Altamedica
import { NextFunction, Request, Response } from 'express';
import { initializeSecurityMiddlewares } from './security.middleware';

import { logger } from '@altamedica/shared/services/logger.service';
// Middleware simple de placeholder
const simpleAuth = (req: Request, res: Response, next: NextFunction) => {
  // TODO: Implement proper auth
  next();
};

const simpleRateLimit = (req: Request, res: Response, next: NextFunction) => {
  // TODO: Implement rate limiting
  next();
};

// Configuración de middlewares por tipo de endpoint
export const endpointConfigs = {
  // Endpoints de autenticación
  auth: [simpleAuth],

  // Endpoints de datos médicos críticos
  medicalData: [simpleAuth],

  // Endpoints de telemedicina
  telemedicine: [simpleAuth],

  // Endpoints de creación de recursos
  createResource: [simpleAuth],

  // Endpoints de búsqueda
  search: [simpleAuth],

  // Endpoints de marketplace
  marketplace: [simpleAuth],

  // Endpoints generales
  general: [simpleRateLimit],
};

// Middleware para aplicar configuración según el tipo de endpoint
export const applyEndpointConfig = (endpointType: keyof typeof endpointConfigs) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const middlewares = endpointConfigs[endpointType];

    // Aplicar middlewares en secuencia
    const applyMiddleware = (index: number) => {
      if (index >= middlewares.length) {
        return next();
      }

      const middleware = middlewares[index];
      middleware(req, res, (err?: any) => {
        if (err) {
          return next(err);
        }
        applyMiddleware(index + 1);
      });
    };

    applyMiddleware(0);
  };
};

// Función para inicializar todos los middlewares
export const initializeMiddlewares = (app: any, encryptionKey: string) => {
  // Seguridad de producción (CORS, rate limit, headers, audit)
  try {
    initializeSecurityMiddlewares(app);
    logger.info('✅ Middlewares de seguridad inicializados correctamente');
  } catch (err) {
    logger.error('🚨 Error inicializando middlewares de seguridad', err);
    throw err;
  }
};

export default {
  endpointConfigs,
  applyEndpointConfig,
  initializeMiddlewares,
};
