'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Button,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@altamedica/ui';
import { 
  DollarSign, 
  TrendingUp, 
  Receipt, 
  CreditCard, 
  Download, 
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

import { logger } from '@altamedica/shared/services/logger.service';
/**
 * Billing Dashboard Page
 * Complete billing management for companies
 * Shows invoices, payments, and accounting reports
 */

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  total: number;
  currency: string;
  issuedAt: Date;
  dueAt: Date;
  paidAt?: Date;
  periodStart: Date;
  periodEnd: Date;
}

interface BillingMetrics {
  currentMonthRevenue: number;
  previousMonthRevenue: number;
  outstandingBalance: number;
  nextPaymentDate?: Date;
  nextPaymentAmount?: number;
  totalPaidThisYear: number;
}

interface Subscription {
  id: string;
  planName: string;
  status: string;
  price: number;
  interval: string;
  currentPeriodEnd: Date;
  cancelAt?: Date;
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [metrics, setMetrics] = useState<BillingMetrics | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      
      // Mock data for now - replace with actual API calls
      const mockInvoices: Invoice[] = [
        {
          id: 'inv_1',
          invoiceNumber: 'INV-2025-000001',
          status: 'paid',
          total: 5000,
          currency: 'ARS',
          issuedAt: new Date('2025-01-01'),
          dueAt: new Date('2025-01-31'),
          paidAt: new Date('2025-01-15'),
          periodStart: new Date('2025-01-01'),
          periodEnd: new Date('2025-01-31')
        },
        {
          id: 'inv_2',
          invoiceNumber: 'INV-2025-000002',
          status: 'open',
          total: 5000,
          currency: 'ARS',
          issuedAt: new Date('2025-02-01'),
          dueAt: new Date('2025-02-28'),
          periodStart: new Date('2025-02-01'),
          periodEnd: new Date('2025-02-28')
        }
      ];

      const mockMetrics: BillingMetrics = {
        currentMonthRevenue: 5000,
        previousMonthRevenue: 4500,
        outstandingBalance: 5000,
        nextPaymentDate: new Date('2025-02-28'),
        nextPaymentAmount: 5000,
        totalPaidThisYear: 5000
      };

      const mockSubscription: Subscription = {
        id: 'sub_1',
        planName: 'Plan Profesional',
        status: 'active',
        price: 5000,
        interval: 'mensual',
        currentPeriodEnd: new Date('2025-02-28')
      };

      setInvoices(mockInvoices);
      setMetrics(mockMetrics);
      setSubscription(mockSubscription);
    } catch (error) {
      logger.error('Error fetching billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (invoiceId: string) => {
    try {
      // Mock download - replace with actual implementation
      logger.info('Downloading invoice:', invoiceId);
      alert('Descarga de factura iniciada');
    } catch (error) {
      logger.error('Error downloading invoice:', error);
    }
  };

  const formatCurrency = (amount: number, currency = 'ARS') => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any }> = {
      paid: { color: 'bg-green-500', icon: CheckCircle },
      open: { color: 'bg-blue-500', icon: Clock },
      draft: { color: 'bg-gray-500', icon: FileText },
      void: { color: 'bg-red-500', icon: X },
      uncollectible: { color: 'bg-orange-500', icon: AlertCircle }
    };

    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="h-3 w-3 mr-1" />
        {status === 'paid' ? 'Pagado' : status === 'open' ? 'Abierto' : status}
      </Badge>
    );
  };

  const calculateRevenueChange = () => {
    if (!metrics) return null;
    
    const change = ((metrics.currentMonthRevenue - metrics.previousMonthRevenue) / 
                    metrics.previousMonthRevenue) * 100;
    
    return {
      percentage: Math.abs(change).toFixed(1),
      isPositive: change >= 0
    };
  };

  const revenueChange = calculateRevenueChange();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Facturación</h1>
          <p className="text-gray-600 mt-2">
            Gestiona tus facturas y pagos
          </p>
        </div>
        
        <Button variant="outline">
          <CreditCard className="h-4 w-4 mr-2" />
          Métodos de Pago
        </Button>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Ingresos Este Mes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(metrics.currentMonthRevenue)}
              </div>
              {revenueChange && (
                <div className={`flex items-center text-sm mt-1 ${
                  revenueChange.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {revenueChange.isPositive ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  <span>{revenueChange.percentage}% vs mes anterior</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Saldo Pendiente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(metrics.outstandingBalance)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Facturas sin pagar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Próximo Pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.nextPaymentAmount 
                  ? formatCurrency(metrics.nextPaymentAmount)
                  : 'N/A'
                }
              </div>
              {metrics.nextPaymentDate && (
                <p className="text-xs text-gray-500 mt-1">
                  {format(new Date(metrics.nextPaymentDate), "d 'de' MMMM", { locale: es })}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Año {new Date().getFullYear()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(metrics.totalPaidThisYear)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Pagos completados
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Subscription Info */}
      {subscription && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Plan Actual: {subscription.planName}</CardTitle>
                <CardDescription>
                  {formatCurrency(subscription.price)} / {subscription.interval}
                </CardDescription>
              </div>
              <Badge className={
                subscription.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
              }>
                {subscription.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                <p>Próxima renovación: {
                  format(new Date(subscription.currentPeriodEnd), "d 'de' MMMM, yyyy", { locale: es })
                }</p>
                {subscription.cancelAt && (
                  <p className="text-red-600 mt-1">
                    Cancelación programada para: {
                      format(new Date(subscription.cancelAt), "d 'de' MMMM, yyyy", { locale: es })
                    }
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Cambiar Plan
                </Button>
                {!subscription.cancelAt && (
                  <Button variant="outline" size="sm" className="text-red-600">
                    Cancelar Suscripción
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="invoices">Facturas</TabsTrigger>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Facturas Recientes</CardTitle>
              <CardDescription>
                Últimas 5 facturas emitidas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {invoices.slice(0, 5).map((invoice) => (
                  <div 
                    key={invoice.id}
                    className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedInvoice(invoice)}
                  >
                    <div className="flex items-center gap-3">
                      <Receipt className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(invoice.issuedAt), "d 'de' MMMM, yyyy", { locale: es })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(invoice.status)}
                      <span className="font-medium">
                        {formatCurrency(invoice.total, invoice.currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Activity Chart would go here */}
          <Card>
            <CardHeader>
              <CardTitle>Actividad de Pagos</CardTitle>
              <CardDescription>
                Últimos 12 meses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <TrendingUp className="h-8 w-8 mr-2" />
                Gráfico de actividad de pagos
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Todas las Facturas</CardTitle>
                  <CardDescription>
                    Historial completo de facturación
                  </CardDescription>
                </div>
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Todo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Número</th>
                      <th className="text-left py-2">Fecha</th>
                      <th className="text-left py-2">Período</th>
                      <th className="text-left py-2">Estado</th>
                      <th className="text-right py-2">Monto</th>
                      <th className="text-center py-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 font-medium">
                          {invoice.invoiceNumber}
                        </td>
                        <td className="py-3">
                          {format(new Date(invoice.issuedAt), 'dd/MM/yyyy')}
                        </td>
                        <td className="py-3 text-sm text-gray-600">
                          {format(new Date(invoice.periodStart), 'MMM yyyy', { locale: es })}
                        </td>
                        <td className="py-3">
                          {getStatusBadge(invoice.status)}
                        </td>
                        <td className="py-3 text-right font-medium">
                          {formatCurrency(invoice.total, invoice.currency)}
                        </td>
                        <td className="py-3 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadInvoice(invoice.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reportes Contables</CardTitle>
              <CardDescription>
                Exporta datos para tu contador
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-dashed">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Libro IVA Ventas</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Formato AFIP compatible
                        </p>
                      </div>
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Exportar
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-dashed">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Resumen Mensual</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Ingresos y gastos detallados
                        </p>
                      </div>
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Exportar
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-dashed">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Estado de Cuenta</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Movimientos y saldos
                        </p>
                      </div>
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Exportar
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-dashed">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Facturas Electrónicas</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          XML para AFIP
                        </p>
                      </div>
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Exportar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">
                      Reportes Personalizados
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                      ¿Necesitas un reporte específico? Contacta a soporte para 
                      configurar exportaciones personalizadas según los 
                      requerimientos de tu contador.
                    </p>
                    <Button variant="link" className="text-blue-700 p-0 h-auto mt-2">
                      Solicitar Reporte Personalizado →
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Factura {selectedInvoice.invoiceNumber}</CardTitle>
                  <CardDescription>
                    Emitida el {format(new Date(selectedInvoice.issuedAt), "d 'de' MMMM, yyyy", { locale: es })}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedInvoice(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Estado:</span>
                  {getStatusBadge(selectedInvoice.status)}
                </div>
                <div className="flex justify-between">
                  <span>Período:</span>
                  <span>
                    {format(new Date(selectedInvoice.periodStart), 'dd/MM/yyyy')} - 
                    {format(new Date(selectedInvoice.periodEnd), 'dd/MM/yyyy')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Vencimiento:</span>
                  <span>{format(new Date(selectedInvoice.dueAt), 'dd/MM/yyyy')}</span>
                </div>
                {selectedInvoice.paidAt && (
                  <div className="flex justify-between">
                    <span>Pagado el:</span>
                    <span>{format(new Date(selectedInvoice.paidAt), 'dd/MM/yyyy')}</span>
                  </div>
                )}
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-medium">
                    <span>Total:</span>
                    <span>{formatCurrency(selectedInvoice.total, selectedInvoice.currency)}</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button 
                    className="flex-1"
                    onClick={() => {
                      downloadInvoice(selectedInvoice.id);
                      setSelectedInvoice(null);
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar PDF
                  </Button>
                  {selectedInvoice.status === 'open' && (
                    <Button className="flex-1" variant="outline">
                      Pagar Ahora
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
