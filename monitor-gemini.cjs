#!/usr/bin/env node
/**
 * Monitor en Tiempo Real para Colaboración Claude-Gemini
 * Detecta cambios de archivos y muestra qué está trabajando cada AI
 */

const fs = require('fs');
const { execSync } = require('child_process');
const chokidar = require('chokidar');

console.log('🤖 Monitor Claude-Gemini Collaboration');
console.log('=====================================\n');

let lastGitStatus = '';
let lastModified = new Map();

// Función para obtener archivos modificados
const getGitStatus = () => {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    return status;
  } catch (error) {
    return '';
  }
};

// Función para detectar cambios
const detectChanges = () => {
  const currentStatus = getGitStatus();
  
  if (currentStatus !== lastGitStatus) {
    console.log('\n🔄 CAMBIOS DETECTADOS:');
    console.log('====================');
    
    const lines = currentStatus.split('\n').filter(line => line.trim());
    lines.forEach(line => {
      const [status, file] = [line.substring(0, 2), line.substring(3)];
      const timestamp = new Date().toLocaleTimeString();
      
      let action = 'Modified';
      if (status.includes('A')) action = 'Added';
      if (status.includes('D')) action = 'Deleted';
      if (status.includes('??')) action = 'Untracked';
      
      // Detectar quién posiblemente esté trabajando en el archivo
      let aiWorker = '❓ Unknown';
      if (file.includes('patients/') || file.includes('@altamedica/ui')) {
        aiWorker = '🤖 Claude (export fixes)';
      } else if (file.includes('companies/') || file.includes('marketplace')) {
        aiWorker = '💎 Gemini (marketplace work)';
      }
      
      console.log(`  [${timestamp}] ${action}: ${file}`);
      console.log(`  Worker: ${aiWorker}\n`);
    });
    
    lastGitStatus = currentStatus;
  }
};

// Función para mostrar estado actual
const showCurrentState = () => {
  console.log('\n📊 ESTADO ACTUAL DEL PROYECTO:');
  console.log('==============================');
  
  const status = getGitStatus();
  const lines = status.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    console.log('✅ No hay cambios pendientes');
    return;
  }
  
  const categories = {
    patients: [],
    companies: [],
    packages: [],
    other: []
  };
  
  lines.forEach(line => {
    const file = line.substring(3);
    if (file.includes('patients/')) categories.patients.push(file);
    else if (file.includes('companies/')) categories.companies.push(file);
    else if (file.includes('packages/')) categories.packages.push(file);
    else categories.other.push(file);
  });
  
  if (categories.patients.length > 0) {
    console.log('\n🤖 Claude - Patients App & UI Fixes:');
    categories.patients.forEach(f => console.log(`  - ${f}`));
  }
  
  if (categories.companies.length > 0) {
    console.log('\n💎 Gemini - Companies App & Marketplace:');
    categories.companies.forEach(f => console.log(`  - ${f}`));
  }
  
  if (categories.packages.length > 0) {
    console.log('\n📦 Shared - Package Modifications:');
    categories.packages.forEach(f => console.log(`  - ${f}`));
  }
  
  if (categories.other.length > 0) {
    console.log('\n🔧 Other Changes:');
    categories.other.forEach(f => console.log(`  - ${f}`));
  }
};

// Función para sugerir sincronización
const suggestSync = () => {
  const status = getGitStatus();
  const lines = status.split('\n').filter(line => line.trim());
  
  if (lines.length > 20) {
    console.log('\n⚠️  SUGGESTION: Too many changes detected!');
    console.log('   Consider committing current work to avoid conflicts');
    console.log('   Run: git add . && git commit -m "WIP: AI collaborative work"');
  }
};

// Mostrar estado inicial
showCurrentState();

// Monitor de cambios cada 5 segundos
console.log('\n👁️  Monitoring changes every 5 seconds...');
console.log('Press Ctrl+C to stop\n');

setInterval(() => {
  detectChanges();
  suggestSync();
}, 5000);

// Cleanup al salir
process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping monitor...');
  showCurrentState();
  console.log('\n✅ Monitor stopped. Happy coding! 🤖💎');
  process.exit(0);
});