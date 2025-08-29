export const logger = {
  info: (message: string, data?: any) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log(`[INFO] ${message}`, data || '');
    }
  },
  
  warn: (message: string, data?: any) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(`[WARN] ${message}`, data || '');
    }
  },
  
  error: (message: string, data?: any) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error(`[ERROR] ${message}`, data || '');
    }
  },
  
  debug: (message: string, data?: any) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production' && process.env.DEBUG) {
      // eslint-disable-next-line no-console
      console.log(`[DEBUG] ${message}`, data || '');
    }
  }
};

export default logger;