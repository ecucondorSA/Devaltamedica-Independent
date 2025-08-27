/**
 * Secrets Loader para Vercel KV (Sin AWS!)
 * Mucho más simple que AWS Secrets Manager
 */

/**
 * Inicializa secrets desde Vercel KV o variables locales
 * No requiere AWS - usa Vercel KV que es más simple
 */
export async function initSecrets() {
  console.log('[secrets-loader] 🚀 Inicializando secrets...');

  // Si tenemos Vercel KV configurado
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      // Importación dinámica de @vercel/kv solo si está disponible
      const { kv } = await import('@vercel/kv').catch(() => ({ kv: null }));

      if (kv) {
        console.log('[secrets-loader] 📡 Conectando a Vercel KV...');

        // Intentar cargar secrets desde Vercel KV
        const secrets = await kv.hgetall('secrets:altamedica');

        if (secrets) {
          // JWT Secrets
          if (secrets.JWT_SECRET) process.env.JWT_SECRET = secrets.JWT_SECRET as string;
          if (secrets.JWT_REFRESH_SECRET)
            process.env.JWT_REFRESH_SECRET = secrets.JWT_REFRESH_SECRET as string;
          if (secrets.ENCRYPTION_KEY) process.env.ENCRYPTION_KEY = secrets.ENCRYPTION_KEY as string;

          console.log('[secrets-loader] ✅ Secrets cargados desde Vercel KV');
        } else {
          // Si no hay secrets en KV, guardar los actuales
          if (process.env.JWT_SECRET && process.env.JWT_REFRESH_SECRET) {
            const localSecrets = {
              JWT_SECRET: process.env.JWT_SECRET,
              JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
              ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '',
            };

            await kv.hset('secrets:altamedica', localSecrets);
            console.log(
              '[secrets-loader] 📝 Secrets guardados en Vercel KV para futura referencia',
            );
          }
        }
      }
    } catch (error) {
      console.log('[secrets-loader] ⚠️ Vercel KV no disponible, usando secrets locales');
    }
  } else {
    console.log('[secrets-loader] 📁 Usando secrets locales desde .env');
  }

  // Verificar que tengamos los secrets críticos
  if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
    console.warn('[secrets-loader] ⚠️ ADVERTENCIA: JWT secrets no encontrados');
    console.log('[secrets-loader] 💡 Ejecuta: node scripts/setup-local-secrets.js');
  } else {
    console.log('[secrets-loader] ✅ Secrets inicializados correctamente');
  }
}

// Función auxiliar para verificar si estamos usando AWS (para compatibilidad)
export function isUsingAWS(): boolean {
  return false; // Ya no usamos AWS
}

// Export para compatibilidad con el código existente
export default initSecrets;
