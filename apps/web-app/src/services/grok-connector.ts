import { logger } from '@altamedica/shared/services/logger.service';

export interface GrokMessage {
  id: string;
  content: string;
  timestamp: Date;
  role: 'user' | 'assistant';
}

export interface GrokConnectionStatus {
  isConnected: boolean;
  isAuthenticated: boolean;
  lastError?: string;
}

export interface GrokCredentials {
  email?: string;
  password?: string;
}

export class GrokService {
  private isConnected: boolean = false;
  private isAuthenticated: boolean = false;
  private lastError: string | null = null;
  private apiUrl: string = '/api/grok'; // API local (simulación)
  private serverUrl: string = 'http://localhost:3001'; // Servidor backend real
  private useRealServer: boolean = false; // Cambiar a true para usar servidor real

  async connect(credentials?: GrokCredentials): Promise<boolean> {
    try {
      logger.info('🚀 Conectando a Grok...');
      
      if (this.useRealServer) {
        // Conectar al servidor backend real
        return await this.connectToRealServer(credentials);
      } else {
        // Usar API local (simulación)
        return await this.connectToLocalAPI();
      }
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : 'Error desconocido';
      logger.error('❌ Error conectando a Grok:', this.lastError);
      return false;
    }
  }

  private async connectToRealServer(credentials?: GrokCredentials): Promise<boolean> {
    try {
      const response = await fetch(`${this.serverUrl}/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credentials }),
      });

      const data = await response.json();
      
      if (data.success) {
        this.isConnected = true;
        this.isAuthenticated = data.authenticated || false;
        this.lastError = null;
        
        logger.info(`✅ ${data.message}`);
        return true;
      } else {
        this.lastError = data.message;
        logger.error('❌ Error conectando a servidor real:', data.message);
        return false;
      }
    } catch (error) {
      throw new Error(`No se pudo conectar al servidor backend: ${error}`);
    }
  }

  private async connectToLocalAPI(): Promise<boolean> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'connect' }),
    });

    const data = await response.json();
    
    if (data.success) {
      this.isConnected = true;
      this.isAuthenticated = data.isAuthenticated || false;
      this.lastError = null;
      
      logger.info(`✅ ${data.message}`);
      return true;
    } else {
      this.lastError = data.message;
      logger.error('❌ Error conectando a Grok:', data.message);
      return false;
    }
  }

  async sendMessage(message: string): Promise<string> {
    if (!this.isConnected) {
      throw new Error('No conectado a Grok. Llama a connect() primero.');
    }

    try {
      logger.info('📤 Enviando mensaje a Grok...');
      
      if (this.useRealServer) {
        // Enviar al servidor backend real
        return await this.sendToRealServer(message);
      } else {
        // Usar API local (simulación)
        return await this.sendToLocalAPI(message);
      }
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : 'Error enviando mensaje';
      logger.error('❌ Error enviando mensaje a Grok:', this.lastError);
      throw error;
    }
  }

  private async sendToRealServer(message: string): Promise<string> {
    const response = await fetch(`${this.serverUrl}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    const data = await response.json();
    
    if (data.success) {
      this.lastError = null;
      return data.response;
    } else {
      throw new Error(data.message);
    }
  }

  private async sendToLocalAPI(message: string): Promise<string> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        action: 'send_message',
        message 
      }),
    });

    const data = await response.json();
    
    if (data.success) {
      this.lastError = null;
      return data.response;
    } else {
      throw new Error(data.message);
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.useRealServer) {
        await fetch(`${this.serverUrl}/disconnect`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } else {
        await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'disconnect' }),
        });
      }
      
      this.isConnected = false;
      this.isAuthenticated = false;
      this.lastError = null;
      logger.info('🔌 Desconectado de Grok');
    } catch (error) {
      logger.error('❌ Error desconectando de Grok:', error);
    }
  }

  getConnectionStatus(): GrokConnectionStatus {
    return {
      isConnected: this.isConnected,
      isAuthenticated: this.isAuthenticated,
      lastError: this.lastError || undefined
    };
  }

  isReady(): boolean {
    return this.isConnected;
  }

  // Método para cambiar entre servidor real y simulación
  setUseRealServer(useReal: boolean): void {
    this.useRealServer = useReal;
    logger.info(`🔄 Cambiado a ${useReal ? 'servidor real' : 'simulación'}`);
  }

  // Método para testing
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.isConnected) {
        const connected = await this.connect();
        if (!connected) {
          return { success: false, message: 'No se pudo conectar a Grok' };
        }
      }

      // Enviar mensaje de prueba
      const response = await this.sendMessage('Hola, esto es una prueba de conexión.');
      
      if (response && response.length > 0) {
        return { 
          success: true, 
          message: `Conexión exitosa. Respuesta recibida: ${response.substring(0, 100)}...` 
        };
      } else {
        return { success: false, message: 'No se recibió respuesta de Grok' };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Error en prueba de conexión: ${error}` 
      };
    }
  }
}

// Instancia singleton
export const grokService = new GrokService(); 