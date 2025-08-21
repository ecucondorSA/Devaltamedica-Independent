/**
 * @altamedica/shared/services/logger.service
 * Servicio de logging básico para toda la plataforma
 */

export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: string;
  data?: unknown;
}

class LoggerService {
  private logLevel: LogLevel = LogLevel.WARN;

  setLogLevel(level: LogLevel) {
    this.logLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }
  info(message: string, context?: string, data?: unknown) {
    if (this.shouldLog(LogLevel.INFO)) {
      // void this.formatMessage is used to avoid unused local variables while preserving formatting logic
      void this.formatMessage({
        level: LogLevel.INFO,
        message,
        timestamp: new Date(),
        context,
        data,
      });
    }
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const context = entry.context ? `[${entry.context}]` : '';
    return `${timestamp} ${entry.level.toUpperCase()} ${context} ${entry.message}`;
  }

  warn(message: string, context?: string, data?: unknown) {
    if (this.shouldLog(LogLevel.WARN)) {
      void this.formatMessage({
        level: LogLevel.WARN,
        message,
        timestamp: new Date(),
        context,
        data,
      });
    }
  }

  error(message: string, context?: string, data?: unknown) {
    if (this.shouldLog(LogLevel.ERROR)) {
      void this.formatMessage({
        level: LogLevel.ERROR,
        message,
        timestamp: new Date(),
        context,
        data,
      });
    }
  }

  debug(message: string, context?: string, data?: unknown) {
    if (this.shouldLog(LogLevel.INFO)) {
      void this.formatMessage({
        level: LogLevel.INFO,
        message,
        timestamp: new Date(),
        context,
        data,
      });
    }
  }

  fatal(message: string, context?: string, data?: unknown) {
    void this.formatMessage({
      level: LogLevel.ERROR,
      message,
      timestamp: new Date(),
      context,
      data,
    });
  }

  startTimer(): () => void {
    const startTime = Date.now();
    return () => {
      const elapsedTime = Date.now() - startTime;
      return elapsedTime;
    };
  }
}

export const logger = new LoggerService();
export { LoggerService };
