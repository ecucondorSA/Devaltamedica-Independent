'use client';

import React, { useState } from 'react';
import { Button } from '../Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../Card';
import { Badge } from '../Badge';
import { CreditCard, MoreVertical, Plus, Trash2, Star, AlertCircle, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../dropdown-menu';
import { Alert, AlertDescription } from '../../alert';

/**
 * Payment Methods List Component
 * Displays and manages company payment methods
 */

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_transfer' | 'mercadopago';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  bankName?: string;
  isDefault: boolean;
  createdAt: Date;
}

export interface PaymentMethodsListProps {
  companyId: string;
  paymentMethods: PaymentMethod[];
  loading?: boolean;
  onAddMethod?: () => void;
  onRemoveMethod?: (methodId: string) => Promise<void>;
  onSetDefault?: (methodId: string) => Promise<void>;
  maxMethods?: number;
}

export function PaymentMethodsList({
  companyId,
  paymentMethods,
  loading = false,
  onAddMethod,
  onRemoveMethod,
  onSetDefault,
  maxMethods = 5,
}: PaymentMethodsListProps) {
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /**
   * Get card brand icon
   */
  const getCardIcon = (brand?: string) => {
    const brandLower = brand?.toLowerCase();

    // In a real app, you'd have actual brand icons
    const brandColors: Record<string, string> = {
      visa: 'text-blue-600',
      mastercard: 'text-red-600',
      amex: 'text-blue-500',
      discover: 'text-orange-500',
      default: 'text-gray-600',
    };

    return (
      <CreditCard
        className={`h-8 w-8 ${brandColors[brandLower || 'default'] || brandColors.default}`}
      />
    );
  };

  /**
   * Format expiry date
   */
  const formatExpiry = (month?: number, year?: number) => {
    if (!month || !year) return 'N/A';
    return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
  };

  /**
   * Handle remove payment method
   */
  const handleRemove = async (methodId: string) => {
    if (!onRemoveMethod) return;

    setRemovingId(methodId);
    setError(null);
    setSuccessMessage(null);

    try {
      await onRemoveMethod(methodId);
      setSuccessMessage('Método de pago eliminado exitosamente');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar método de pago');
    } finally {
      setRemovingId(null);
    }
  };

  /**
   * Handle set default payment method
   */
  const handleSetDefault = async (methodId: string) => {
    if (!onSetDefault) return;

    setSettingDefaultId(methodId);
    setError(null);
    setSuccessMessage(null);

    try {
      await onSetDefault(methodId);
      setSuccessMessage('Método de pago predeterminado actualizado');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar método predeterminado');
    } finally {
      setSettingDefaultId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Métodos de Pago</h2>
          <p className="text-gray-600 mt-1">Administra los métodos de pago de tu empresa</p>
        </div>

        {onAddMethod && paymentMethods.length < maxMethods && (
          <Button onClick={onAddMethod}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar método
          </Button>
        )}
      </div>

      {/* Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="border-green-200 bg-green-50">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Payment Methods Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : paymentMethods.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay métodos de pago configurados</h3>
            <p className="text-gray-600 mb-6">
              Agrega un método de pago para comenzar a usar los servicios premium
            </p>
            {onAddMethod && (
              <Button onClick={onAddMethod}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar primer método
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paymentMethods.map((method) => (
            <Card key={method.id} className={method.isDefault ? 'border-blue-500' : ''}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    {getCardIcon(method.brand)}
                    <div>
                      <CardTitle className="text-base">
                        {method.type === 'card' ? (
                          <>
                            {method.brand || 'Tarjeta'} •••• {method.last4}
                          </>
                        ) : method.type === 'bank_transfer' ? (
                          <>{method.bankName || 'Transferencia Bancaria'}</>
                        ) : (
                          'MercadoPago'
                        )}
                      </CardTitle>
                      <CardDescription>
                        {method.type === 'card' && (
                          <>Vence: {formatExpiry(method.expiryMonth, method.expiryYear)}</>
                        )}
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {method.isDefault && (
                      <Badge className="bg-blue-100 text-blue-700">
                        <Star className="h-3 w-3 mr-1" />
                        Predeterminado
                      </Badge>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!method.isDefault && onSetDefault && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleSetDefault(method.id)}
                              disabled={settingDefaultId === method.id}
                            >
                              <Star className="h-4 w-4 mr-2" />
                              Establecer como predeterminado
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        {onRemoveMethod && (
                          <DropdownMenuItem
                            onClick={() => handleRemove(method.id)}
                            disabled={removingId === method.id || method.isDefault}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {method.isDefault
                              ? 'No se puede eliminar (predeterminado)'
                              : 'Eliminar'}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="text-xs text-gray-500">
                  Agregado el {new Date(method.createdAt).toLocaleDateString('es-AR')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Max methods warning */}
      {paymentMethods.length >= maxMethods && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Has alcanzado el límite máximo de {maxMethods} métodos de pago. Elimina un método
            existente para agregar uno nuevo.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
