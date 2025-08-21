#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function execCommand(command, silent = false) {
  try {
    const result = execSync(command, { 
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit'
    });
    return result;
  } catch (error) {
    if (!silent) {
      log(`Error ejecutando: ${command}`, 'red');
      log(error.message, 'red');
    }
    return null;
  }
}

function checkPrerequisites() {
  log('\n📋 Verificando prerequisitos...', 'cyan');
  
  const nodeVersion = execCommand('node --version', true);
  if (!nodeVersion) {
    log('❌ Node.js no está instalado', 'red');
    process.exit(1);
  }
  log(`✅ Node.js ${nodeVersion.trim()}`, 'green');
  
  const pnpmVersion = execCommand('pnpm --version', true);
  if (!pnpmVersion) {
    log('❌ pnpm no está instalado. Instalando...', 'yellow');
    execCommand('npm install -g pnpm@8.15.6');
  } else {
    log(`✅ pnpm ${pnpmVersion.trim()}`, 'green');
  }
  
  const gitVersion = execCommand('git --version', true);
  if (!gitVersion) {
    log('❌ Git no está instalado', 'red');
    process.exit(1);
  }
  log(`✅ Git ${gitVersion.trim()}`, 'green');
}

function setupGitHubSecrets() {
  log('\n🔐 Configurando GitHub Secrets...', 'cyan');
  
  const secretsFile = path.join(process.cwd(), '.github', 'secrets.example.yml');
  const secretsContent = `# GitHub Secrets Configuration
# Copia este archivo a tu configuración de GitHub Secrets

# Turbo Remote Cache
TURBO_TOKEN: "your-turbo-token-here"
TURBO_TEAM: "your-turbo-team-here"

# Code Coverage
CODECOV_TOKEN: "your-codecov-token-here"

# Firebase (Production)
FIREBASE_API_KEY: "your-firebase-api-key"
FIREBASE_AUTH_DOMAIN: "your-firebase-auth-domain"
FIREBASE_PROJECT_ID: "your-firebase-project-id"
FIREBASE_STORAGE_BUCKET: "your-firebase-storage-bucket"
FIREBASE_MESSAGING_SENDER_ID: "your-firebase-messaging-sender-id"
FIREBASE_APP_ID: "your-firebase-app-id"
FIREBASE_SERVICE_ACCOUNT: "base64-encoded-service-account-json"

# Database
DATABASE_URL: "postgresql://user:password@localhost:5432/altamedica"

# Deployment
VERCEL_TOKEN: "your-vercel-token"
VERCEL_ORG_ID: "your-vercel-org-id"
VERCEL_PROJECT_ID: "your-vercel-project-id"

# Monitoring
SENTRY_DSN: "your-sentry-dsn"
SENTRY_AUTH_TOKEN: "your-sentry-auth-token"

# Medical APIs (Optional)
OPENAI_API_KEY: "your-openai-api-key"
GOOGLE_MAPS_API_KEY: "your-google-maps-api-key"`;

  fs.mkdirSync(path.dirname(secretsFile), { recursive: true });
  fs.writeFileSync(secretsFile, secretsContent);
  log('✅ Archivo de ejemplo de secrets creado: .github/secrets.example.yml', 'green');
}

function setupGitHubLabels() {
  log('\n🏷️ Configurando GitHub Labels...', 'cyan');
  
  const labelsFile = path.join(process.cwd(), '.github', 'labels.json');
  const labels = [
    { name: 'size/XS', color: '00FF00', description: 'Cambios muy pequeños (<10 líneas)' },
    { name: 'size/S', color: '40FF00', description: 'Cambios pequeños (10-50 líneas)' },
    { name: 'size/M', color: 'FFFF00', description: 'Cambios medianos (50-200 líneas)' },
    { name: 'size/L', color: 'FF8000', description: 'Cambios grandes (200-500 líneas)' },
    { name: 'size/XL', color: 'FF0000', description: 'Cambios muy grandes (>500 líneas)' },
    { name: 'medical', color: '0052CC', description: 'Funcionalidad médica' },
    { name: 'hipaa', color: '7B68EE', description: 'Relacionado con HIPAA compliance' },
    { name: 'security', color: 'D73A49', description: 'Seguridad y autenticación' },
    { name: 'performance', color: 'F9D71C', description: 'Optimización de rendimiento' },
    { name: 'bug', color: 'B60205', description: 'Error o problema' },
    { name: 'enhancement', color: '84B6EB', description: 'Mejora o nueva funcionalidad' },
    { name: 'documentation', color: '0075CA', description: 'Documentación' },
    { name: 'testing', color: 'C5DEF5', description: 'Tests y cobertura' },
    { name: 'ci/cd', color: 'BFD4F2', description: 'Pipeline y automatización' },
    { name: 'dependencies', color: '0366D6', description: 'Actualización de dependencias' }
  ];

  fs.writeFileSync(labelsFile, JSON.stringify(labels, null, 2));
  log('✅ Archivo de labels creado: .github/labels.json', 'green');
}

function setupHusky() {
  log('\n🐺 Configurando Husky (Git Hooks)...', 'cyan');
  
  execCommand('pnpm add -D husky lint-staged -w', true);
  execCommand('npx husky install', true);
  
  const preCommitHook = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm lint-staged`;

  const prePushHook = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm type-check`;

  fs.mkdirSync('.husky', { recursive: true });
  fs.writeFileSync('.husky/pre-commit', preCommitHook, { mode: 0o755 });
  fs.writeFileSync('.husky/pre-push', prePushHook, { mode: 0o755 });
  
  log('✅ Husky configurado con hooks pre-commit y pre-push', 'green');
}

function installDependencies() {
  log('\n📦 Instalando dependencias...', 'cyan');
  execCommand('pnpm install');
  log('✅ Dependencias instaladas', 'green');
}

function validateSetup() {
  log('\n✅ Validando configuración...', 'cyan');
  
  const checks = [
    { name: 'package.json', path: 'package.json', required: true },
    { name: 'turbo.json', path: 'turbo.json', required: true },
    { name: 'codecov.yml', path: 'codecov.yml', required: true },
    { name: 'CI Workflow', path: '.github/workflows/ci-optimized.yml', required: true },
    { name: 'PR Workflow', path: '.github/workflows/pr-validation.yml', required: true },
    { name: 'pnpm-workspace.yaml', path: 'pnpm-workspace.yaml', required: true },
    { name: 'node_modules', path: 'node_modules', required: false },
    { name: '.husky', path: '.husky', required: false }
  ];

  let allGood = true;
  checks.forEach(check => {
    const exists = fs.existsSync(check.path);
    if (exists) {
      log(`  ✅ ${check.name}`, 'green');
    } else if (check.required) {
      log(`  ❌ ${check.name} (requerido)`, 'red');
      allGood = false;
    } else {
      log(`  ⚠️ ${check.name} (opcional)`, 'yellow');
    }
  });

  return allGood;
}

function printNextSteps() {
  log('\n' + '='.repeat(60), 'cyan');
  log('🎉 CONFIGURACIÓN COMPLETADA', 'bright');
  log('='.repeat(60), 'cyan');
  
  log('\n📝 Próximos pasos:', 'yellow');
  log('1. Configurar secrets en GitHub:', 'white');
  log('   - Ve a Settings > Secrets and variables > Actions', 'white');
  log('   - Agrega los secrets del archivo .github/secrets.example.yml', 'white');
  
  log('\n2. Configurar labels en GitHub:', 'white');
  log('   - Ejecuta: node scripts/create-github-labels.js', 'white');
  
  log('\n3. Habilitar Codecov:', 'white');
  log('   - Ve a https://codecov.io y conecta tu repositorio', 'white');
  log('   - Copia el token y agrégalo como CODECOV_TOKEN en GitHub Secrets', 'white');
  
  log('\n4. Configurar Turbo Remote Cache (opcional):', 'white');
  log('   - Ve a https://turbo.build/repo', 'white');
  log('   - Crea una cuenta y obtén tu token', 'white');
  log('   - Agrega TURBO_TOKEN y TURBO_TEAM en GitHub Secrets', 'white');
  
  log('\n5. Probar el pipeline:', 'white');
  log('   - pnpm ci:validate  # Validación local', 'white');
  log('   - pnpm ci:build     # Build completo', 'white');
  log('   - pnpm ci:test      # Todos los tests', 'white');
  
  log('\n✨ Tu CI/CD está listo para usar!', 'green');
  log('   Los workflows se ejecutarán automáticamente en:', 'white');
  log('   - Push a main/develop', 'white');
  log('   - Pull requests', 'white');
  log('   - Manualmente desde GitHub Actions', 'white');
}

async function main() {
  log('🚀 SETUP AUTOMÁTICO DE CI/CD PARA ALTAMEDICA', 'bright');
  log('='.repeat(60), 'cyan');

  checkPrerequisites();
  setupGitHubSecrets();
  setupGitHubLabels();
  setupHusky();
  installDependencies();
  
  const isValid = validateSetup();
  if (!isValid) {
    log('\n⚠️ Algunos archivos requeridos no se encontraron', 'yellow');
    log('Por favor, verifica la configuración manualmente', 'yellow');
  }
  
  printNextSteps();
}

main().catch(error => {
  log(`\n❌ Error durante el setup: ${error.message}`, 'red');
  process.exit(1);
});