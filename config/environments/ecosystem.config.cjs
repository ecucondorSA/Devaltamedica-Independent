module.exports = {
  apps: [
    // ====================================================================
    //                          AGENTES PRINCIPALES
    // ====================================================================
    {
      name: 'orchestrator-agent',
      script: './agents/src/orchestrator-agent/index.ts',
      exec_interpreter: 'ts-node',
      instances: 1,
      autorestart: true,
      watch: ['agents/src/orchestrator-agent'],
      max_memory_restart: '256M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      env: {
        NODE_ENV: 'development',
      },
    },

    // ====================================================================
    //                          SUB-AGENTES ESPECIALIZADOS
    // ====================================================================
    {
      name: 'code-quality-agent',
      script: './agents/src/code-quality-agent/index.ts',
      exec_interpreter: 'ts-node',
      instances: 1,
      autorestart: true,
      watch: ['agents/src/code-quality-agent'],
      max_memory_restart: '256M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      env: {
        NODE_ENV: 'development',
      },
    },
    {
      name: 'testing-agent',
      script: './agents/src/testing-agent/index.ts',
      exec_interpreter: 'ts-node',
      instances: 1,
      autorestart: true,
      watch: ['agents/src/testing-agent'],
      max_memory_restart: '256M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      env: {
        NODE_ENV: 'development',
      },
    },
    {
      name: 'devops-agent',
      script: './agents/src/devops-agent/index.ts',
      exec_interpreter: 'ts-node',
      instances: 1,
      autorestart: true,
      watch: ['agents/src/devops-agent'],
      max_memory_restart: '256M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      env: {
        NODE_ENV: 'development',
      },
    },
    {
      name: 'database-agent',
      script: './agents/src/database-agent/index.ts',
      exec_interpreter: 'ts-node',
      instances: 1,
      autorestart: true,
      watch: ['agents/src/database-agent'],
      max_memory_restart: '256M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      env: {
        NODE_ENV: 'development',
      },
    },
    {
      name: 'security-agent',
      script: './agents/src/security-agent/index.ts',
      exec_interpreter: 'ts-node',
      instances: 1,
      autorestart: true,
      watch: ['agents/src/security-agent'],
      max_memory_restart: '256M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      env: {
        NODE_ENV: 'development',
      },
    },
    {
      name: 'docs-agent',
      script: './agents/src/docs-agent/index.ts',
      exec_interpreter: 'ts-node',
      instances: 1,
      autorestart: true,
      watch: ['agents/src/docs-agent'],
      max_memory_restart: '256M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      env: {
        NODE_ENV: 'development',
      },
    },
    {
      name: 'medical-ai-agent',
      script: './agents/src/medical-ai-agent/index.js',
      instances: 1,
      autorestart: true,
      watch: ['agents/src/medical-ai-agent'],
      max_memory_restart: '256M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      env: {
        NODE_ENV: 'development',
      },
    },
  ],
};
