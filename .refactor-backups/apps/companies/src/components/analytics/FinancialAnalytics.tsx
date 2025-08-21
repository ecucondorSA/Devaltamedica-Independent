import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger } from '@altamedica/ui';

// Componente Progress simple
const Progress = ({ value, className }: { value: number; className?: string }) => (
  <div className={`bg-gray-200 rounded-full overflow-hidden ${className}`}>
    <div 
      className="bg-blue-500 h-full transition-all duration-300"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

import {
    AlertCircle,
    Banknote,
    Calculator,
    CheckCircle,
    Clock,
    CreditCard,
    DollarSign,
    Receipt,
    Target,
    TrendingDown,
    TrendingUp
} from 'lucide-react';
import React, { useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ComposedChart,
    Legend,
    Line,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

// Interfaces para analytics financieros
interface FinancialMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  averageTransactionValue: number;
  collectionRate: number;
  outstandingAmount: number;
  cashFlow: number;
}

interface RevenueBreakdown {
  source: string;
  amount: number;
  percentage: number;
  growth: number;
  trend: 'up' | 'down' | 'stable';
}

interface ExpenseBreakdown {
  category: string;
  amount: number;
  percentage: number;
  budgetVariance: number;
  priority: 'high' | 'medium' | 'low';
}

interface FinancialTrend {
  period: string;
  revenue: number;
  expenses: number;
  profit: number;
  margin: number;
  cashFlow: number;
}

interface PaymentMethods {
  method: string;
  transactions: number;
  amount: number;
  processingFee: number;
  successRate: number;
}

interface BillingCycle {
  service: string;
  billedAmount: number;
  collectedAmount: number;
  pendingAmount: number;
  overdue: number;
  averageCollectionTime: number;
}

interface ProfitabilityAnalysis {
  department: string;
  revenue: number;
  directCosts: number;
  indirectCosts: number;
  grossProfit: number;
  grossMargin: number;
  netProfit: number;
  netMargin: number;
}

const FinancialAnalytics: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'EUR' | 'MXN'>('USD');

  // Métricas financieras principales
  const financialMetrics: FinancialMetrics = {
    totalRevenue: 456789,
    totalExpenses: 324567,
    netProfit: 132222,
    profitMargin: 28.9,
    averageTransactionValue: 125.50,
    collectionRate: 94.2,
    outstandingAmount: 45678,
    cashFlow: 87111
  };

  // Desglose de ingresos
  const revenueBreakdown: RevenueBreakdown[] = [
    { source: 'Consultas Médicas', amount: 234567, percentage: 51.3, growth: 12.5, trend: 'up' },
    { source: 'Procedimientos', amount: 123456, percentage: 27.0, growth: 8.7, trend: 'up' },
    { source: 'Servicios de Laboratorio', amount: 67890, percentage: 14.9, growth: -2.3, trend: 'down' },
    { source: 'Telemedicina', amount: 20876, percentage: 4.6, growth: 45.2, trend: 'up' },
    { source: 'Otros Servicios', amount: 10000, percentage: 2.2, growth: 0.0, trend: 'stable' }
  ];

  // Desglose de gastos
  const expenseBreakdown: ExpenseBreakdown[] = [
    { category: 'Salarios y Beneficios', amount: 165000, percentage: 50.8, budgetVariance: 2.3, priority: 'high' },
    { category: 'Equipamiento Médico', amount: 75000, percentage: 23.1, budgetVariance: -5.2, priority: 'high' },
    { category: 'Suministros Médicos', amount: 32000, percentage: 9.9, budgetVariance: 8.7, priority: 'medium' },
    { category: 'Servicios Públicos', amount: 25000, percentage: 7.7, budgetVariance: 12.1, priority: 'medium' },
    { category: 'Marketing', amount: 15000, percentage: 4.6, budgetVariance: -15.3, priority: 'low' },
    { category: 'Seguros', amount: 12567, percentage: 3.9, budgetVariance: 1.2, priority: 'high' }
  ];

  // Tendencias financieras
  const financialTrends: FinancialTrend[] = [
    { period: 'Ene', revenue: 38000, expenses: 27000, profit: 11000, margin: 28.9, cashFlow: 9500 },
    { period: 'Feb', revenue: 42000, expenses: 29000, profit: 13000, margin: 31.0, cashFlow: 11800 },
    { period: 'Mar', revenue: 39000, expenses: 28000, profit: 11000, margin: 28.2, cashFlow: 10200 },
    { period: 'Abr', revenue: 45000, expenses: 31000, profit: 14000, margin: 31.1, cashFlow: 12600 },
    { period: 'May', revenue: 48000, expenses: 33000, profit: 15000, margin: 31.3, cashFlow: 13800 },
    { period: 'Jun', revenue: 44000, expenses: 30000, profit: 14000, margin: 31.8, cashFlow: 12900 }
  ];

  // Métodos de pago
  const paymentMethods: PaymentMethods[] = [
    { method: 'Tarjeta de Crédito', transactions: 1234, amount: 187000, processingFee: 5610, successRate: 97.8 },
    { method: 'Tarjeta de Débito', transactions: 987, amount: 142000, processingFee: 2840, successRate: 98.9 },
    { method: 'Transferencia Bancaria', transactions: 456, amount: 89000, processingFee: 445, successRate: 99.5 },
    { method: 'Efectivo', transactions: 789, amount: 32000, processingFee: 0, successRate: 100.0 },
    { method: 'Cheque', transactions: 123, amount: 6789, processingFee: 123, successRate: 95.1 }
  ];

  // Ciclo de facturación
  const billingCycle: BillingCycle[] = [
    { service: 'Medicina General', billedAmount: 125000, collectedAmount: 118000, pendingAmount: 5500, overdue: 1500, averageCollectionTime: 15 },
    { service: 'Especialidades', billedAmount: 89000, collectedAmount: 84000, pendingAmount: 3500, overdue: 1500, averageCollectionTime: 18 },
    { service: 'Procedimientos', billedAmount: 67000, collectedAmount: 61000, pendingAmount: 4500, overdue: 1500, averageCollectionTime: 22 },
    { service: 'Laboratorio', billedAmount: 45000, collectedAmount: 43000, pendingAmount: 1500, overdue: 500, averageCollectionTime: 12 },
    { service: 'Telemedicina', billedAmount: 23000, collectedAmount: 22500, pendingAmount: 400, overdue: 100, averageCollectionTime: 8 }
  ];

  // Análisis de rentabilidad
  const profitabilityAnalysis: ProfitabilityAnalysis[] = [
    {
      department: 'Cardiología',
      revenue: 145000,
      directCosts: 87000,
      indirectCosts: 23000,
      grossProfit: 58000,
      grossMargin: 40.0,
      netProfit: 35000,
      netMargin: 24.1
    },
    {
      department: 'Pediatría',
      revenue: 89000,
      directCosts: 45000,
      indirectCosts: 18000,
      grossProfit: 44000,
      grossMargin: 49.4,
      netProfit: 26000,
      netMargin: 29.2
    },
    {
      department: 'Dermatología',
      revenue: 67000,
      directCosts: 32000,
      indirectCosts: 12000,
      grossProfit: 35000,
      grossMargin: 52.2,
      netProfit: 23000,
      netMargin: 34.3
    },
    {
      department: 'Medicina General',
      revenue: 156000,
      directCosts: 98000,
      indirectCosts: 28000,
      grossProfit: 58000,
      grossMargin: 37.2,
      netProfit: 30000,
      netMargin: 19.2
    }
  ];

  const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const formatCurrency = (amount: number) => {
    const currencySymbol = selectedCurrency === 'USD' ? '$' : selectedCurrency === 'EUR' ? '€' : '$';
    return `${currencySymbol}${amount.toLocaleString()}`;
  };

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    change?: number;
    icon: React.ComponentType<any>;
    color: string;
    description: string;
    format?: 'currency' | 'percentage' | 'number';
  }> = ({ title, value, change, icon: Icon, color, description, format = 'number' }) => {
    const formattedValue = format === 'currency' ? formatCurrency(Number(value)) : 
                          format === 'percentage' ? `${value}%` : value;

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className={`h-4 w-4 ${color}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formattedValue}</div>
          {change !== undefined && (
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              {change > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span className={change > 0 ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(change)}%
              </span>
              <span>vs período anterior</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Financieros</h2>
          <p className="text-muted-foreground">
            Análisis completo del rendimiento financiero de la clínica
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="w-[150px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="month">Mensual</option>
            <option value="quarter">Trimestral</option>
            <option value="year">Anual</option>
          </select>
          <select 
            value={selectedCurrency} 
            onChange={(e) => setSelectedCurrency(e.target.value as any)}
            className="w-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="MXN">MXN</option>
          </select>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Ingresos Totales"
          value={financialMetrics.totalRevenue}
          change={15.3}
          icon={DollarSign}
          color="text-green-600"
          description="Ingresos del período"
          format="currency"
        />
        <MetricCard
          title="Gastos Totales"
          value={financialMetrics.totalExpenses}
          change={8.7}
          icon={Receipt}
          color="text-red-600"
          description="Gastos operativos"
          format="currency"
        />
        <MetricCard
          title="Ganancia Neta"
          value={financialMetrics.netProfit}
          change={23.5}
          icon={TrendingUp}
          color="text-blue-600"
          description="Beneficio después de gastos"
          format="currency"
        />
        <MetricCard
          title="Margen de Ganancia"
          value={financialMetrics.profitMargin}
          change={2.1}
          icon={Calculator}
          color="text-purple-600"
          description="Porcentaje de rentabilidad"
          format="percentage"
        />
      </div>

      {/* Métricas secundarias */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Valor Promedio Transacción"
          value={financialMetrics.averageTransactionValue}
          change={5.2}
          icon={CreditCard}
          color="text-orange-600"
          description="Valor promedio por transacción"
          format="currency"
        />
        <MetricCard
          title="Tasa de Cobro"
          value={financialMetrics.collectionRate}
          change={1.8}
          icon={CheckCircle}
          color="text-green-600"
          description="Porcentaje de cobros exitosos"
          format="percentage"
        />
        <MetricCard
          title="Monto Pendiente"
          value={financialMetrics.outstandingAmount}
          change={-12.3}
          icon={Clock}
          color="text-yellow-600"
          description="Cuentas por cobrar"
          format="currency"
        />
        <MetricCard
          title="Flujo de Caja"
          value={financialMetrics.cashFlow}
          change={18.9}
          icon={Banknote}
          color="text-blue-600"
          description="Flujo de caja neto"
          format="currency"
        />
      </div>

      {/* Tabs de análisis */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="revenue">Ingresos</TabsTrigger>
          <TabsTrigger value="expenses">Gastos</TabsTrigger>
          <TabsTrigger value="payments">Pagos</TabsTrigger>
          <TabsTrigger value="billing">Facturación</TabsTrigger>
          <TabsTrigger value="profitability">Rentabilidad</TabsTrigger>
        </TabsList>

        {/* Resumen */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tendencias Financieras</CardTitle>
                <CardDescription>Evolución de ingresos, gastos y ganancias</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={financialTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        name === 'margin' ? `${value}%` : formatCurrency(value),
                        name === 'revenue' ? 'Ingresos' : 
                        name === 'expenses' ? 'Gastos' : 
                        name === 'profit' ? 'Ganancia' : 'Margen'
                      ]}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="revenue" fill="#00C49F" name="Ingresos" />
                    <Bar yAxisId="left" dataKey="expenses" fill="#FF8042" name="Gastos" />
                    <Line yAxisId="right" type="monotone" dataKey="margin" stroke="#0088FE" strokeWidth={3} name="Margen %" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Flujo de Caja</CardTitle>
                <CardDescription>Movimiento de efectivo por período</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={financialTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any) => [formatCurrency(value), 'Flujo de Caja']}
                    />
                    <Area type="monotone" dataKey="cashFlow" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Indicadores Clave</CardTitle>
                <CardDescription>Métricas de rendimiento financiero</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Margen Operativo</span>
                      <span className="text-sm text-muted-foreground">{financialMetrics.profitMargin}%</span>
                    </div>
                    <Progress value={financialMetrics.profitMargin} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Tasa de Cobro</span>
                      <span className="text-sm text-muted-foreground">{financialMetrics.collectionRate}%</span>
                    </div>
                    <Progress value={financialMetrics.collectionRate} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Eficiencia Operativa</span>
                      <span className="text-sm text-muted-foreground">87.3%</span>
                    </div>
                    <Progress value={87.3} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alertas Financieras</CardTitle>
                <CardDescription>Indicadores que requieren atención</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Gastos de Marketing</p>
                      <p className="text-xs text-muted-foreground">
                        15.3% por debajo del presupuesto
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Flujo de Caja</p>
                      <p className="text-xs text-muted-foreground">
                        Positivo por 6 meses consecutivos
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Target className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Objetivo Q2</p>
                      <p className="text-xs text-muted-foreground">
                        92% de cumplimiento del objetivo
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Proyección</CardTitle>
                <CardDescription>Estimaciones para el próximo período</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Ingresos Proyectados</span>
                    <span className="text-sm font-semibold text-green-600">{formatCurrency(520000)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Gastos Estimados</span>
                    <span className="text-sm font-semibold text-red-600">{formatCurrency(350000)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Ganancia Proyectada</span>
                    <span className="text-sm font-semibold text-blue-600">{formatCurrency(170000)}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Margen Proyectado</span>
                      <Badge variant="secondary">32.7%</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Ingresos */}
        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Fuentes de Ingresos</CardTitle>
                <CardDescription>Distribución por tipo de servicio</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={revenueBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ source, percentage }) => `${source}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {revenueBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [formatCurrency(value), 'Ingresos']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Crecimiento por Fuente</CardTitle>
                <CardDescription>Variación vs período anterior</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="source" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any) => [`${value}%`, 'Crecimiento']}
                    />
                    <Bar dataKey="growth" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detalles de Ingresos</CardTitle>
              <CardDescription>Análisis detallado por fuente de ingresos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {revenueBreakdown.map((source, index) => (
                  <div key={source.source} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: colors[index % colors.length] }}
                        />
                        <h4 className="font-semibold">{source.source}</h4>
                        <Badge className={`text-xs ${
                          source.trend === 'up' ? 'bg-green-100 text-green-800' :
                          source.trend === 'down' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {source.trend === 'up' ? '↗' : source.trend === 'down' ? '↘' : '→'} {Math.abs(source.growth)}%
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(source.amount)}</p>
                        <p className="text-sm text-muted-foreground">{source.percentage}% del total</p>
                      </div>
                    </div>
                    <Progress value={source.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gastos */}
        <TabsContent value="expenses" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Gastos</CardTitle>
                <CardDescription>Gastos por categoría</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expenseBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percentage }) => `${category}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {expenseBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [formatCurrency(value), 'Gastos']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Variación vs Presupuesto</CardTitle>
                <CardDescription>Desviación del presupuesto planificado</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={expenseBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any) => [`${value}%`, 'Variación']}
                    />
                    <Bar dataKey="budgetVariance" fill="#FF8042" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Análisis de Gastos</CardTitle>
              <CardDescription>Detalles por categoría de gasto</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expenseBreakdown.map((expense, index) => (
                  <div key={expense.category} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: colors[index % colors.length] }}
                        />
                        <h4 className="font-semibold">{expense.category}</h4>
                        <Badge className={`text-xs ${
                          expense.priority === 'high' ? 'bg-red-100 text-red-800' :
                          expense.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {expense.priority === 'high' ? 'Alta Prioridad' :
                           expense.priority === 'medium' ? 'Media Prioridad' :
                           'Baja Prioridad'}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(expense.amount)}</p>
                        <p className="text-sm text-muted-foreground">{expense.percentage}% del total</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Variación vs presupuesto:</span>
                      <span className={`font-medium ${
                        expense.budgetVariance > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {expense.budgetVariance > 0 ? '+' : ''}{expense.budgetVariance}%
                      </span>
                    </div>
                    <Progress value={expense.percentage} className="h-2 mt-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pagos */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Métodos de Pago</CardTitle>
              <CardDescription>Análisis de transacciones por método de pago</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentMethods.map((method, index) => (
                  <div key={method.method} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                        <h4 className="font-semibold">{method.method}</h4>
                      </div>
                      <Badge variant="secondary">{method.successRate}% éxito</Badge>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Transacciones</p>
                        <p className="font-medium">{method.transactions}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Monto Total</p>
                        <p className="font-medium">{formatCurrency(method.amount)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Comisiones</p>
                        <p className="font-medium">{formatCurrency(method.processingFee)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Tasa de Éxito</p>
                        <p className="font-medium text-green-600">{method.successRate}%</p>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <Progress value={method.successRate} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Facturación */}
        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ciclo de Facturación</CardTitle>
              <CardDescription>Estado de cuentas por cobrar por servicio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {billingCycle.map((billing, index) => (
                  <div key={billing.service} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{billing.service}</h4>
                      <Badge variant="outline">
                        {Math.round((billing.collectedAmount / billing.billedAmount) * 100)}% cobrado
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-5 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-muted-foreground">Facturado</p>
                        <p className="font-medium">{formatCurrency(billing.billedAmount)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Cobrado</p>
                        <p className="font-medium text-green-600">{formatCurrency(billing.collectedAmount)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Pendiente</p>
                        <p className="font-medium text-yellow-600">{formatCurrency(billing.pendingAmount)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Vencido</p>
                        <p className="font-medium text-red-600">{formatCurrency(billing.overdue)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Tiempo Cobro</p>
                        <p className="font-medium">{billing.averageCollectionTime} días</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Cobrado</span>
                          <span>{Math.round((billing.collectedAmount / billing.billedAmount) * 100)}%</span>
                        </div>
                        <Progress value={(billing.collectedAmount / billing.billedAmount) * 100} className="h-1" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Pendiente</span>
                          <span>{Math.round((billing.pendingAmount / billing.billedAmount) * 100)}%</span>
                        </div>
                        <Progress value={(billing.pendingAmount / billing.billedAmount) * 100} className="h-1" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Vencido</span>
                          <span>{Math.round((billing.overdue / billing.billedAmount) * 100)}%</span>
                        </div>
                        <Progress value={(billing.overdue / billing.billedAmount) * 100} className="h-1" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rentabilidad */}
        <TabsContent value="profitability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Rentabilidad por Departamento</CardTitle>
              <CardDescription>Comparación de rentabilidad entre departamentos</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={profitabilityAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      name === 'grossMargin' || name === 'netMargin' ? `${value}%` : formatCurrency(value),
                      name === 'revenue' ? 'Ingresos' : 
                      name === 'grossProfit' ? 'Ganancia Bruta' :
                      name === 'netProfit' ? 'Ganancia Neta' :
                      name === 'grossMargin' ? 'Margen Bruto' :
                      'Margen Neto'
                    ]}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="revenue" fill="#0088FE" name="Ingresos" />
                  <Bar yAxisId="left" dataKey="grossProfit" fill="#00C49F" name="Ganancia Bruta" />
                  <Bar yAxisId="left" dataKey="netProfit" fill="#FFBB28" name="Ganancia Neta" />
                  <Line yAxisId="right" type="monotone" dataKey="netMargin" stroke="#FF8042" strokeWidth={2} name="Margen Neto %" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {profitabilityAnalysis.map((dept, index) => (
              <Card key={dept.department}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{dept.department}</CardTitle>
                  <Badge variant="secondary">{dept.netMargin}% margen neto</Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ingresos:</span>
                      <span className="font-medium">{formatCurrency(dept.revenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Costos directos:</span>
                      <span className="font-medium">{formatCurrency(dept.directCosts)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Costos indirectos:</span>
                      <span className="font-medium">{formatCurrency(dept.indirectCosts)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-muted-foreground">Ganancia neta:</span>
                      <span className="font-medium text-green-600">{formatCurrency(dept.netProfit)}</span>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Margen bruto</span>
                      <span>{dept.grossMargin}%</span>
                    </div>
                    <Progress value={dept.grossMargin} className="h-1" />
                    <div className="flex justify-between text-xs">
                      <span>Margen neto</span>
                      <span>{dept.netMargin}%</span>
                    </div>
                    <Progress value={dept.netMargin} className="h-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialAnalytics;
