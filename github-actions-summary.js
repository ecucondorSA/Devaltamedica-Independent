import { execSync } from 'child_process';
import fs from 'fs';

console.log('📊 RESUMEN DE GITHUB ACTIONS - ALTAMEDICA\n');
console.log('=' .repeat(60));

const fixes = [
  '✅ Removidas rutas Windows hardcodeadas en .npmrc',
  '✅ Desactivado workflow cloud-development vacío',
  '✅ Corregido orden setup: pnpm antes que node',
  '✅ Cambiado pnpm/action-setup@v4 a v2'
];

console.log('\n🔧 CORRECCIONES APLICADAS:');
fixes.forEach(f => console.log(`  ${f}`));

try {
  const runs = execSync('gh run list --limit 3', { encoding: 'utf8' });
  console.log('\n📈 ÚLTIMOS WORKFLOWS:');
  console.log(runs);
} catch (e) {
  console.log('\n⚠️ No se pudo obtener estado de workflows');
}

console.log('\n🎯 PRÓXIMOS PASOS RECOMENDADOS:');
const nextSteps = [
  '1. Esperar que termine el workflow actual',
  '2. Si persisten errores, revisar logs específicos',
  '3. Verificar que todos los secretos estén configurados en GitHub',
  '4. Considerar simplificar workflows para MVP'
];

nextSteps.forEach(s => console.log(`  ${s}`));

console.log('\n💡 COMANDOS ÚTILES:');
console.log('  gh run watch          # Ver workflow en tiempo real');
console.log('  gh run list           # Listar todos los workflows');
console.log('  gh run view <id> --log # Ver logs detallados');

console.log('\n✨ Los workflows deberían funcionar correctamente ahora.');
console.log('   Si persisten problemas, es probable que sean de configuración');
console.log('   de secretos o permisos en el repositorio.\n');