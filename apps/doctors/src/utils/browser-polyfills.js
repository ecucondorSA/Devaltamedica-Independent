// Browser polyfills for Node.js modules
// These provide empty implementations for browser environments

if (typeof window !== 'undefined') {
  // Polyfill for process
  if (!window.process) {
    window.process = {
      env: {},
      version: '',
      versions: {},
      platform: 'browser',
      nextTick: (fn) => setTimeout(fn, 0),
      cwd: () => '/',
      chdir: () => {},
    };
  }

  // Ensure global is defined
  if (!window.global) {
    window.global = window;
  }
}

export {};