const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');

const watcher = chokidar.watch('.', {
  ignored: /(^|[\]\[/])\..*/,
  persistent: true,
  cwd: '/home/edu/Devaltamedica-Independent'
});

let lastAction = null;

watcher.on('all', (event, filePath) => {
  if (filePath.includes('node_modules') || filePath.includes('.git')) return;
  
  const timestamp = new Date().toLocaleTimeString('es-ES', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
  
  const action = `[${timestamp}] ${event.toUpperCase()}: ${filePath}`;
  
  if (action !== lastAction) {
    console.log(`🔄 CLAUDE DETECTADO:\n====================\n  ${action}\n  Worker: 🤖 CLAUDE\n`);
    lastAction = action;
  }
});

console.log('👁️ Monitoring Claude changes in real-time...');
