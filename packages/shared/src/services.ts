/**
 * 📡 SHARED SERVICES - ALTAMEDICA
 */

export class BaseService {
  protected baseURL: string;
  
  constructor(baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') {
    this.baseURL = baseURL;
  }
  
  protected getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
    };
  }
}