export const logger = {
  info: (message: string, data?: any) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.log(`[INFO] ${message}`, data || '');
    }
  },
  
  warn: (message: string, data?: any) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.warn(`[WARN] ${message}`, data || '');
    }
  },
  
  error: (message: string, data?: any) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.error(`[ERROR] ${message}`, data || '');
    }
  },
  
  debug: (message: string, data?: any) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production' && process.env.DEBUG) {
      console.log(`[DEBUG] ${message}`, data || '');
    }
  }
};

export default logger;