/**
 * @altamedica/shared
 * Servicios compartidos para toda la plataforma AltaMedica
 */

/// <reference path="./types/globals.d.ts" />

export * from './services/logger.service';
export { BaseAPIClient, buildQueryParams } from './api-client';
