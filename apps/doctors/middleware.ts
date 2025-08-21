import { buildAppMiddleware, middlewareConfig } from '@altamedica/auth/app-middleware-factory';

export const middleware = buildAppMiddleware({ app: 'doctors' });
export const config = middlewareConfig;

