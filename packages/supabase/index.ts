import { createClient } from '@supabase/supabase-js';

// Credenciales de Supabase
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gtyvdircfhmdjiaelqkg.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0eXZkaXJjZmhtZGppYWVscWtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyOTI3OTAsImV4cCI6MjA3MTg2ODc5MH0.7UFMVZsWTWOAynnhzkG76I_lhVCYtd_RmTt9EH3wJD4';

// Crear cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Funciones de utilidad para la base de datos
export async function testConnection() {
  try {
    const { data, error } = await supabase.from('_prisma_migrations').select('id').limit(1);

    if (error && error.code === '42P01') {
      // Tabla no existe, pero la conexión funciona
      console.log('✅ Conexión a Supabase exitosa (base de datos vacía)');
      return true;
    }

    if (error) throw error;

    console.log('✅ Conexión a Supabase exitosa');
    return true;
  } catch (error) {
    console.error('❌ Error conectando a Supabase:', error);
    return false;
  }
}

// Funciones para autenticación con Supabase
export const supabaseAuth = {
  // Login con email/password
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Registro
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  },

  // Login con Google
  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    return { data, error };
  },

  // Cerrar sesión
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Obtener sesión actual
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    return { data, error };
  },

  // Obtener usuario actual
  getUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    return { data, error };
  },
};

// Funciones para storage de Supabase
export const supabaseStorage = {
  // Subir archivo
  uploadFile: async (bucket: string, path: string, file: File) => {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file);
    return { data, error };
  },

  // Obtener URL pública
  getPublicUrl: (bucket: string, path: string) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },

  // Descargar archivo
  downloadFile: async (bucket: string, path: string) => {
    const { data, error } = await supabase.storage.from(bucket).download(path);
    return { data, error };
  },

  // Eliminar archivo
  deleteFile: async (bucket: string, paths: string[]) => {
    const { data, error } = await supabase.storage.from(bucket).remove(paths);
    return { data, error };
  },
};

// Export default
export default supabase;
