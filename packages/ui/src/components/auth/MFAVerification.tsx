'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../card';
import { Button } from '../button';
import { Input } from '../input';
import { Label } from '../label';
import { Alert, AlertDescription } from '../alert';
import { Checkbox } from '../checkbox';
// Simple logger implementation to avoid circular dependencies
const logger = {
  info: (message, data) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.log(message, data);
    }
  },
  warn: (message, data) => {
    if (typeof console !== 'undefined') {
      console.warn(message, data);
    }
  },
  error: (message, data) => {
    if (typeof console !== 'undefined') {
      console.error(message, data);
    }
  },
  debug: (message, data) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.debug(message, data);
    }
  }
};
import { Shield, Smartphone, AlertCircle, Loader2, Key, RefreshCw, Lock } from 'lucide-react';

/**
 * Componente de verificación MFA
 * Segunda fase de autenticación con código TOTP
 */

interface MFAVerificationProps {
  userId: string;
  userEmail?: string;
  onSuccess?: (data: any) => void;
  onCancel?: () => void;
  onUseBackupCode?: () => void;
}

export function MFAVerification({
  userId,
  userEmail,
  onSuccess,
  onCancel,
  onUseBackupCode,
}: MFAVerificationProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Enfocar el primer input
    inputRefs.current[0]?.focus();

    // Verificar estado de bloqueo
    checkMFAStatus();
  }, []);

  // Verificar estado de MFA
  const checkMFAStatus = async () => {
    try {
      const response = await fetch('/api/v1/auth/mfa/verify', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.isLocked) {
          setIsLocked(true);
          setError('Cuenta bloqueada temporalmente. Intente nuevamente en 15 minutos.');
        }
        setRemainingAttempts(data.remainingAttempts);
      }
    } catch (err) {
      logger.error('Error checking MFA status:', err);
    }
  };

  // Manejar cambio en los inputs
  const handleInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Solo permitir dígitos

    const newCode = [...code];
    newCode[index] = value.slice(-1); // Solo el último carácter
    setCode(newCode);

    // Auto-avanzar al siguiente input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-enviar cuando se complete el código
    if (index === 5 && value) {
      const fullCode = newCode.join('');
      if (fullCode.length === 6) {
        verifyCode(fullCode);
      }
    }
  };

  // Manejar tecla de retroceso
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Manejar pegado
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);

    if (pastedData.length === 6) {
      const newCode = pastedData.split('');
      setCode(newCode);
      inputRefs.current[5]?.focus();
      verifyCode(pastedData);
    }
  };

  // Verificar código
  const verifyCode = async (fullCode?: string) => {
    const codeToVerify = fullCode || code.join('');

    if (codeToVerify.length !== 6) {
      setError('Por favor, ingrese un código de 6 dígitos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId,
          token: codeToVerify,
          rememberDevice,
          useBackupCode,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (onSuccess) {
          onSuccess(data);
        }
      } else {
        setError(data.error || 'Código incorrecto');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();

        if (data.remainingAttempts !== undefined) {
          setRemainingAttempts(data.remainingAttempts);
          if (data.remainingAttempts === 0) {
            setIsLocked(true);
          }
        }
      }
    } catch (err) {
      setError('Error al verificar el código. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Limpiar código
  const clearCode = () => {
    setCode(['', '', '', '', '', '']);
    setError(null);
    inputRefs.current[0]?.focus();
  };

  // Cambiar a código de respaldo
  const switchToBackupCode = () => {
    setUseBackupCode(true);
    setError(null);
    clearCode();
    if (onUseBackupCode) {
      onUseBackupCode();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
            {isLocked ? (
              <Lock className="h-8 w-8 text-red-600" />
            ) : (
              <Shield className="h-8 w-8 text-blue-600" />
            )}
          </div>
        </div>
        <CardTitle>Verificación en dos pasos</CardTitle>
        <CardDescription>
          {useBackupCode
            ? 'Ingrese uno de sus códigos de respaldo'
            : 'Ingrese el código de 6 dígitos de su aplicación autenticadora'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Información del usuario */}
        {userEmail && (
          <div className="text-center text-sm text-gray-600">
            Verificando: <span className="font-medium">{userEmail}</span>
          </div>
        )}

        {/* Input de código */}
        <div className="space-y-4">
          {!useBackupCode ? (
            <div className="flex justify-center gap-2">
              {code.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  disabled={loading || isLocked}
                  className="w-12 h-12 text-center text-xl font-mono"
                  aria-label={`Dígito ${index + 1}`}
                />
              ))}
            </div>
          ) : (
            <div>
              <Label htmlFor="backup-code">Código de respaldo</Label>
              <Input
                id="backup-code"
                type="text"
                placeholder="XXXX-XXXX"
                value={code.join('')}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                  if (value.length <= 8) {
                    const newCode = value.padEnd(6, '').split('').slice(0, 6);
                    setCode(newCode);
                  }
                }}
                disabled={loading || isLocked}
                className="font-mono uppercase"
              />
            </div>
          )}

          {/* Recordar dispositivo */}
          {!useBackupCode && !isLocked && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberDevice}
                onCheckedChange={(checked) => setRememberDevice(checked as boolean)}
                disabled={loading}
              />
              <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                Confiar en este dispositivo por 30 días
              </Label>
            </div>
          )}
        </div>

        {/* Mensaje de error */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Intentos restantes */}
        {remainingAttempts !== null && remainingAttempts < 5 && !isLocked && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {remainingAttempts === 0
                ? 'Sin intentos restantes. Cuenta bloqueada temporalmente.'
                : `${remainingAttempts} ${remainingAttempts === 1 ? 'intento restante' : 'intentos restantes'}`}
            </AlertDescription>
          </Alert>
        )}

        {/* Botones de acción */}
        <div className="space-y-3">
          {!isLocked && (
            <Button
              onClick={() => verifyCode()}
              disabled={
                loading || (useBackupCode ? code.join('').length < 8 : code.join('').length !== 6)
              }
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Verificando...
                </>
              ) : (
                'Verificar'
              )}
            </Button>
          )}

          <div className="flex gap-3">
            {!isLocked && !useBackupCode && (
              <Button variant="outline" onClick={clearCode} disabled={loading} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Limpiar
              </Button>
            )}

            {onCancel && (
              <Button variant="outline" onClick={onCancel} disabled={loading} className="flex-1">
                Cancelar
              </Button>
            )}
          </div>
        </div>

        {/* Enlaces adicionales */}
        <div className="text-center space-y-2">
          {!useBackupCode && !isLocked && (
            <button
              onClick={switchToBackupCode}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              disabled={loading}
            >
              <Key className="h-3 w-3 inline mr-1" />
              Usar código de respaldo
            </button>
          )}

          {useBackupCode && !isLocked && (
            <button
              onClick={() => {
                setUseBackupCode(false);
                clearCode();
              }}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              disabled={loading}
            >
              <Smartphone className="h-3 w-3 inline mr-1" />
              Usar aplicación autenticadora
            </button>
          )}

          <div className="text-xs text-gray-500 mt-4">
            ¿Problemas? Contacte al administrador del sistema
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
