/**
import { logger } from '@altamedica/shared/services/logger.service';

 * 🏥 DEPRECATED - ApiService
 * 
 * ⚠️ Este archivo ha sido reemplazado por @altamedica/api-client
 * 
 * Para migrar tu código:
 * 
 * ANTES:
 * import { apiService } from './services.ts';
 * const data = await apiService.get('/endpoint');
 * 
 * DESPUÉS:
 * import { useApiClient } from '@altamedica/api-client';
 * const { data } = useQuery(['key'], () => apiClient.get('/endpoint'));
 */

export class DeprecatedApiService {
  constructor() {
    logger.warn('⚠️ ApiService está deprecated. Usar @altamedica/api-client');
  }
}

export const apiService = new DeprecatedApiService();
