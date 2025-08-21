import { buildAppMiddleware, middlewareConfig } from '@altamedica/auth/app-middleware-factory';

export const middleware = buildAppMiddleware({ app: 'admin' });
export const config = middlewareConfig;

