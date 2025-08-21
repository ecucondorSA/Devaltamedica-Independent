// check-tailwind-config.js
import { logger } from '@altamedica/shared/services/logger.service';

const fs = require('fs');
const path = require('path');

const configs = [
    { file: 'postcss.config.js', mustInclude: 'tailwindcss' },
    { file: 'tailwind.config.js', mustInclude: 'module.exports' }
];

const IGNORED_DIRS = [
    'node_modules', '.git', '.next', 'dist', 'out', 'coverage', '.turbo', '.vscode', 'public', 'build', 'tmp', 'temp'
];

function checkConfig(dir) {
    configs.forEach(cfg => {
        const file = path.join(dir, cfg.file);
        if (fs.existsSync(file)) {
            const content = fs.readFileSync(file, 'utf8');
            if (!content.includes(cfg.mustInclude)) {
                logger.info(`[ERROR] Falta "${cfg.mustInclude}" en ${file}`);
            }
        }
    });
}

function walk(dir) {
    fs.readdirSync(dir).forEach(f => {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) {
            if (!IGNORED_DIRS.includes(f)) {
                walk(full);
            }
        } else if (configs.some(cfg => f === cfg.file)) {
            checkConfig(dir);
        }
    });
}

walk(process.cwd());
logger.info('✅ Verificación de configuración de Tailwind/PostCSS finalizada.'); 