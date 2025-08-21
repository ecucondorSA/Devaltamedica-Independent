'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@altamedica/ui';
import { Button } from '@altamedica/ui';
import { Input } from '@altamedica/ui';
import { Label } from '@altamedica/ui';
import { Badge } from '@altamedica/ui';
import { Separator } from '@altamedica/ui';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  User,
  Calendar,
  Shield,
  ExternalLink
} from 'lucide-react';

interface LicenseData {
  licenseNumber: string;
  fullName: string;
  specialty: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate: string;
  status: 'active' | 'expired' | 'suspended' | 'revoked';
  restrictions: string[];
  verifiedAt: string;
  verificationSource: string;
}

interface LicenseValidationResult {
  isValid: boolean;
  licenseData?: LicenseData;
  errors: string[];
  warnings: string[];
}

export default function LicenseValidator() {
  const [licenseNumber, setLicenseNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<LicenseValidationResult | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  // Simular validación de licencia médica
  const validateLicense = async (): Promise<LicenseValidationResult> => {
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Validaciones básicas
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!licenseNumber.trim()) {
      errors.push('Número de licencia es requerido');
    }

    if (!fullName.trim()) {
      errors.push('Nombre completo es requerido');
    }

    if (!specialty.trim()) {
      errors.push('Especialidad es requerida');
    }

    if (errors.length > 0) {
      return { isValid: false, errors, warnings };
    }

    // Simular verificación con base de datos externa
    const mockLicenseData: LicenseData = {
      licenseNumber: licenseNumber,
      fullName: fullName,
      specialty: specialty,
      issuingAuthority: 'Colegio Médico de México',
      issueDate: '2020-03-15',
      expiryDate: '2025-03-15',
      status: 'active',
      restrictions: [],
      verifiedAt: new Date().toISOString(),
      verificationSource: 'Base de Datos Nacional de Profesiones'
    };

    // Simular diferentes escenarios
    if (licenseNumber === 'INVALID') {
      return {
        isValid: false,
        errors: ['Licencia no encontrada en la base de datos'],
        warnings: []
      };
    }

    if (licenseNumber === 'EXPIRED') {
      mockLicenseData.status = 'expired';
      mockLicenseData.expiryDate = '2023-12-01';
      warnings.push('Licencia expirada - requiere renovación');
    }

    if (licenseNumber === 'SUSPENDED') {
      mockLicenseData.status = 'suspended';
      mockLicenseData.restrictions = ['Suspensión temporal por 6 meses'];
      errors.push('Licencia suspendida temporalmente');
    }

    if (licenseNumber === 'RESTRICTED') {
      mockLicenseData.restrictions = ['Limitado a consulta ambulatoria'];
      warnings.push('Licencia con restricciones');
    }

    return {
      isValid: true,
      licenseData: mockLicenseData,
      errors: [],
      warnings
    };
  };

  const handleValidation = async () => {
    setLoading(true);
    setValidationResult(null);

    try {
      const result = await validateLicense();
      setValidationResult(result);
      
      if (result.isValid) {
        setIsVerified(true);
      }
    } catch (error) {
      setValidationResult({
        isValid: false,
        errors: ['Error en la validación. Intente nuevamente.'],
        warnings: []
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'revoked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'expired': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'suspended': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'revoked': return <XCircle className="h-5 w-5 text-red-600" />;
      default: return <AlertTriangle className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <Shield className="h-16 w-16 text-blue-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Validación de Licencia Médica
        </h1>
        <p className="text-gray-600">
          Verifique la validez de su licencia médica para acceder a la plataforma
        </p>
      </div>

      {/* Formulario de Validación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Información de Licencia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="licenseNumber">Número de Licencia</Label>
              <Input
                id="licenseNumber"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="Ej: MD123456"
                disabled={isVerified}
              />
            </div>
            <div>
              <Label htmlFor="fullName">Nombre Completo</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dr. Juan Pérez"
                disabled={isVerified}
              />
            </div>
            <div>
              <Label htmlFor="specialty">Especialidad</Label>
              <Input
                id="specialty"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="Medicina General"
                disabled={isVerified}
              />
            </div>
          </div>
          
          <div className="mt-6">
            <Button 
              onClick={handleValidation}
              disabled={loading || isVerified}
              className="w-full"
            >
              {loading ? 'Validando...' : 'Validar Licencia'}
            </Button>
          </div>

          {/* Casos de prueba */}
          {!isVerified && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Casos de prueba:</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setLicenseNumber('VALID');
                    setFullName('Dr. María González');
                    setSpecialty('Cardiología');
                  }}
                >
                  Válida
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setLicenseNumber('EXPIRED');
                    setFullName('Dr. Carlos Rodríguez');
                    setSpecialty('Medicina General');
                  }}
                >
                  Expirada
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setLicenseNumber('SUSPENDED');
                    setFullName('Dr. Ana Martínez');
                    setSpecialty('Ortopedia');
                  }}
                >
                  Suspendida
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setLicenseNumber('INVALID');
                    setFullName('Dr. Test');
                    setSpecialty('Test');
                  }}
                >
                  Inválida
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resultado de Validación */}
      {validationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {validationResult.isValid ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              Resultado de Validación
            </CardTitle>
          </CardHeader>
          <CardContent>
            {validationResult.isValid && validationResult.licenseData ? (
              <div className="space-y-4">
                {/* Estado de la licencia */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(validationResult.licenseData.status)}
                    <div>
                      <p className="font-medium">Estado de Licencia</p>
                      <Badge className={getStatusColor(validationResult.licenseData.status)}>
                        {validationResult.licenseData.status === 'active' ? 'Activa' :
                         validationResult.licenseData.status === 'expired' ? 'Expirada' :
                         validationResult.licenseData.status === 'suspended' ? 'Suspendida' :
                         'Revocada'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Información de la licencia */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Número de Licencia</Label>
                    <p className="font-medium">{validationResult.licenseData.licenseNumber}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Nombre Completo</Label>
                    <p className="font-medium">{validationResult.licenseData.fullName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Especialidad</Label>
                    <p className="font-medium">{validationResult.licenseData.specialty}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Autoridad Emisora</Label>
                    <p className="font-medium">{validationResult.licenseData.issuingAuthority}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Fecha de Emisión</Label>
                    <p className="font-medium">{validationResult.licenseData.issueDate}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Fecha de Expiración</Label>
                    <p className="font-medium">{validationResult.licenseData.expiryDate}</p>
                  </div>
                </div>

                {/* Restricciones */}
                {validationResult.licenseData.restrictions.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Restricciones</Label>
                    <div className="mt-2 space-y-2">
                      {validationResult.licenseData.restrictions.map((restriction, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <span className="text-yellow-800">{restriction}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Información de verificación */}
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Verificado el</Label>
                    <p>{new Date(validationResult.licenseData.verifiedAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Fuente de Verificación</Label>
                    <p>{validationResult.licenseData.verificationSource}</p>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-3">
                  <Button className="flex-1">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Verificar en Fuente Oficial
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Descargar Certificado
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Errores */}
                {validationResult.errors.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-red-600">Errores de Validación</Label>
                    <div className="mt-2 space-y-2">
                      {validationResult.errors.map((error, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span className="text-red-800">{error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Advertencias */}
                {validationResult.warnings.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-yellow-600">Advertencias</Label>
                    <div className="mt-2 space-y-2">
                      {validationResult.warnings.map((warning, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <span className="text-yellow-800">{warning}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-center">
                  <Button 
                    onClick={() => {
                      setValidationResult(null);
                      setIsVerified(false);
                    }}
                    variant="outline"
                  >
                    Intentar Nuevamente
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle>Información Importante</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-3">
              <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
              <p>La validación se realiza contra la base de datos oficial del Colegio Médico.</p>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-blue-600 mt-0.5" />
              <p>Se recomienda verificar la licencia cada 6 meses para mantener la información actualizada.</p>
            </div>
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 text-blue-600 mt-0.5" />
              <p>En caso de discrepancias, contacte directamente con la autoridad emisora de su licencia.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 