#!/usr/bin/env node

/**
 * Test Firebase Configuration
 */

const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

console.log('🔍 Testing Firebase Configuration\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Check environment variables
const requiredVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

console.log('📋 Environment Variables Check:\n');

let allVarsPresent = true;
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    const displayValue = varName.includes('KEY') ? 
      value.substring(0, 10) + '...' : 
      value;
    console.log(`✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`❌ ${varName}: MISSING`);
    allVarsPresent = false;
  }
});

console.log('\n📊 Summary:\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (allVarsPresent) {
  console.log('✅ All Firebase environment variables are configured');
  console.log('\nProject ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  console.log('Auth Domain:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
  console.log('Emulator Mode:', process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' ? 'ENABLED' : 'DISABLED');
  console.log('Mock Auth:', process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true' ? 'ENABLED' : 'DISABLED');
} else {
  console.log('❌ Some Firebase environment variables are missing');
  console.log('\n💡 Tips:');
  console.log('  1. Check if .env.local file exists');
  console.log('  2. Copy values from .env.example and fill in Firebase config');
  console.log('  3. Restart the Next.js dev server after updating .env.local');
}

console.log('\n🚀 Next Steps:');
console.log('  1. If all variables are present, restart the dev server');
console.log('  2. Run: pnpm --filter @altamedica/web-app dev');
console.log('  3. Check browser console for any Firebase initialization errors');
console.log('\n');