const path = require('path');

// Configuración centralizada de rutas del proyecto
module.exports = {
  // Documentos principales
  AGENT_ASSIGNMENTS_PATH: path.join(__dirname, '../docs/B001-AGENT-ASSIGNMENTS.md'),
  IMPLEMENTATION_CHECKLIST_PATH: path.join(__dirname, '../docs/B001-IMPLEMENTATION-CHECKLIST.md'),
  
  // Directorios de salida
  OUTPUT_DIR: path.join(__dirname, '../data/assignments/'),
  LOGS_DIR: path.join(__dirname, '../logs/'),
  
  // Configuraciones
  CONFIG_DIR: path.join(__dirname, './'),
  SCRIPTS_DIR: path.join(__dirname, '../scripts/'),
  
  // Validación de existencia
  validatePaths() {
    const fs = require('fs');
    const requiredPaths = [
      this.AGENT_ASSIGNMENTS_PATH,
      this.IMPLEMENTATION_CHECKLIST_PATH
    ];
    
    const missingPaths = requiredPaths.filter(p => !fs.existsSync(p));
    if (missingPaths.length > 0) {
      throw new Error(`Archivos requeridos no encontrados: ${missingPaths.join(', ')}`);
    }
    
    return true;
  }
}; 