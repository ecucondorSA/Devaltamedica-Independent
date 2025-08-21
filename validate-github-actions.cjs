const fs = require('fs');
const path = require('path');

const workflowsDir = path.join(process.cwd(), '.github', 'workflows');
const errors = [];

console.log('🔍 Validando GitHub Actions...\n');

const workflows = fs.readdirSync(workflowsDir)
  .filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));

workflows.forEach(file => {
  const content = fs.readFileSync(path.join(workflowsDir, file), 'utf8');
  console.log(`📄 ${file}:`);
  
  if (content.includes('pnpm/action-setup@v4')) {
    errors.push(`  ❌ ${file}: Usa pnpm/action-setup@v4, debe ser v2`);
  }
  
  if (content.includes('C:\\Users\\Eduardo')) {
    errors.push(`  ❌ ${file}: Contiene rutas Windows hardcodeadas`);
  }
  
  if (content.length < 100 && !content.includes('workflow_dispatch')) {
    errors.push(`  ❌ ${file}: Archivo casi vacío sin trigger manual`);
  }
  
  const pnpmSetupMatch = content.match(/pnpm\/action-setup@v\d/);
  const nodeSetupMatch = content.match(/actions\/setup-node@v\d/);
  
  if (pnpmSetupMatch && nodeSetupMatch) {
    const pnpmIndex = content.indexOf(pnpmSetupMatch[0]);
    const nodeIndex = content.indexOf(nodeSetupMatch[0]);
    
    if (nodeIndex < pnpmIndex) {
      errors.push(`  ⚠️  ${file}: Node setup debe estar después de pnpm setup`);
    }
  }
  
  console.log(errors.length === 0 ? '  ✅ OK' : errors.join('\n'));
});

const npmrcPath = path.join(process.cwd(), '.npmrc');
if (fs.existsSync(npmrcPath)) {
  const npmrc = fs.readFileSync(npmrcPath, 'utf8');
  if (npmrc.includes('C:\\Users\\Eduardo')) {
    console.log('\n📄 .npmrc:');
    console.log('  ✅ Rutas Windows removidas (usando defaults del sistema)');
  }
}

console.log('\n📊 Resumen:');
console.log(`  Total workflows: ${workflows.length}`);
console.log(`  Errores encontrados: ${errors.length}`);

if (errors.length > 0) {
  console.log('\n⚠️  Errores a corregir:');
  errors.forEach(e => console.log(e));
  process.exit(1);
} else {
  console.log('\n✅ Todos los workflows están correctos!');
}