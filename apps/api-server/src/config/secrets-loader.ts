import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager'

/**
 * Carga secretos críticos desde AWS Secrets Manager y los expone en process.env
 * Fallback: si falla, conserva valores existentes en process.env
 */
export async function initSecrets() {
  const secretName = process.env.AWS_SECRET_NAME || 'altamedica/production/secrets'
  const region = process.env.AWS_REGION || 'us-east-1'

  try {
    const client = new SecretsManagerClient({ region })
    const command = new GetSecretValueCommand({ SecretId: secretName })
    const res = await client.send(command)

    const secretString = res.SecretString
    if (!secretString) return

    const secrets = JSON.parse(secretString)

    // Asignar si existen
    if (secrets.JWT_SECRET && typeof secrets.JWT_SECRET === 'string') {
      process.env.JWT_SECRET = secrets.JWT_SECRET
    }
    if (secrets.JWT_REFRESH_SECRET && typeof secrets.JWT_REFRESH_SECRET === 'string') {
      process.env.JWT_REFRESH_SECRET = secrets.JWT_REFRESH_SECRET
    }

    // Otros posibles secretos
    if (secrets.DATABASE_URL && typeof secrets.DATABASE_URL === 'string') {
      process.env.DATABASE_URL = process.env.DATABASE_URL || secrets.DATABASE_URL
    }
  } catch (error) {
    console.warn('[secrets-loader] No se pudieron cargar secretos desde AWS Secrets Manager:', (error as any)?.message)
  }
}


