'use client';

import {
  AlertCircle,
  Check,
  Copy,
  Download,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Shield,
  Smartphone,
} from 'lucide-react';
import { useState } from 'react';
import { Alert, AlertDescription } from '../alert';
import { Button } from '../Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../Card';
import { Input } from '../Input';
import { Label } from '../label';

/**
 * Componente de configuración MFA
 * Permite a los usuarios habilitar/deshabilitar autenticación de dos factores
 */

interface MFASetupProps {
  userId: string;
  userEmail: string;
  isEnabled?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface MFASecret {
  base32: string;
  qr_data_url?: string;
  backupCodes?: string[];
}

export function MFASetup({
  userId,
  userEmail,
  isEnabled = false,
  onSuccess,
  onCancel,
}: MFASetupProps) {
  const [step, setStep] = useState<'intro' | 'setup' | 'verify' | 'backup' | 'complete'>('intro');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secret, setSecret] = useState<MFASecret | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  // Generar secreto MFA
  const generateSecret = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/auth/mfa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, userEmail }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSecret(data.secret);
        setBackupCodes(data.backupCodes || []);
        setStep('setup');
      } else {
        setError(data.error || 'Error al generar el código QR');
      }
    } catch (err) {
      setError('Error de conexión. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Verificar código TOTP
  const verifyCode = async () => {
    if (verificationCode.length !== 6) {
      setError('El código debe tener 6 dígitos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/auth/mfa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId,
          token: verificationCode,
          secret: secret?.base32,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStep('backup');
      } else {
        setError(data.error || 'Código incorrecto. Por favor, intente nuevamente.');
      }
    } catch (err) {
      setError('Error al verificar el código.');
    } finally {
      setLoading(false);
    }
  };

  // Deshabilitar MFA
  const disableMFA = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/auth/mfa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (onSuccess) onSuccess();
      } else {
        setError(data.error || 'Error al deshabilitar MFA');
      }
    } catch (err) {
      setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  // Copiar secreto al portapapeles
  const copySecret = () => {
    if (secret?.base32) {
      navigator.clipboard.writeText(secret.base32);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  // Copiar códigos de respaldo
  const copyBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    setCopiedBackup(true);
    setTimeout(() => setCopiedBackup(false), 2000);
  };

  // Descargar códigos de respaldo
  const downloadBackupCodes = () => {
    const codesText = `Códigos de respaldo MFA - AltaMedica
Fecha: ${new Date().toLocaleDateString()}
Usuario: ${userEmail}

IMPORTANTE: Guarde estos códigos en un lugar seguro.
Cada código solo puede usarse una vez.

${backupCodes.join('\n')}`;

    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'altamedica-mfa-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Renderizar según el paso actual
  const renderStep = () => {
    switch (step) {
      case 'intro':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-center">
              <Shield className="h-16 w-16 text-blue-600" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">
                {isEnabled ? 'Autenticación de dos factores activa' : 'Proteja su cuenta'}
              </h3>
              <p className="text-gray-600">
                {isEnabled
                  ? 'Su cuenta está protegida con autenticación de dos factores.'
                  : 'Agregue una capa adicional de seguridad a su cuenta con autenticación de dos factores.'}
              </p>
            </div>

            {!isEnabled && (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                  <div className="flex items-start gap-3">
                    <Smartphone className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium">¿Cómo funciona?</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Usará una aplicación autenticadora en su teléfono para generar códigos de
                        seguridad.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Key className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Códigos de respaldo</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Recibirá códigos de respaldo para acceder si pierde su dispositivo.
                      </p>
                    </div>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Necesitará una aplicación autenticadora como Google Authenticator, Microsoft
                    Authenticator o Authy.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <div className="flex gap-3">
              {onCancel && (
                <Button variant="outline" onClick={onCancel} className="flex-1">
                  Cancelar
                </Button>
              )}
              {isEnabled ? (
                <Button
                  variant="destructive"
                  onClick={disableMFA}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Deshabilitar MFA
                </Button>
              ) : (
                <Button onClick={generateSecret} disabled={loading} className="flex-1">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Configurar MFA
                </Button>
              )}
            </div>
          </div>
        );

      case 'setup':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Paso 1: Escanee el código QR</h3>

              {secret?.qr_data_url && (
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-white rounded-lg border">
                    <img src={secret.qr_data_url} alt="QR Code MFA" className="w-48 h-48" />
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <p className="text-sm text-gray-600 text-center">
                  Escanee este código QR con su aplicación autenticadora
                </p>

                <div className="relative">
                  <Label>O ingrese manualmente esta clave:</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type={showSecret ? 'text' : 'password'}
                      value={secret?.base32 || ''}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button size="sm" variant="outline" onClick={() => setShowSecret(!showSecret)}>
                      {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" variant="outline" onClick={copySecret}>
                      {copiedSecret ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('intro')} className="flex-1">
                Atrás
              </Button>
              <Button onClick={() => setStep('verify')} className="flex-1">
                Siguiente
              </Button>
            </div>
          </div>
        );

      case 'verify':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Paso 2: Verificar configuración</h3>

              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Ingrese el código de 6 dígitos de su aplicación autenticadora para verificar la
                  configuración.
                </p>

                <div>
                  <Label htmlFor="verification-code">Código de verificación</Label>
                  <Input
                    id="verification-code"
                    type="text"
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) =>
                      setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    className="text-center text-2xl font-mono tracking-widest"
                    maxLength={6}
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep('setup')}
                disabled={loading}
                className="flex-1"
              >
                Atrás
              </Button>
              <Button
                onClick={verifyCode}
                disabled={loading || verificationCode.length !== 6}
                className="flex-1"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Verificar
              </Button>
            </div>
          </div>
        );

      case 'backup':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Paso 3: Guardar códigos de respaldo</h3>

              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Importante:</strong> Guarde estos códigos en un lugar seguro. Los
                  necesitará si pierde acceso a su dispositivo autenticador.
                </AlertDescription>
              </Alert>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="p-2 bg-white rounded border">
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={copyBackupCodes} className="flex-1">
                  {copiedBackup ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={downloadBackupCodes} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setStep('complete')} className="w-full">
                He guardado mis códigos
              </Button>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-center">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">¡MFA activado exitosamente!</h3>
              <p className="text-gray-600">
                Su cuenta ahora está protegida con autenticación de dos factores.
              </p>
            </div>

            <Alert className="bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                A partir de ahora, necesitará su dispositivo autenticador para iniciar sesión.
              </AlertDescription>
            </Alert>

            <Button onClick={onSuccess} className="w-full">
              Finalizar
            </Button>
          </div>
        );
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Autenticación de dos factores (2FA)</CardTitle>
        <CardDescription>
          {step === 'intro' && 'Configure la verificación en dos pasos para su cuenta'}
          {step === 'setup' && 'Configure su aplicación autenticadora'}
          {step === 'verify' && 'Verifique su configuración'}
          {step === 'backup' && 'Guarde sus códigos de respaldo'}
          {step === 'complete' && 'Configuración completada'}
        </CardDescription>
      </CardHeader>
      <CardContent>{renderStep()}</CardContent>
    </Card>
  );
}
