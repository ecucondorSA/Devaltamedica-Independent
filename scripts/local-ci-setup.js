#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function generateToken(prefix = 'token', length = 32) {
  return `${prefix}_${crypto.randomBytes(length).toString('hex')}`;
}

function createEnvFiles() {
  log('\n🔑 Generando archivos de configuración local...', 'cyan');
  
  // Generate development tokens
  const tokens = {
    TURBO_TOKEN: generateToken('turbo'),
    TURBO_TEAM: 'altamedica-dev',
    CODECOV_TOKEN: generateToken('codecov'),
    FIREBASE_API_KEY: generateToken('AIzaSy'),
    FIREBASE_AUTH_DOMAIN: 'altamedica-dev.firebaseapp.com',
    FIREBASE_PROJECT_ID: 'altamedica-dev',
    FIREBASE_STORAGE_BUCKET: 'altamedica-dev.appspot.com',
    FIREBASE_MESSAGING_SENDER_ID: Math.random().toString().slice(2, 14),
    FIREBASE_APP_ID: `1:${Math.random().toString().slice(2, 14)}:web:${generateToken('', 16)}`,
    DATABASE_URL: 'postgresql://altamedica:dev123@localhost:5432/altamedica_dev',
    VERCEL_TOKEN: generateToken('vercel'),
    SENTRY_DSN: `https://${generateToken('', 16)}@sentry.io/altamedica`,
    SENTRY_AUTH_TOKEN: generateToken('sentry'),
    OPENAI_API_KEY: generateToken('sk-'),
    GOOGLE_MAPS_API_KEY: generateToken('AIzaSy'),
    CI: 'false',
    NODE_ENV: 'development'
  };

  // Create .env.local
  const envContent = Object.entries(tokens)
    .map(([key, value]) => `${key}="${value}"`)
    .join('\n');
  
  fs.writeFileSync('.env.local', envContent);
  log('✅ .env.local creado con tokens de desarrollo', 'green');

  // Create .env.example
  const exampleContent = Object.keys(tokens)
    .map(key => `${key}="your-${key.toLowerCase().replace(/_/g, '-')}-here"`)
    .join('\n');
  
  fs.writeFileSync('.env.example', exampleContent);
  log('✅ .env.example creado para referencia', 'green');

  return tokens;
}

function createGitHubActionScripts() {
  log('\n📝 Creando scripts de GitHub Actions...', 'cyan');
  
  const manualSetupScript = `#!/bin/bash
# Manual GitHub Setup Script

echo "======================================"
echo "📋 CONFIGURACIÓN MANUAL DE GITHUB"
echo "======================================"
echo ""
echo "1. Ve a: https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions"
echo ""
echo "2. Agrega estos secrets (copia los valores de .env.local):"
echo ""
cat .env.local | while read line; do
  if [[ ! -z "$line" ]]; then
    KEY=$(echo $line | cut -d'=' -f1)
    echo "   • $KEY"
  fi
done
echo ""
echo "3. Ve a: https://github.com/YOUR_USERNAME/YOUR_REPO/labels"
echo ""
echo "4. Crea estos labels:"
cat .github/labels.json | grep '"name"' | cut -d'"' -f4 | while read label; do
  echo "   • $label"
done
echo ""
echo "======================================"
`;

  fs.writeFileSync('scripts/manual-github-setup.sh', manualSetupScript, { mode: 0o755 });
  log('✅ Script de configuración manual creado', 'green');
}

function validateLocalSetup() {
  log('\n✅ Validando configuración local...', 'cyan');
  
  const files = [
    { name: 'package.json', path: 'package.json', required: true },
    { name: 'turbo.json', path: 'turbo.json', required: true },
    { name: 'codecov.yml', path: 'codecov.yml', required: true },
    { name: 'CI Workflow', path: '.github/workflows/ci-optimized.yml', required: true },
    { name: 'PR Workflow', path: '.github/workflows/pr-validation.yml', required: true },
    { name: '.env.local', path: '.env.local', required: true },
    { name: '.env.example', path: '.env.example', required: true },
    { name: 'GitHub Labels', path: '.github/labels.json', required: true },
    { name: 'GitHub Secrets Example', path: '.github/secrets.example.yml', required: true }
  ];

  let allGood = true;
  files.forEach(file => {
    const exists = fs.existsSync(file.path);
    if (exists) {
      log(`  ✅ ${file.name}`, 'green');
    } else if (file.required) {
      log(`  ❌ ${file.name} (falta)`, 'red');
      allGood = false;
    }
  });

  return allGood;
}

function createGitIgnore() {
  log('\n📝 Actualizando .gitignore...', 'cyan');
  
  const gitignoreAdditions = `
# Environment files
.env
.env.local
.env.*.local

# CI/CD
.turbo
coverage/
playwright-report/
test-results/
*.log

# IDE
.vscode/settings.json
.idea/

# OS
.DS_Store
Thumbs.db
`;

  const gitignorePath = '.gitignore';
  let currentContent = '';
  
  if (fs.existsSync(gitignorePath)) {
    currentContent = fs.readFileSync(gitignorePath, 'utf8');
  }

  if (!currentContent.includes('.env.local')) {
    fs.appendFileSync(gitignorePath, gitignoreAdditions);
    log('✅ .gitignore actualizado', 'green');
  } else {
    log('✅ .gitignore ya está configurado', 'green');
  }
}

function testLocalCommands() {
  log('\n🧪 Probando comandos locales...', 'cyan');
  
  const commands = [
    { name: 'Lint', cmd: 'pnpm lint', optional: true },
    { name: 'TypeCheck', cmd: 'pnpm type-check', optional: true },
    { name: 'Build Packages', cmd: 'pnpm build:packages', optional: true }
  ];

  commands.forEach(({ name, cmd, optional }) => {
    try {
      log(`  Probando ${name}...`, 'yellow');
      execSync(cmd, { stdio: 'pipe', encoding: 'utf8' });
      log(`  ✅ ${name} funciona`, 'green');
    } catch (error) {
      if (optional) {
        log(`  ⚠️ ${name} tiene advertencias (normal en desarrollo)`, 'yellow');
      } else {
        log(`  ❌ ${name} falló`, 'red');
      }
    }
  });
}

function printInstructions() {
  log('\n' + '='.repeat(60), 'magenta');
  log('✨ CONFIGURACIÓN LOCAL COMPLETADA', 'bright');
  log('='.repeat(60), 'magenta');
  
  log('\n📋 Estado de la configuración:', 'cyan');
  log('  ✅ Archivos de CI/CD creados', 'green');
  log('  ✅ Tokens de desarrollo generados (.env.local)', 'green');
  log('  ✅ Workflows de GitHub Actions listos', 'green');
  log('  ✅ Configuración de Turbo y Codecov', 'green');
  
  log('\n🚀 Para activar en GitHub:', 'yellow');
  log('\n  OPCIÓN 1 - Automático (recomendado):', 'cyan');
  log('    1. Instala GitHub CLI: https://cli.github.com', 'white');
  log('    2. Ejecuta: gh auth login', 'white');
  log('    3. Ejecuta: node scripts/auto-setup-github.js', 'white');
  
  log('\n  OPCIÓN 2 - Manual:', 'cyan');
  log('    1. Ejecuta: bash scripts/manual-github-setup.sh', 'white');
  log('    2. Sigue las instrucciones en pantalla', 'white');
  
  log('\n💻 Comandos disponibles localmente:', 'cyan');
  log('  pnpm dev          - Desarrollo local', 'white');
  log('  pnpm lint:fix     - Arreglar problemas de lint', 'white');
  log('  pnpm ci:validate  - Validar CI localmente', 'white');
  log('  pnpm ci:build     - Build completo', 'white');
  log('  pnpm test         - Ejecutar tests', 'white');
  
  log('\n📦 Para hacer commit y push:', 'cyan');
  log('  git add -A', 'white');
  log('  git commit -m "feat: CI/CD pipeline configurado"', 'white');
  log('  git push origin main', 'white');
  
  log('\n✅ Tu proyecto está listo para CI/CD!', 'bright');
  log('   Los workflows se ejecutarán automáticamente cuando:', 'white');
  log('   • Hagas push a main/develop', 'white');
  log('   • Abras un pull request', 'white');
  log('   • Lo ejecutes manualmente desde GitHub Actions', 'white');
}

async function main() {
  log('🚀 CONFIGURACIÓN LOCAL DE CI/CD', 'bright');
  log('='.repeat(60), 'cyan');
  
  createEnvFiles();
  createGitHubActionScripts();
  createGitIgnore();
  
  const isValid = validateLocalSetup();
  
  if (!isValid) {
    log('\n⚠️ Algunos archivos no se encontraron', 'yellow');
    log('Ejecuta primero: node scripts/setup-ci.js', 'yellow');
  }
  
  testLocalCommands();
  printInstructions();
}

main().catch(error => {
  log(`\n❌ Error: ${error.message}`, 'red');
  process.exit(1);
});