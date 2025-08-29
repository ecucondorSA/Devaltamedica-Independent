import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import fs from 'fs';
import path from 'path';
import { logger } from '@altamedica/shared';

/**
 * Carga secretos críticos desde AWS Secrets Manager o localmente
 * Fallback: si falla AWS, usa secrets locales o variables de entorno
 */
export async function initSecrets() {
  // Si USE_LOCAL_SECRETS está activo, cargar secrets locales
  if (process.env.USE_LOCAL_SECRETS === 'true') {
    logger.info('[secrets-loader] 📁 Usando secrets locales para desarrollo');

    try {
      // Intentar cargar desde config/local-secrets.json
      const localSecretsPath = path.join(process.cwd(), '..', '..', 'config', 'local-secrets.json');

      if (fs.existsSync(localSecretsPath)) {
        const localSecrets = JSON.parse(fs.readFileSync(localSecretsPath, 'utf8'));

        // Cargar JWT secrets
        if (localSecrets['altamedica/jwt']) {
          process.env.JWT_SECRET =
            localSecrets['altamedica/jwt'].JWT_SECRET || process.env.JWT_SECRET;
          process.env.JWT_REFRESH_SECRET =
            localSecrets['altamedica/jwt'].JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET;
        }

        // Cargar encryption key
        if (localSecrets['altamedica/encryption']) {
          process.env.ENCRYPTION_KEY =
            localSecrets['altamedica/encryption'].ENCRYPTION_KEY || process.env.ENCRYPTION_KEY;
        }

        logger.info('[secrets-loader] ✅ Secrets locales cargados desde archivo');
        return;
      }
    } catch (error) {
      logger.warn('[secrets-loader] ⚠️ No se pudo cargar archivo local-secrets.json');
    }

    // Verificar que tengamos secrets en .env
    if (process.env.JWT_SECRET && process.env.JWT_REFRESH_SECRET) {
      logger.info('[secrets-loader] ✅ Usando secrets desde .env');
      return;
    } else {
      logger.error(
        '[secrets-loader] ❌ No se encontraron JWT secrets. Ejecuta: node scripts/setup-local-secrets.js',
      );
      return;
    }
  }

  // Modo producción: intentar cargar desde AWS
  const secretName = process.env.AWS_SECRET_NAME || 'altamedica/production/secrets';
  const region = process.env.AWS_REGION || 'us-east-1';

  try {
    logger.info('[secrets-loader] ☁️ Intentando cargar desde AWS Secrets Manager...');
    const client = new SecretsManagerClient({ region });
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const res = await client.send(command);

    const secretString = res.SecretString;
    if (!secretString) return;

    const secrets = JSON.parse(secretString);

    // Asignar si existen
    if (secrets.JWT_SECRET && typeof secrets.JWT_SECRET === 'string') {
      process.env.JWT_SECRET = secrets.JWT_SECRET;
    }
    if (secrets.JWT_REFRESH_SECRET && typeof secrets.JWT_REFRESH_SECRET === 'string') {
      process.env.JWT_REFRESH_SECRET = secrets.JWT_REFRESH_SECRET;
    }

    // Otros posibles secretos
    if (secrets.DATABASE_URL && typeof secrets.DATABASE_URL === 'string') {
      process.env.DATABASE_URL = process.env.DATABASE_URL || secrets.DATABASE_URL;
    }

    logger.info('[secrets-loader] ✅ Secrets cargados desde AWS');
  } catch (error) {
    logger.warn(
      '[secrets-loader] ⚠️ No se pudieron cargar secretos desde AWS:',
      (error as any)?.message,
    );
    logger.info('[secrets-loader] 📁 Usando variables de entorno locales como fallback');
  }
}
