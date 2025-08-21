/**
 * Simple logger for Firebase package
 * Wraps console methods to avoid external dependencies during build
 */
export const logger = {
  info: (...args: any[]) => console.log(...args),
  warn: (...args: any[]) => console.warn(...args),
  error: (...args: any[]) => console.error(...args),
  debug: (...args: any[]) => console.debug(...args),
  fatal: (...args: any[]) => console.error('[FATAL]', ...args),
  startTimer: () => {
    const start = Date.now();
    return () => Date.now() - start;
  }
};