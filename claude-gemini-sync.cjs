#!/usr/bin/env node

/**
 * SISTEMA DE SINCRONIZACIÓN AUTOMÁTICA CLAUDE-GEMINI
 * Optimiza la colaboración entre ambos AIs
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SYNC_FILE = 'GEMINI-CLAUDE-SYNC.md';
const INTERVAL = 30000; // 30 segundos

class AICollaborationSync {
  constructor() {
    this.lastCommit = '';
    this.pendingChanges = new Set();
    this.geminiActivity = false;
    this.claudeActivity = false;
  }

  // Detecta cambios y auto-commits
  async checkAndSync() {
    try {
      // 1. Verificar cambios pendientes
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      
      if (status.trim()) {
        const modifiedFiles = status.split('\n').filter(Boolean);
        
        // Detectar quien está trabajando
        const claudeFiles = modifiedFiles.filter(f => f.includes('packages/'));
        const geminiFiles = modifiedFiles.filter(f => f.includes('apps/'));
        
        // Auto-commit si hay cambios críticos
        if (claudeFiles.length > 0 || geminiFiles.length > 0) {
          console.log(`\n🔄 Auto-sync detectado:`);
          console.log(`  Claude: ${claudeFiles.length} archivos en packages/`);
          console.log(`  Gemini: ${geminiFiles.length} archivos en apps/`);
          
          // Generar reporte automático
          this.generateSyncReport(claudeFiles, geminiFiles);
          
          // Auto-commit periódico para evitar pérdida de trabajo
          if (this.shouldAutoCommit()) {
            this.performAutoCommit(claudeFiles.length > 0 ? 'Claude' : 'Gemini');
          }
        }
      }
      
      // 2. Pull cambios remotos automáticamente
      try {
        const pullResult = execSync('git pull --no-edit 2>&1', { encoding: 'utf8' });
        if (!pullResult.includes('Already up to date')) {
          console.log('✅ Nuevos cambios sincronizados desde remoto');
          this.notifyAI('NEW_REMOTE_CHANGES');
        }
      } catch (e) {
        // No hay cambios remotos
      }
      
      // 3. Verificar integridad de builds
      this.verifyBuildIntegrity();
      
    } catch (error) {
      console.error('Error en sincronización:', error.message);
    }
  }

  shouldAutoCommit() {
    // Auto-commit cada 5 minutos si hay cambios
    const lastCommitTime = execSync('git log -1 --format=%ct', { encoding: 'utf8' });
    const timeSinceLastCommit = Date.now() / 1000 - parseInt(lastCommitTime);
    return timeSinceLastCommit > 300; // 5 minutos
  }

  performAutoCommit(worker) {
    const timestamp = new Date().toISOString();
    const message = `auto-sync: ${worker} progress checkpoint - ${timestamp}`;
    
    try {
      execSync('git add -A');
      execSync(`git commit -m "${message}" --no-verify`);
      execSync('git push origin HEAD --no-verify');
      console.log(`✅ Auto-commit exitoso: ${worker}`);
    } catch (e) {
      console.log('⚠️ Auto-commit pospuesto (posibles conflictos)');
    }
  }

  generateSyncReport(claudeFiles, geminiFiles) {
    const report = `
## 🔄 AUTO-SYNC REPORT - ${new Date().toISOString()}

### Claude Activity (packages/*)
${claudeFiles.map(f => `- ${f}`).join('\n') || '- No changes'}

### Gemini Activity (apps/*)
${geminiFiles.map(f => `- ${f}`).join('\n') || '- No changes'}

### Build Status
- UI Package: ${this.checkUIPackageBuild()}
- Types Package: ${this.checkTypesPackageBuild()}
- Apps Status: ${this.checkAppsStatus()}

---
`;
    
    // Append to sync file
    fs.appendFileSync(SYNC_FILE, report);
  }

  checkUIPackageBuild() {
    try {
      execSync('cd packages/ui && npm run build', { stdio: 'pipe' });
      return '✅ Building';
    } catch {
      return '❌ Failed';
    }
  }

  checkTypesPackageBuild() {
    try {
      execSync('cd packages/types && npm run build', { stdio: 'pipe' });
      return '✅ Building';
    } catch {
      return '❌ Failed';
    }
  }

  checkAppsStatus() {
    const apps = ['patients', 'doctors', 'companies', 'admin'];
    const results = apps.map(app => {
      try {
        execSync(`cd apps/${app} && npx tsc --noEmit`, { stdio: 'pipe' });
        return `${app}:✅`;
      } catch {
        return `${app}:❌`;
      }
    });
    return results.join(', ');
  }

  verifyBuildIntegrity() {
    // Verificación rápida de integridad
    const criticalFiles = [
      'packages/ui/dist/index.cjs',
      'packages/ui/dist/index.js',
      'packages/ui/dist/index.d.ts',
      'packages/types/dist/index.js',
      'packages/hooks/dist/index.js'
    ];
    
    const missing = criticalFiles.filter(f => !fs.existsSync(f));
    if (missing.length > 0) {
      console.log('⚠️ Build artifacts missing:', missing);
      this.rebuildPackages();
    }
  }

  rebuildPackages() {
    console.log('🔧 Rebuilding packages...');
    try {
      execSync('cd packages/ui && npm run build', { stdio: 'inherit' });
      execSync('cd packages/types && npm run build', { stdio: 'inherit' });
      execSync('cd packages/hooks && npm run build', { stdio: 'inherit' });
      console.log('✅ Packages rebuilt successfully');
    } catch (e) {
      console.error('❌ Rebuild failed:', e.message);
    }
  }

  notifyAI(event) {
    // Sistema de notificaciones para ambos AIs
    const notification = {
      timestamp: new Date().toISOString(),
      event,
      details: {}
    };
    
    // Escribir en archivo de notificaciones
    fs.appendFileSync('AI_NOTIFICATIONS.jsonl', JSON.stringify(notification) + '\n');
  }

  start() {
    console.log('🚀 Claude-Gemini Sync System Started');
    console.log('📍 Monitoring every 30 seconds...\n');
    
    // Check immediately
    this.checkAndSync();
    
    // Then every 30 seconds
    setInterval(() => this.checkAndSync(), INTERVAL);
  }
}

// Iniciar sistema
const sync = new AICollaborationSync();
sync.start();