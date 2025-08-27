#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

console.log('🔍 Verificando conexión con Supabase...\n');

// Credenciales de Supabase
const supabaseUrl = 'https://gtyvdircfhmdjiaelqkg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0eXZkaXJjZmhtZGppYWVscWtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyOTI3OTAsImV4cCI6MjA3MTg2ODc5MH0.7UFMVZsWTWOAynnhzkG76I_lhVCYtd_RmTt9EH3wJD4';

// Crear cliente
const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('📡 URL de Supabase:', supabaseUrl);
console.log('🔑 Anon Key:', supabaseAnonKey.substring(0, 20) + '...\n');

// Test 1: Verificar conexión
console.log('Test 1: Verificando conexión...');
try {
  const { data, error } = await supabase
    .from('_prisma_migrations')
    .select('id')
    .limit(1);
  
  if (error && error.code === '42P01') {
    console.log('✅ Conexión exitosa (base de datos vacía - necesitas ejecutar Prisma migrate)');
  } else if (error) {
    console.error('❌ Error:', error.message);
  } else {
    console.log('✅ Conexión exitosa y base de datos lista');
  }
} catch (err) {
  console.error('❌ Error de conexión:', err.message);
}

// Test 2: Verificar Auth
console.log('\nTest 2: Verificando Auth...');
try {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('❌ Error en Auth:', error.message);
  } else {
    console.log('✅ Auth funcionando (sesión:', data.session ? 'activa' : 'no hay sesión', ')');
  }
} catch (err) {
  console.error('❌ Error en Auth:', err.message);
}

console.log('\n📋 Resumen:');
console.log('- Proyecto: gtyvdircfhmdjiaelqkg');
console.log('- URL: https://gtyvdircfhmdjiaelqkg.supabase.co');
console.log('- Dashboard: https://app.supabase.com/project/gtyvdircfhmdjiaelqkg');
console.log('\n🎯 Próximos pasos:');
console.log('1. Ve al dashboard y obtén el password de la base de datos');
console.log('2. Actualiza DATABASE_URL en tu .env con el password');
console.log('3. Ejecuta: npx prisma db push');
console.log('4. ¡Listo para usar!');

process.exit(0);