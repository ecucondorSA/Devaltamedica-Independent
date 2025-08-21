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

function checkGitHubCLI() {
  try {
    const version = execSync('gh --version', { encoding: 'utf8' });
    log(`✅ GitHub CLI encontrado: ${version.split('\n')[0]}`, 'green');
    return true;
  } catch {
    log('❌ GitHub CLI no está instalado', 'red');
    log('Por favor instala GitHub CLI:', 'yellow');
    log('  Windows: winget install GitHub.cli', 'white');
    log('  Mac: brew install gh', 'white');
    log('  Linux: https://github.com/cli/cli#installation', 'white');
    return false;
  }
}

function isAuthenticated() {
  try {
    execSync('gh auth status', { encoding: 'utf8', stdio: 'pipe' });
    log('✅ Autenticado con GitHub', 'green');
    return true;
  } catch {
    log('❌ No autenticado con GitHub', 'red');
    log('Ejecuta: gh auth login', 'yellow');
    return false;
  }
}

function getCurrentRepo() {
  try {
    const remote = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
    const match = remote.match(/github\.com[:/]([^/]+)\/([^.]+)/);
    if (match) {
      const repo = `${match[1]}/${match[2]}`;
      log(`📦 Repositorio detectado: ${repo}`, 'cyan');
      return repo;
    }
  } catch {
    log('⚠️ No se pudo detectar el repositorio', 'yellow');
  }
  return null;
}

function loadLabels() {
  const labelsFile = path.join(process.cwd(), '.github', 'labels.json');
  if (!fs.existsSync(labelsFile)) {
    log('❌ Archivo de labels no encontrado', 'red');
    log('Ejecuta primero: node scripts/setup-ci.js', 'yellow');
    process.exit(1);
  }
  
  const labels = JSON.parse(fs.readFileSync(labelsFile, 'utf8'));
  log(`📋 ${labels.length} labels cargados`, 'cyan');
  return labels;
}

async function createLabel(repo, label) {
  const command = `gh label create "${label.name}" --repo ${repo} --color "${label.color}" --description "${label.description}" --force`;
  
  try {
    execSync(command, { stdio: 'pipe' });
    log(`  ✅ ${label.name}`, 'green');
    return true;
  } catch (error) {
    if (error.message.includes('already exists')) {
      log(`  ⚠️ ${label.name} (ya existe, actualizando...)`, 'yellow');
      try {
        const updateCommand = `gh label edit "${label.name}" --repo ${repo} --color "${label.color}" --description "${label.description}"`;
        execSync(updateCommand, { stdio: 'pipe' });
        log(`  ✅ ${label.name} (actualizado)`, 'green');
        return true;
      } catch (updateError) {
        log(`  ❌ ${label.name}: ${updateError.message}`, 'red');
        return false;
      }
    } else {
      log(`  ❌ ${label.name}: ${error.message}`, 'red');
      return false;
    }
  }
}

async function main() {
  log('🏷️ CREADOR DE LABELS DE GITHUB', 'bright');
  log('='.repeat(60), 'cyan');

  if (!checkGitHubCLI()) {
    process.exit(1);
  }

  if (!isAuthenticated()) {
    process.exit(1);
  }

  const repo = getCurrentRepo();
  if (!repo) {
    log('Por favor especifica el repositorio manualmente:', 'yellow');
    log('  Ejemplo: owner/repo', 'white');
    process.exit(1);
  }

  const labels = loadLabels();
  
  log('\n🚀 Creando labels en GitHub...', 'cyan');
  
  let created = 0;
  let failed = 0;
  
  for (const label of labels) {
    const success = await createLabel(repo, label);
    if (success) created++;
    else failed++;
  }

  log('\n' + '='.repeat(60), 'cyan');
  log('📊 RESUMEN', 'bright');
  log('='.repeat(60), 'cyan');
  log(`✅ Labels creados/actualizados: ${created}`, 'green');
  if (failed > 0) {
    log(`❌ Labels fallidos: ${failed}`, 'red');
  }
  
  log('\n✨ Labels configurados exitosamente!', 'green');
  log('Puedes verlos en:', 'white');
  log(`  https://github.com/${repo}/labels`, 'blue');
}

main().catch(error => {
  log(`\n❌ Error: ${error.message}`, 'red');
  process.exit(1);
});