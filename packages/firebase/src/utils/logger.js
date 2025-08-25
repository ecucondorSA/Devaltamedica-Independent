/**
 * Simple logger for Firebase package
 * Wraps console methods to avoid external dependencies during build
 */
export const logger = {
    info: (...args) => console.log(...args),
    warn: (...args) => console.warn(...args),
    error: (...args) => console.error(...args),
    debug: (...args) => console.debug(...args),
    fatal: (...args) => console.error('[FATAL]', ...args),
    startTimer: () => {
        const start = Date.now();
        return () => Date.now() - start;
    }
};
