/**
 * 🧪 Prueba Específica para Validar "Edward"
 * Verifica que "Edward" pasa la validación sin necesidad de excepción
 */

import { NameValidator, validateFirstName } from '../validators/name-validators';

// Simple logger implementation to avoid circular dependencies
const logger = {
  info: (message, data) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.log(message, data);
    }
  },
  warn: (message, data) => {
    if (typeof console !== 'undefined') {
      console.warn(message, data);
    }
  },
  error: (message, data) => {
    if (typeof console !== 'undefined') {
      console.error(message, data);
    }
  },
  debug: (message, data) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.debug(message, data);
    }
  }
};
/**
 * 🔍 Analiza las consonantes consecutivas en "Edward"
 */
function analyzeEdward(): void {
  logger.info('🔍 Análisis detallado de "Edward"');
  logger.info('='.repeat(40));
  
  const name = 'Edward';
  const chars = name.toLowerCase().split('');
  
  logger.info('Caracteres:', chars);
  logger.info('Análisis letra por letra:');
  
  chars.forEach((char, index) => {
    const isVowel = /[aeiouáéíóú]/.test(char);
    const isConsonant = /[bcdfghjklmnpqrstvwxyzñ]/.test(char);
    
    logger.info(`  ${index + 1}. "${char}" - ${isVowel ? 'VOCAL' : isConsonant ? 'CONSONANTE' : 'OTRO'}`);
  });
  
  // Buscar secuencias de consonantes
  let consecutiveConsonants = 0;
  let maxSequence = 0;
  let currentSequence = '';
  let sequences: string[] = [];
  
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    
    if (/[bcdfghjklmnpqrstvwxyzñ]/.test(char)) {
      consecutiveConsonants++;
      currentSequence += char;
      maxSequence = Math.max(maxSequence, consecutiveConsonants);
    } else {
      if (currentSequence.length > 0) {
        sequences.push(`"${currentSequence}" (${consecutiveConsonants} consonantes)`);
      }
      consecutiveConsonants = 0;
      currentSequence = '';
    }
  }
  
  // Verificar la última secuencia
  if (currentSequence.length > 0) {
    sequences.push(`"${currentSequence}" (${consecutiveConsonants} consonantes)`);
  }
  
  logger.info('\n📊 Secuencias de consonantes encontradas:');
  sequences.forEach(seq => logger.info(`  - ${seq}`));
  logger.info(`\n🎯 Máxima secuencia de consonantes consecutivas: ${maxSequence}`);
  logger.info(`✅ ¿Pasa validación estándar (máx 3)? ${maxSequence <= 3 ? 'SÍ' : 'NO'}`);
}

/**
 * 🧪 Prueba con el validador actual
 */
function testEdwardValidation(): void {
  logger.info('\n🧪 Prueba con validador actual');
  logger.info('='.repeat(40));
  
  const result = validateFirstName('Edward');
  
  logger.info('Resultado:', {
    isValid: result.isValid,
    errors: result.errors,
    warnings: result.warnings,
    suggestions: result.suggestions
  });
  
  logger.info(`\n${result.isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}: Edward ${result.isValid ? 'pasa' : 'no pasa'} la validación`);
  
  if (result.errors.length > 0) {
    logger.info('Errores:');
    result.errors.forEach(error => logger.info(`  - ${error}`));
  }
  
  if (result.warnings.length > 0) {
    logger.info('Advertencias:');
    result.warnings.forEach(warning => logger.info(`  - ${warning}`));
  }
}

/**
 * 🔬 Prueba con diferentes configuraciones
 */
function testDifferentConfigurations(): void {
  logger.info('\n🔬 Prueba con diferentes configuraciones');
  logger.info('='.repeat(40));
  
  const configurations = [
    { name: 'Estándar (3 consonantes)', limit: 3 },
    { name: 'Estricto (2 consonantes)', limit: 2 },
    { name: 'Muy estricto (1 consonante)', limit: 1 },
    { name: 'Flexible (4 consonantes)', limit: 4 }
  ];
  
  configurations.forEach(config => {
    const validator = new NameValidator({
      consonantLimit: config.limit,
      checkConsonantLimit: true
    });
    
    const result = validator.validateName('Edward', 'firstName');
    const status = result.isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO';
    
    logger.info(`  ${config.name}: ${status}`);
    if (!result.isValid) {
      logger.info(`    └─ ${result.errors[0]}`);
    }
  });
}

/**
 * 🚀 Ejecutar todas las pruebas
 */
export function runEdwardTests(): void {
  logger.info('🚀 SUITE DE PRUEBAS PARA "EDWARD"');
  logger.info('='.repeat(50));
  
  analyzeEdward();
  testEdwardValidation();
  testDifferentConfigurations();
  
  logger.info('\n🎯 CONCLUSIÓN:');
  logger.info('Edward tiene máximo 2 consonantes consecutivas (d-w),');
  logger.info('por lo que debería pasar la validación estándar sin excepciones.');
}

// Ejecutar automáticamente si se importa
if (typeof window !== 'undefined') {
  (window as any).runEdwardTests = runEdwardTests;
  (window as any).analyzeEdward = analyzeEdward;
}

export { analyzeEdward, testDifferentConfigurations, testEdwardValidation };

