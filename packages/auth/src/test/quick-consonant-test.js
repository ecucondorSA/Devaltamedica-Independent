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

#!/usr/bin/env node

/**
 * 🧪 Script de prueba rápida para validar "Edward"
 */

// Simular las definiciones necesarias
const VOWELS = /[aeiouáéíóúAEIOUÁÉÍÓÚ]/;
const CONSONANTS = /[bcdfghjklmnpqrstvwxyzñBCDFGHJKLMNPQRSTVWXYZÑ]/;

function analyzeEdward() {
  logger.info('🔍 Análisis detallado de "Edward"');
  logger.info('='.repeat(40));
  
  const name = 'Edward';
  const chars = name.toLowerCase().split('');
  
  logger.info('Caracteres:', chars);
  logger.info('Análisis letra por letra:');
  
  chars.forEach((char, index) => {
    const isVowel = VOWELS.test(char);
    const isConsonant = CONSONANTS.test(char);
    
    logger.info(`  ${index + 1}. "${char}" - ${isVowel ? 'VOCAL' : isConsonant ? 'CONSONANTE' : 'OTRO'}`);
  });
  
  // Buscar secuencias de consonantes
  let consecutiveConsonants = 0;
  let maxSequence = 0;
  let currentSequence = '';
  let sequences = [];
  
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    
    if (CONSONANTS.test(char)) {
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
  
  return maxSequence;
}

function testOtherNames() {
  logger.info('\n🔬 Comparación con otros nombres');
  logger.info('='.repeat(40));
  
  const testNames = [
    'Edward',     // Esperado: 2 consonantes máx (dw)
    'Christian',  // Esperado: 4 consonantes (chri) 
    'Roberto',    // Esperado: 1 consonante máx (separadas por vocales)
    'Francisco',  // Esperado: 3 consonantes (ncr o isc)
    'Esteban'     // Esperado: 3 consonantes (stb)
  ];
  
  testNames.forEach(name => {
    logger.info(`\n--- Analizando "${name}" ---`);
    const chars = name.toLowerCase().split('');
    
    let maxSequence = 0;
    let consecutiveConsonants = 0;
    let currentSequence = '';
    
    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      
      if (CONSONANTS.test(char)) {
        consecutiveConsonants++;
        currentSequence += char;
        maxSequence = Math.max(maxSequence, consecutiveConsonants);
      } else {
        if (currentSequence.length > 1) {
          logger.info(`  Secuencia: "${currentSequence}" (${consecutiveConsonants} consonantes)`);
        }
        consecutiveConsonants = 0;
        currentSequence = '';
      }
    }
    
    // Verificar la última secuencia
    if (currentSequence.length > 1) {
      logger.info(`  Secuencia: "${currentSequence}" (${consecutiveConsonants} consonantes)`);
    }
    
    logger.info(`  ➤ Máxima secuencia: ${maxSequence} consonantes`);
    logger.info(`  ➤ ¿Válido con límite 3? ${maxSequence <= 3 ? '✅ SÍ' : '❌ NO'}`);
  });
}

logger.info('🚀 ANÁLISIS DE CONSONANTES CONSECUTIVAS');
logger.info('='.repeat(50));

const maxEdward = analyzeEdward();
testOtherNames();

logger.info('\n🎯 CONCLUSIONES:');
logger.info(`- Edward tiene ${maxEdward} consonantes consecutivas máximo`);
logger.info('- NO necesita estar en la lista de excepciones');
logger.info('- Debería pasar la validación estándar normalmente');
logger.info('\n✅ Corrección aplicada: Edward removido de excepciones');
