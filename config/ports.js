/**
 * Configuración de puertos para el monorepo Altamedica
 * Este archivo se genera automáticamente por el script update-ports.js
 */

export const PORTS = {
  "web-app": 3000,
  "api-server": 3001,
  "patients": 3003,
  "doctors": 3002,
  "companies": 3004,
  "medical": 3005,
  "admin": 3006,
  "development": 3007,
  "anthropic-simulator": 3008
};

export const getAppUrl = (appName) => {
  const port = PORTS[appName];
  return port ? `http://localhost:${port}` : null;
};

export const getApiUrl = () => getAppUrl('api-server');

export default PORTS;
