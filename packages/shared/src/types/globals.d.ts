declare global {
  const logger: {
    info: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
    debug: (...args: any[]) => void;
    fatal: (...args: any[]) => void;
    startTimer: () => () => void;
  };
}

export {};