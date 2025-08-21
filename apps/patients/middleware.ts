import { buildAppMiddleware, middlewareConfig } from '@altamedica/auth/app-middleware-factory';

export const middleware = buildAppMiddleware({ app: 'patients' });
export const config = middlewareConfig;

