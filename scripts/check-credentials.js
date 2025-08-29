#!/usr/bin/env node

/**
 * Script para verificar todas las credenciales necesarias para AltaMedica
 * Ejecutar con: node scripts/check-credentials.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Credenciales requeridas agrupadas por categoría
const REQUIRED_CREDENTIALS = {
  '🔥 Firebase Client (Frontend)': {
    variables: [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID'
    ],
    howToGet: `
    1. Ve a https://console.firebase.google.com
    2. Selecciona tu proyecto (altamedic-20f69)
    3. Click en ⚙️ → Configuración del proyecto
    4. Sección "General" → "Tus apps" → Selecciona app web
    5. Copia el objeto firebaseConfig`
  },
  
  '🔐 Firebase Admin (Backend)': {
    variables: [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_PRIVATE_KEY'
    ],
    files: ['altamedic-firebase-admin.json'],
    howToGet: `
    1. Ve a https://console.firebase.google.com
    2. Proyecto → ⚙️ → Configuración del proyecto
    3. Pestaña "Cuentas de servicio"
    4. Click en "Generar nueva clave privada"
    5. Guarda el JSON como altamedic-firebase-admin.json`
  },
  
  '🗝️ JWT & Seguridad': {
    variables: [
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'ENCRYPTION_KEY'
    ],
    howToGet: `
    Generar con Node.js:
    node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
    
    O con OpenSSL:
    openssl rand -hex 64`
  },
  
  '💳 Pagos - MercadoPago': {
    variables: [
      'MERCADOPAGO_ACCESS_TOKEN',
      'MERCADOPAGO_PUBLIC_KEY'
    ],
    howToGet: `
    1. Ve a https://www.mercadopago.com/developers/panel
    2. Crea una aplicación
    3. Ve a "Credenciales de prueba" para desarrollo
    4. Copia Access Token y Public Key`
  },
  
  '💳 Pagos - Stripe': {
    variables: [
      'STRIPE_SECRET_KEY',
      'STRIPE_PUBLISHABLE_KEY',
      'STRIPE_WEBHOOK_SECRET'
    ],
    howToGet: `
    1. Ve a https://dashboard.stripe.com/test/apikeys
    2. Copia las claves de prueba
    3. Para webhook: Developers → Webhooks → Add endpoint`
  },
  
  '📊 Base de Datos': {
    variables: [
      'DATABASE_URL',
      'REDIS_URL'
    ],
    howToGet: `
    PostgreSQL local:
    DATABASE_URL="postgresql://user:password@localhost:5432/altamedica"
    
    Redis local:
    REDIS_URL="redis://localhost:6379"
    
    O usar servicios cloud:
    - Supabase: https://supabase.com
    - Upstash Redis: https://upstash.com`
  },
  
  '🤖 IA & APIs': {
    variables: [
      'OPENAI_API_KEY',
      'GEMINI_API_KEY',
      'ANTHROPIC_API_KEY'
    ],
    howToGet: `
    OpenAI: https://platform.openai.com/api-keys
    Gemini: https://makersuite.google.com/app/apikey
    Anthropic: https://console.anthropic.com/settings/keys`
  },
  
  '🗺️ Google Maps': {
    variables: [
      'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'
    ],
    howToGet: `
    1. Ve a https://console.cloud.google.com
    2. APIs & Services → Credentials
    3. Create Credentials → API Key
    4. Habilita Maps JavaScript API`
  },
  
  '📧 Email - SendGrid/Nodemailer': {
    variables: [
      'SENDGRID_API_KEY',
      'SMTP_HOST',
      'SMTP_PORT', 
      'SMTP_USER',
      'SMTP_PASS'
    ],
    howToGet: `
    SendGrid: https://app.sendgrid.com/settings/api_keys
    
    Gmail SMTP:
    SMTP_HOST="smtp.gmail.com"
    SMTP_PORT="587"
    SMTP_USER="tu-email@gmail.com"
    SMTP_PASS="contraseña de aplicación"`
  },
  
  '📊 Monitoreo': {
    variables: [
      'SENTRY_DSN',
      'SENTRY_AUTH_TOKEN',
      'VERCEL_TOKEN'
    ],
    howToGet: `
    Sentry: https://sentry.io/settings/account/api/auth-tokens/
    Vercel: https://vercel.com/account/tokens`
  },
  
  '🔒 reCAPTCHA': {
    variables: [
      'NEXT_PUBLIC_RECAPTCHA_SITE_KEY_WEB',
      'NEXT_PUBLIC_RECAPTCHA_SITE_KEY_IOS', 
      'NEXT_PUBLIC_RECAPTCHA_SITE_KEY_ANDROID',
      'RECAPTCHA_SECRET_KEY'
    ],
    howToGet: `
    1. Ve a https://www.google.com/recaptcha/admin
    2. Crea un nuevo sitio
    3. reCAPTCHA v2 → Casilla "No soy un robot"
    4. Agrega dominios: localhost, tu-dominio.com`
  },
  
  '☁️ AWS (Opcional)': {
    variables: [
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY',
      'AWS_REGION'
    ],
    howToGet: `
    1. AWS Console → IAM
    2. Users → Add User
    3. Programmatic access
    4. Attach policies (S3, Secrets Manager)`
  },
  
  '🎥 WebRTC/Telemedicina': {
    variables: [
      'TURN_SERVER_URL',
      'TURN_SERVER_USERNAME',
      'TURN_SERVER_PASSWORD',
      'MEDIASOUP_LISTEN_IP',
      'MEDIASOUP_ANNOUNCED_IP'
    ],
    howToGet: `
    Servicios TURN gratuitos:
    - Metered: https://www.metered.ca/stun-turn
    - Xirsys: https://xirsys.com
    
    Para MediaSoup:
    MEDIASOUP_LISTEN_IP="0.0.0.0"
    MEDIASOUP_ANNOUNCED_IP="tu-ip-publica"`
  }
};

// Función para verificar credenciales
function checkCredentials() {
  console.log(`\n${colors.cyan}${colors.bold}🔍 VERIFICADOR DE CREDENCIALES - ALTAMEDICA${colors.reset}\n`);
  console.log(`${colors.yellow}Verificando todas las credenciales necesarias...${colors.reset}\n`);
  
  const envPath = path.join(process.cwd(), '.env');
  const envLocalPath = path.join(process.cwd(), '.env.local');
  
  // Cargar variables de entorno
  const envVars = {};
  
  // Leer .env si existe
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        if (key) envVars[key.trim()] = value ? value.trim() : '';
      }
    });
  }
  
  // Leer .env.local si existe
  if (fs.existsSync(envLocalPath)) {
    const envLocalContent = fs.readFileSync(envLocalPath, 'utf8');
    envLocalContent.split('\n').forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        if (key) envVars[key.trim()] = value ? value.trim() : '';
      }
    });
  }
  
  // También verificar variables de entorno del sistema
  Object.keys(process.env).forEach(key => {
    if (!envVars[key]) {
      envVars[key] = process.env[key];
    }
  });
  
  let totalRequired = 0;
  let totalFound = 0;
  let totalMissing = 0;
  const missingByCategory = {};
  
  // Verificar cada categoría
  Object.entries(REQUIRED_CREDENTIALS).forEach(([category, config]) => {
    console.log(`${colors.blue}${colors.bold}${category}${colors.reset}`);
    
    const missing = [];
    const found = [];
    
    // Verificar variables
    if (config.variables) {
      config.variables.forEach(varName => {
        totalRequired++;
        if (envVars[varName] && envVars[varName] !== '' && !envVars[varName].includes('your-')) {
          found.push(varName);
          totalFound++;
          console.log(`  ${colors.green}✓${colors.reset} ${varName}`);
        } else {
          missing.push(varName);
          totalMissing++;
          console.log(`  ${colors.red}✗${colors.reset} ${varName} ${colors.yellow}(FALTA)${colors.reset}`);
        }
      });
    }
    
    // Verificar archivos
    if (config.files) {
      config.files.forEach(fileName => {
        totalRequired++;
        const filePath = path.join(process.cwd(), fileName);
        if (fs.existsSync(filePath)) {
          found.push(fileName);
          totalFound++;
          console.log(`  ${colors.green}✓${colors.reset} ${fileName} (archivo)`);
        } else {
          missing.push(fileName);
          totalMissing++;
          console.log(`  ${colors.red}✗${colors.reset} ${fileName} ${colors.yellow}(FALTA)${colors.reset}`);
        }
      });
    }
    
    if (missing.length > 0) {
      missingByCategory[category] = { missing, howToGet: config.howToGet };
    }
    
    console.log('');
  });
  
  // Resumen
  console.log(`${colors.cyan}${colors.bold}📊 RESUMEN${colors.reset}`);
  console.log(`Total requeridas: ${totalRequired}`);
  console.log(`${colors.green}Encontradas: ${totalFound}${colors.reset}`);
  console.log(`${colors.red}Faltantes: ${totalMissing}${colors.reset}`);
  
  const percentage = Math.round((totalFound / totalRequired) * 100);
  const progressBar = generateProgressBar(percentage);
  console.log(`\nProgreso: ${progressBar} ${percentage}%\n`);
  
  // Mostrar instrucciones para obtener credenciales faltantes
  if (Object.keys(missingByCategory).length > 0) {
    console.log(`${colors.yellow}${colors.bold}📝 CÓMO OBTENER LAS CREDENCIALES FALTANTES:${colors.reset}\n`);
    
    Object.entries(missingByCategory).forEach(([category, data]) => {
      console.log(`${colors.magenta}${colors.bold}${category}${colors.reset}`);
      console.log(`${colors.red}Faltantes: ${data.missing.join(', ')}${colors.reset}`);
      console.log(`${colors.cyan}Cómo obtenerlas:${colors.reset}${data.howToGet}\n`);
    });
    
    // Generar archivo .env.example con todas las variables
    generateEnvExample(REQUIRED_CREDENTIALS);
    
    console.log(`${colors.green}✅ Se ha generado '.env.needed' con todas las variables necesarias${colors.reset}`);
    console.log(`${colors.yellow}📋 Copia las variables de '.env.needed' a tu '.env' y completa los valores${colors.reset}\n`);
  } else {
    console.log(`${colors.green}${colors.bold}🎉 ¡Todas las credenciales están configuradas!${colors.reset}\n`);
  }
}

// Generar barra de progreso
function generateProgressBar(percentage) {
  const filled = Math.round(percentage / 5);
  const empty = 20 - filled;
  return `[${colors.green}${'█'.repeat(filled)}${colors.reset}${'-'.repeat(empty)}]`;
}

// Generar archivo .env.example
function generateEnvExample(credentials) {
  let content = `# ===============================================
# CREDENCIALES REQUERIDAS PARA ALTAMEDICA
# Generado: ${new Date().toISOString()}
# ===============================================\n\n`;
  
  Object.entries(credentials).forEach(([category, config]) => {
    content += `# ${category}\n`;
    content += `# ${'-'.repeat(50)}\n`;
    
    if (config.howToGet) {
      const instructions = config.howToGet.trim().split('\n').map(line => `# ${line}`).join('\n');
      content += `${instructions}\n\n`;
    }
    
    if (config.variables) {
      config.variables.forEach(varName => {
        content += `${varName}=\n`;
      });
    }
    
    content += '\n';
  });
  
  fs.writeFileSync('.env.needed', content);
}

// Ejecutar verificación
checkCredentials();

// Verificar conectividad a servicios
console.log(`${colors.cyan}${colors.bold}🔌 VERIFICANDO CONECTIVIDAD A SERVICIOS:${colors.reset}\n`);

// Verificar Firebase
try {
  execSync('curl -s https://altamedic-20f69.firebaseapp.com > /dev/null 2>&1');
  console.log(`${colors.green}✓ Firebase accesible${colors.reset}`);
} catch {
  console.log(`${colors.yellow}⚠ No se puede verificar Firebase${colors.reset}`);
}

// Verificar localhost puertos
const ports = [
  { port: 3000, name: 'Web App' },
  { port: 3001, name: 'API Server' },
  { port: 3002, name: 'Doctors App' },
  { port: 3003, name: 'Patients App' },
  { port: 5432, name: 'PostgreSQL' },
  { port: 6379, name: 'Redis' }
];

console.log(`\n${colors.cyan}Puertos locales:${colors.reset}`);
ports.forEach(({ port, name }) => {
  try {
    execSync(`netstat -an | grep :${port} | grep LISTEN > /dev/null 2>&1`);
    console.log(`${colors.green}✓ Puerto ${port} (${name}) - EN USO${colors.reset}`);
  } catch {
    console.log(`${colors.yellow}○ Puerto ${port} (${name}) - LIBRE${colors.reset}`);
  }
});

console.log(`\n${colors.bold}💡 Tip: Ejecuta 'node scripts/setup-dev-credentials.js' para configurar credenciales de desarrollo${colors.reset}\n`);