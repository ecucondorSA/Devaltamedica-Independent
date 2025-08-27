module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/',
        // Agrega aquí otras URLs que quieras auditar
      ],
      startServerCommand: 'pnpm --dir apps/web-app dev', // Comando para iniciar tu aplicación web
      startServerReadyPattern: 'ready in',
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories.performance': ['warn', { minScore: 0.9 }],
        'categories.accessibility': ['error', { minScore: 0.9 }],
        'categories.best-practices': ['warn', { minScore: 0.9 }],
        'categories.seo': ['warn', { minScore: 0.9 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
