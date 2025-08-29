module.exports = {
  env: {
    browser: true,
    node: true,
  },
  globals: {
    React: 'readonly',
    process: 'readonly',
    console: 'readonly',
    window: 'readonly',
    document: 'readonly',
    navigator: 'readonly',
    fetch: 'readonly',
    AbortController: 'readonly',
    setTimeout: 'readonly',
    clearTimeout: 'readonly',
    URLSearchParams: 'readonly',
    URL: 'readonly',
    FormData: 'readonly',
    SpeechSynthesisUtterance: 'readonly',
    alert: 'readonly',
    Blob: 'readonly',
    matchMedia: 'readonly',
  },
  overrides: [
    {
      files: ['*.js', '*.mjs', '*.cjs'],
      env: {
        node: true,
        browser: false,
      },
    },
  ],
};
