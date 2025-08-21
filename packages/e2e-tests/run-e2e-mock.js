import { logger } from '@altamedica/shared/services/logger.service';

#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Set environment variables for mock testing
process.env.E2E_USE_MOCK_LOGIN = '1';
process.env.NODE_ENV = 'test';

logger.info('🧪 Running E2E tests with mock login enabled...\n');
logger.info('Environment:');
logger.info('  E2E_USE_MOCK_LOGIN:', process.env.E2E_USE_MOCK_LOGIN);
logger.info('  NODE_ENV:', process.env.NODE_ENV);
logger.info('');

// Run only tests that work without services
const testFiles = [
  'tests/webapp-smoke.spec.ts',  // Basic web app tests
  'tests/helpers/auth.spec.ts',  // Auth helper tests if exists
];

// Filter to only existing test files
const args = [
  'test',
  '--',
  '--reporter=list',
  '--timeout=30000',
  '--workers=1',  // Use single worker to avoid memory issues
  ...testFiles
];

logger.info('Running command: npm', args.join(' '), '\n');

const test = spawn('npm', args, {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true,
  env: process.env
});

test.on('close', (code) => {
  logger.info(`\nTests completed with exit code ${code}`);
  process.exit(code);
});

test.on('error', (err) => {
  logger.error('Failed to start test process:', err);
  process.exit(1);
});