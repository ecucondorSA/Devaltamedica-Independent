import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger } from '@altamedica/ui';
import {
    Activity,
    CalendarDays,
    Clock,
    DollarSign,
    Download,
    RefreshCw,
    TrendingUp,
    UserCheck,
    Users
} from 'lucide-react';
import React, { useState } from 'react';
import { logger } from '@altamedica/shared/services/logger.service';
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
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

// Interfaces para los datos de analytics
interface KPIMetric {
  title: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ComponentType;
  description: string;
}

interface TimeSeriesData {
  date: string;
  appointments: number;
  revenue: number;
  patients: number;
  efficiency: number;
}

interface PatientDemographics {
  ageGroup: string;
  count: number;
  percentage: number;
}

interface DoctorPerformance {
  doctorId: string;
  name: string;
  specialization: string;
  appointmentsCompleted: number;
  averageRating: number;
  revenue: number;
  efficiency: number;
}

interface FinancialMetrics {
  period: string;
  revenue: number;
  expenses: number;
  profit: number;
  margin: number;
}

const AnalyticsDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<string>('overview');
  const [isLoading, setIsLoading] = useState(false);

  // KPIs principales
  const kpiMetrics: KPIMetric[] = [
    {
      title: 'Citas Totales',
      value: '2,847',
      change: 12.5,
      changeType: 'increase',
      icon: CalendarDays,
      description: 'Citas agendadas este mes'
    },
    {
      title: 'Pacientes Activos',
      value: '1,234',
      change: 8.2,
      changeType: 'increase',
      icon: Users,
      description: 'Pacientes con citas recientes'
    },
    {
      title: 'Ingresos',
      value: '$127,450',
      change: 15.3,
      changeType: 'increase',
      icon: DollarSign,
      description: 'Ingresos totales del mes'
    },
    {
      title: 'Eficiencia',
      value: '94.2%',
      change: -2.1,
      changeType: 'decrease',
      icon: TrendingUp,
      description: 'Porcentaje de citas completadas'
    },
    {
      title: 'Satisfacción',
      value: '4.8/5',
      change: 0.3,
      changeType: 'increase',
      icon: Activity,
      description: 'Rating promedio de pacientes'
    },
    {
      title: 'Tiempo Promedio',
      value: '23 min',
      change: -5.2,
      changeType: 'increase',
      icon: Clock,
      description: 'Duración promedio de citas'
    }
  ];

  // Datos de series de tiempo
  const timeSeriesData: TimeSeriesData[] = [
    { date: '2024-01-01', appointments: 45, revenue: 4500, patients: 38, efficiency: 95.5 },
    { date: '2024-01-02', appointments: 52, revenue: 5200, patients: 45, efficiency: 94.2 },
    { date: '2024-01-03', appointments: 48, revenue: 4800, patients: 41, efficiency: 96.1 },
    { date: '2024-01-04', appointments: 61, revenue: 6100, patients: 52, efficiency: 93.8 },
    { date: '2024-01-05', appointments: 55, revenue: 5500, patients: 47, efficiency: 95.7 },
    { date: '2024-01-06', appointments: 38, revenue: 3800, patients: 32, efficiency: 97.4 },
    { date: '2024-01-07', appointments: 42, revenue: 4200, patients: 36, efficiency: 95.2 },
    { date: '2024-01-08', appointments: 58, revenue: 5800, patients: 49, efficiency: 94.8 },
    { date: '2024-01-09', appointments: 64, revenue: 6400, patients: 55, efficiency: 92.2 },
    { date: '2024-01-10', appointments: 51, revenue: 5100, patients: 44, efficiency: 96.1 },
    { date: '2024-01-11', appointments: 47, revenue: 4700, patients: 40, efficiency: 95.7 },
    { date: '2024-01-12', appointments: 53, revenue: 5300, patients: 46, efficiency: 94.3 },
    { date: '2024-01-13', appointments: 59, revenue: 5900, patients: 51, efficiency: 93.5 },
    { date: '2024-01-14', appointments: 44, revenue: 4400, patients: 38, efficiency: 97.7 }
  ];

  // Demografía de pacientes
  const patientDemographics: PatientDemographics[] = [
    { ageGroup: '18-25', count: 145, percentage: 12 },
    { ageGroup: '26-35', count: 298, percentage: 24 },
    { ageGroup: '36-45', count: 372, percentage: 30 },
    { ageGroup: '46-55', count: 267, percentage: 22 },
    { ageGroup: '56-65', count: 124, percentage: 10 },
    { ageGroup: '65+', count: 28, percentage: 2 }
  ];

  // Rendimiento de doctores
  const doctorPerformance: DoctorPerformance[] = [
    {
      doctorId: 'DOC001',
      name: 'Dr. María González',
      specialization: 'Cardiología',
      appointmentsCompleted: 156,
      averageRating: 4.9,
      revenue: 15600,
      efficiency: 97.4
    },
    {
      doctorId: 'DOC002',
      name: 'Dr. Carlos Rodríguez',
      specialization: 'Neurología',
      appointmentsCompleted: 142,
      averageRating: 4.7,
      revenue: 14200,
      efficiency: 95.1
    },
    {
      doctorId: 'DOC003',
      name: 'Dra. Ana Martínez',
      specialization: 'Pediatría',
      appointmentsCompleted: 189,
      averageRating: 4.8,
      revenue: 18900,
      efficiency: 94.7
    },
    {
      doctorId: 'DOC004',
      name: 'Dr. Luis Fernández',
      specialization: 'Dermatología',
      appointmentsCompleted: 134,
      averageRating: 4.6,
      revenue: 13400,
      efficiency: 92.5
    }
  ];

  // Métricas financieras
  const financialMetrics: FinancialMetrics[] = [
    { period: 'Ene', revenue: 45000, expenses: 32000, profit: 13000, margin: 28.9 },
    { period: 'Feb', revenue: 52000, expenses: 35000, profit: 17000, margin: 32.7 },
    { period: 'Mar', revenue: 48000, expenses: 33000, profit: 15000, margin: 31.3 },
    { period: 'Abr', revenue: 58000, expenses: 38000, profit: 20000, margin: 34.5 },
    { period: 'May', revenue: 61000, expenses: 41000, profit: 20000, margin: 32.8 },
    { period: 'Jun', revenue: 55000, expenses: 37000, profit: 18000, margin: 32.7 }
  ];

  const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const handleRefreshData = () => {
    setIsLoading(true);
    // Simular carga de datos
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  const exportData = () => {
    // Implementar exportación de datos
    logger.info('Exportando datos...');
  };

  const KPICard: React.FC<{ metric: KPIMetric }> = ({ metric }) => {
    const Icon = metric.icon;
    const isPositive = metric.changeType === 'increase';
    const isNegative = metric.changeType === 'decrease';

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metric.value}</div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <span className={`flex items-center ${
              isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-600'
            }`}>
              {isPositive && '↗'}
              {isNegative && '↘'}
              {metric.changeType === 'neutral' && '→'}
              {Math.abs(metric.change)}%
            </span>
            <span>vs mes anterior</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Análisis completo del rendimiento de tu clínica
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="w-[180px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
            <option value="1y">Último año</option>
          </select>
          <Button variant="outline" size="sm" onClick={handleRefreshData} disabled={isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {isLoading ? 'Cargando...' : 'Actualizar'}
          </Button>
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpiMetrics.map((metric, index) => (
          <KPICard key={index} metric={metric} />
        ))}
      </div>

      {/* Analytics Tabs */}
      <Tabs value={selectedMetric} onValueChange={setSelectedMetric} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="appointments">Citas</TabsTrigger>
          <TabsTrigger value="patients">Pacientes</TabsTrigger>
          <TabsTrigger value="doctors">Médicos</TabsTrigger>
          <TabsTrigger value="financial">Financiero</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tendencia de Citas</CardTitle>
                <CardDescription>
                  Evolución de citas y ingresos en el tiempo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString('es-ES')}
                      formatter={(value: any, name: string) => [
                        name === 'revenue' ? `$${value}` : value,
                        name === 'appointments' ? 'Citas' : name === 'revenue' ? 'Ingresos' : 'Pacientes'
                      ]}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="appointments" fill="#8884d8" name="Citas" />
                    <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#82ca9d" name="Ingresos" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución por Edad</CardTitle>
                <CardDescription>
                  Demografía de pacientes por grupos etarios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={patientDemographics}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ ageGroup, percentage }) => `${ageGroup} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {patientDemographics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [`${value} pacientes`, 'Cantidad']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Eficiencia Operativa</CardTitle>
              <CardDescription>
                Porcentaje de eficiencia a lo largo del tiempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} />
                  <YAxis domain={[90, 100]} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('es-ES')}
                    formatter={(value: any) => [`${value}%`, 'Eficiencia']}
                  />
                  <Area type="monotone" dataKey="efficiency" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-1">
            <Card>
              <CardHeader>
                <CardTitle>Análisis de Citas</CardTitle>
                <CardDescription>
                  Distribución y tendencias de citas médicas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString('es-ES')}
                      formatter={(value: any) => [value, 'Citas']}
                    />
                    <Legend />
                    <Bar dataKey="appointments" fill="#0088FE" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Patients Tab */}
        <TabsContent value="patients" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Evolución de Pacientes</CardTitle>
                <CardDescription>
                  Nuevos pacientes por día
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString('es-ES')}
                      formatter={(value: any) => [value, 'Pacientes']}
                    />
                    <Line type="monotone" dataKey="patients" stroke="#00C49F" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Demografía Detallada</CardTitle>
                <CardDescription>
                  Distribución completa por grupos de edad
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {patientDemographics.map((demo, index) => (
                    <div key={demo.ageGroup} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: colors[index % colors.length] }}
                        />
                        <span className="text-sm font-medium">{demo.ageGroup}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">{demo.count} pacientes</span>
                        <Badge variant="secondary">{demo.percentage}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Doctors Tab */}
        <TabsContent value="doctors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento por Médico</CardTitle>
              <CardDescription>
                Estadísticas de desempeño del equipo médico
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {doctorPerformance.map((doctor) => (
                  <div key={doctor.doctorId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <UserCheck className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{doctor.name}</h4>
                        <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <p className="font-semibold">{doctor.appointmentsCompleted}</p>
                        <p className="text-muted-foreground">Citas</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">{doctor.averageRating}/5</p>
                        <p className="text-muted-foreground">Rating</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">${doctor.revenue.toLocaleString()}</p>
                        <p className="text-muted-foreground">Ingresos</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">{doctor.efficiency}%</p>
                        <p className="text-muted-foreground">Eficiencia</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-1">
            <Card>
              <CardHeader>
                <CardTitle>Análisis Financiero</CardTitle>
                <CardDescription>
                  Ingresos, gastos y rentabilidad mensual
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={financialMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        name === 'margin' ? `${value}%` : `$${value.toLocaleString()}`,
                        name === 'revenue' ? 'Ingresos' : 
                        name === 'expenses' ? 'Gastos' : 
                        name === 'profit' ? 'Ganancia' : 'Margen'
                      ]}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="revenue" fill="#0088FE" name="Ingresos" />
                    <Bar yAxisId="left" dataKey="expenses" fill="#FF8042" name="Gastos" />
                    <Bar yAxisId="left" dataKey="profit" fill="#00C49F" name="Ganancia" />
                    <Line yAxisId="right" type="monotone" dataKey="margin" stroke="#8884d8" strokeWidth={3} name="Margen %" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;
