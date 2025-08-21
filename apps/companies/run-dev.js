import { logger } from '@altamedica/shared/services/logger.service';

const { exec } = require('child_process');
const path = require('path');

// Change to the companies directory
process.chdir(path.join(__dirname));

logger.info('Starting development server for companies app...');
logger.info('Working directory:', process.cwd());

const child = exec('npm run dev', (error, stdout, stderr) => {
  if (error) {
    logger.error(`Error: ${error}`);
    return;
  }
});

child.stdout.on('data', (data) => {
  logger.info(data);
});

child.stderr.on('data', (data) => {
  logger.error(data);
});

child.on('close', (code) => {
  logger.info(`Development server exited with code ${code}`);
});

// Keep the process running
process.on('SIGINT', () => {
  logger.info('\nStopping development server...');
  child.kill();
  process.exit();
});