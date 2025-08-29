'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '../Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../Card';
import { Input } from '../Input';
import { Alert, AlertDescription } from '../../alert';
import { Loader2, CreditCard, Check, X, Shield } from 'lucide-react';

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
  },
};
/**
 * Payment Method Form Component
 * Secure payment method management for companies
 * PCI DSS compliant with Stripe Elements
 */

export interface PaymentMethodFormProps {
  companyId: string;
  customerId?: string;
  publicKey: string;
  onSuccess?: (paymentMethodId: string) => void;
  onError?: (error: Error) => void;
  onCancel?: () => void;
  mode?: 'add' | 'update';
}

// Card Element styling
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
      fontFamily: '"Inter", sans-serif',
    },
    invalid: {
      color: '#9e2146',
      iconColor: '#9e2146',
    },
  },
  hidePostalCode: false,
};

/**
 * Inner form component that uses Stripe hooks
 */
function PaymentMethodFormInner({
  companyId,
  customerId,
  onSuccess,
  onError,
  onCancel,
  mode = 'add',
}: Omit<PaymentMethodFormProps, 'publicKey'>) {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);
  const [billingDetails, setBillingDetails] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'AR', // Default to Argentina
    },
  });

  /**
   * Fetch setup intent from backend
   */
  const fetchSetupIntent = async () => {
    try {
      const response = await fetch('/api/v1/payment-methods/setup-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          companyId,
          customerId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize payment setup');
      }

      const data = await response.json();
      return data.clientSecret;
    } catch (err) {
      logger.error('Error fetching setup intent:', err);
      throw err;
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get client secret for setup intent
      const clientSecret = await fetchSetupIntent();

      // Get card element
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Confirm card setup
      const result = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: billingDetails.name,
            email: billingDetails.email,
            phone: billingDetails.phone,
            address: {
              line1: billingDetails.address.line1,
              line2: billingDetails.address.line2 || undefined,
              city: billingDetails.address.city,
              state: billingDetails.address.state,
              postal_code: billingDetails.address.postal_code,
              country: billingDetails.address.country,
            },
          },
        },
      });

      if (result.error) {
        throw new Error(result.error.message || 'Payment method setup failed');
      }

      if (result.setupIntent?.payment_method) {
        // Save payment method to backend
        await savePaymentMethod(result.setupIntent.payment_method as string);

        setSucceeded(true);
        onSuccess?.(result.setupIntent.payment_method as string);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Save payment method to backend
   */
  const savePaymentMethod = async (paymentMethodId: string) => {
    const response = await fetch('/api/v1/payment-methods', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        companyId,
        paymentMethodId,
        setAsDefault: true,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save payment method');
    }

    return response.json();
  };

  /**
   * Handle input changes
   */
  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('address.')) {
      const addressField = field.replace('address.', '');
      setBillingDetails((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else {
      setBillingDetails((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  if (succeeded) {
    return (
      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">Método de pago agregado</h3>
            <p className="text-sm text-gray-600">
              Tu método de pago ha sido configurado exitosamente y está listo para usar.
            </p>
            <Button onClick={() => window.location.reload()}>Continuar</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>
          {mode === 'add' ? 'Agregar método de pago' : 'Actualizar método de pago'}
        </CardTitle>
        <CardDescription>
          Ingresa los detalles de tu tarjeta de crédito o débito. Tu información está protegida con
          encriptación de nivel bancario.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Security Badge */}
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Shield className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-blue-800">
              Pago seguro procesado por Stripe. PCI DSS Level 1 certificado.
            </span>
          </div>

          {/* Billing Information */}
          <div className="space-y-4">
            <h3 className="font-medium">Información de facturación</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre completo *</label>
                <Input
                  type="text"
                  value={billingDetails.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  placeholder="Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <Input
                  type="email"
                  value={billingDetails.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  placeholder="juan@empresa.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Teléfono</label>
              <Input
                type="tel"
                value={billingDetails.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+54 11 1234-5678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Dirección *</label>
              <Input
                type="text"
                value={billingDetails.address.line1}
                onChange={(e) => handleInputChange('address.line1', e.target.value)}
                required
                placeholder="Av. Corrientes 1234"
                className="mb-2"
              />
              <Input
                type="text"
                value={billingDetails.address.line2}
                onChange={(e) => handleInputChange('address.line2', e.target.value)}
                placeholder="Piso 5, Depto B (opcional)"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Ciudad *</label>
                <Input
                  type="text"
                  value={billingDetails.address.city}
                  onChange={(e) => handleInputChange('address.city', e.target.value)}
                  required
                  placeholder="Buenos Aires"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Provincia *</label>
                <Input
                  type="text"
                  value={billingDetails.address.state}
                  onChange={(e) => handleInputChange('address.state', e.target.value)}
                  required
                  placeholder="CABA"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Código Postal *</label>
                <Input
                  type="text"
                  value={billingDetails.address.postal_code}
                  onChange={(e) => handleInputChange('address.postal_code', e.target.value)}
                  required
                  placeholder="C1414"
                />
              </div>
            </div>
          </div>

          {/* Card Details */}
          <div className="space-y-4">
            <h3 className="font-medium">Información de la tarjeta</h3>

            <div className="p-3 border rounded-lg">
              <CardElement options={cardElementOptions} />
            </div>

            <p className="text-xs text-gray-500">
              <CreditCard className="inline h-3 w-3 mr-1" />
              Aceptamos Visa, Mastercard, American Express y más.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancelar
            </Button>

            <Button type="submit" disabled={!stripe || loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>{mode === 'add' ? 'Agregar método de pago' : 'Actualizar método'}</>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/**
 * Main component with Stripe Elements provider
 */
export function PaymentMethodForm(props: PaymentMethodFormProps) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  useEffect(() => {
    if (props.publicKey && !stripePromise) {
      setStripePromise(loadStripe(props.publicKey));
    }
  }, [props.publicKey, stripePromise]);

  if (!stripePromise) {
    return (
      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentMethodFormInner {...props} />
    </Elements>
  );
}
