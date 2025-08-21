declare module '@altamedica/api-client' {
  export interface ApiClient {
    get: (url: string, config?: any) => Promise<{ data: any }>;
    post: (url: string, data?: any, config?: any) => Promise<{ data: any }>;
    put: (url: string, data?: any, config?: any) => Promise<{ data: any }>;
    delete?: (url: string, config?: any) => Promise<{ data: any }>;
  }

  export function createApiClient(config: { baseURL: string }): ApiClient;
  export function getApiClient(): ApiClient;
}
