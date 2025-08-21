const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => new Promise((resolve) => {
  rl.question(prompt, resolve);
});

async function setupSecrets() {
  console.log('🔧 Configuración de GitHub Secrets para Firebase\n');
  
  try {
    const repoInfo = execSync('gh repo view --json nameWithOwner', { encoding: 'utf8' });
    const { nameWithOwner } = JSON.parse(repoInfo);
    console.log(`📦 Repositorio: ${nameWithOwner}\n`);
    
    console.log('📝 Instrucciones:\n');
    console.log('1. Para obtener FIREBASE_TOKEN, ejecuta en otra terminal:');
    console.log('   npx firebase-tools login:ci --no-localhost\n');
    console.log('2. Copia el token que aparece después del proceso de autenticación\n');
    
    const firebaseToken = await question('Pega tu FIREBASE_TOKEN aquí: ');
    
    if (firebaseToken && firebaseToken.trim()) {
      console.log('\n⚙️ Configurando FIREBASE_TOKEN...');
      execSync(`gh secret set FIREBASE_TOKEN --body "${firebaseToken.trim()}"`, { stdio: 'inherit' });
      console.log('✅ FIREBASE_TOKEN configurado\n');
    }
    
    const projectId = await question('Ingresa tu FIREBASE_PROJECT_ID (ej: altamedica-prod): ');
    
    if (projectId && projectId.trim()) {
      console.log('\n⚙️ Configurando FIREBASE_PROJECT_ID...');
      execSync(`gh secret set FIREBASE_PROJECT_ID --body "${projectId.trim()}"`, { stdio: 'inherit' });
      console.log('✅ FIREBASE_PROJECT_ID configurado\n');
    }
    
    console.log('🎉 Configuración completada!\n');
    console.log('📋 Verificando secrets configurados...\n');
    
    const secrets = execSync('gh secret list', { encoding: 'utf8' });
    console.log('Secrets actuales:');
    console.log(secrets);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

setupSecrets();