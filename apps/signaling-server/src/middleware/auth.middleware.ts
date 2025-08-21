import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { serverConfig } from '../config/server.config.js';

import { logger } from '@altamedica/shared/services/logger.service';
// TODO: Definir este tipo en @altamedica/types
interface User {
  id: string;
  email: string;
  role: string;
  [key: string]: any;
}

export interface AuthRequest extends Request {
  user?: User;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        code: 'NO_TOKEN',
      });
    }

    const decoded = jwt.verify(token, serverConfig.jwt.secret) as User;
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Authentication error:', undefined, error);
    return res.status(403).json({
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN',
    });
  }
};

export const authenticateSocketToken = async (token: string): Promise<User | null> => {
  try {
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, serverConfig.jwt.secret) as User;
    return decoded;
  } catch (error) {
    logger.error('Socket authentication error:', undefined, error);
    return null;
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void | Response => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'NO_AUTH',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'FORBIDDEN',
      });
    }

    return next();
  };
};
