import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger } from '@altamedica/ui';
import {
    Activity,
    AlertCircle,
    Calendar,
    CheckCircle,
    Clock,
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

// Componente Progress simple
const Progress = ({ value, className = '' }: { value: number; className?: string }) => (
  <div className={`w-full bg-gray-200 rounded-full h-2.5 ${className}`}>
    <div 
      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

// Interfaces para métricas de citas
interface AppointmentMetrics {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  averageDuration: number;
  satisfactionRating: number;
  completionRate: number;
  onTimeRate: number;
}

interface AppointmentTrend {
  date: string;
  scheduled: number;
  completed: number;
  cancelled: number;
  noShow: number;
  efficiency: number;
}

interface DoctorAppointmentStats {
  doctorId: string;
  name: string;
  specialization: string;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  averageDuration: number;
  onTimePercentage: number;
  satisfactionScore: number;
  nextAvailable: string;
}

interface AppointmentBySpecialty {
  specialty: string;
  count: number;
  averageRating: number;
  completionRate: number;
}

interface TimeSlotUtilization {
  timeSlot: string;
  utilization: number;
  averageWaitTime: number;
  satisfaction: number;
}

const AppointmentAnalytics: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'quarter'>('week');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all');

  // Métricas principales de citas
  const appointmentMetrics: AppointmentMetrics = {
    totalAppointments: 2847,
    completedAppointments: 2234,
    cancelledAppointments: 445,
    noShowAppointments: 168,
    averageDuration: 23,
    satisfactionRating: 4.8,
    completionRate: 78.5,
    onTimeRate: 89.2
  };

  // Tendencias de citas
  const appointmentTrends: AppointmentTrend[] = [
    { date: '2024-01-15', scheduled: 45, completed: 42, cancelled: 2, noShow: 1, efficiency: 93.3 },
    { date: '2024-01-16', scheduled: 52, completed: 48, cancelled: 3, noShow: 1, efficiency: 92.3 },
    { date: '2024-01-17', scheduled: 48, completed: 46, cancelled: 1, noShow: 1, efficiency: 95.8 },
    { date: '2024-01-18', scheduled: 61, completed: 56, cancelled: 4, noShow: 1, efficiency: 91.8 },
    { date: '2024-01-19', scheduled: 55, completed: 52, cancelled: 2, noShow: 1, efficiency: 94.5 },
    { date: '2024-01-20', scheduled: 38, completed: 36, cancelled: 1, noShow: 1, efficiency: 94.7 },
    { date: '2024-01-21', scheduled: 42, completed: 40, cancelled: 1, noShow: 1, efficiency: 95.2 }
  ];

  // Estadísticas por doctor
  const doctorStats: DoctorAppointmentStats[] = [
    {
      doctorId: 'DOC001',
      name: 'Dr. María González',
      specialization: 'Cardiología',
      totalAppointments: 156,
      completedAppointments: 148,
      cancelledAppointments: 6,
      averageDuration: 28,
      onTimePercentage: 94.2,
      satisfactionScore: 4.9,
      nextAvailable: '2024-01-25 14:00'
    },
    {
      doctorId: 'DOC002',
      name: 'Dr. Carlos Rodríguez',
      specialization: 'Neurología',
      totalAppointments: 142,
      completedAppointments: 134,
      cancelledAppointments: 5,
      averageDuration: 32,
      onTimePercentage: 91.5,
      satisfactionScore: 4.7,
      nextAvailable: '2024-01-25 10:30'
    },
    {
      doctorId: 'DOC003',
      name: 'Dra. Ana Martínez',
      specialization: 'Pediatría',
      totalAppointments: 189,
      completedAppointments: 178,
      cancelledAppointments: 8,
      averageDuration: 18,
      onTimePercentage: 96.8,
      satisfactionScore: 4.8,
      nextAvailable: '2024-01-25 09:15'
    },
    {
      doctorId: 'DOC004',
      name: 'Dr. Luis Fernández',
      specialization: 'Dermatología',
      totalAppointments: 134,
      completedAppointments: 125,
      cancelledAppointments: 7,
      averageDuration: 15,
      onTimePercentage: 88.1,
      satisfactionScore: 4.6,
      nextAvailable: '2024-01-25 16:45'
    }
  ];

  // Citas por especialidad
  const appointmentsBySpecialty: AppointmentBySpecialty[] = [
    { specialty: 'Medicina General', count: 567, averageRating: 4.6, completionRate: 91.2 },
    { specialty: 'Cardiología', count: 298, averageRating: 4.8, completionRate: 94.6 },
    { specialty: 'Neurología', count: 234, averageRating: 4.7, completionRate: 89.3 },
    { specialty: 'Pediatría', count: 445, averageRating: 4.9, completionRate: 96.1 },
    { specialty: 'Dermatología', count: 189, averageRating: 4.5, completionRate: 87.8 },
    { specialty: 'Ginecología', count: 156, averageRating: 4.7, completionRate: 92.4 }
  ];

  // Utilización por franjas horarias
  const timeSlotUtilization: TimeSlotUtilization[] = [
    { timeSlot: '08:00-09:00', utilization: 78, averageWaitTime: 5, satisfaction: 4.6 },
    { timeSlot: '09:00-10:00', utilization: 92, averageWaitTime: 8, satisfaction: 4.7 },
    { timeSlot: '10:00-11:00', utilization: 95, averageWaitTime: 12, satisfaction: 4.5 },
    { timeSlot: '11:00-12:00', utilization: 88, averageWaitTime: 7, satisfaction: 4.8 },
    { timeSlot: '12:00-13:00', utilization: 45, averageWaitTime: 3, satisfaction: 4.9 },
    { timeSlot: '13:00-14:00', utilization: 23, averageWaitTime: 2, satisfaction: 4.8 },
    { timeSlot: '14:00-15:00', utilization: 67, averageWaitTime: 6, satisfaction: 4.7 },
    { timeSlot: '15:00-16:00', utilization: 89, averageWaitTime: 9, satisfaction: 4.6 },
    { timeSlot: '16:00-17:00', utilization: 94, averageWaitTime: 11, satisfaction: 4.4 },
    { timeSlot: '17:00-18:00', utilization: 76, averageWaitTime: 5, satisfaction: 4.7 }
  ];

  const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    change?: number;
    icon: React.ComponentType<any>;
    color: string;
    description: string;
  }> = ({ title, value, change, icon: Icon, color, description }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
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

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics de Citas</h2>
          <p className="text-muted-foreground">
            Análisis detallado del sistema de citas médicas
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={selectedPeriod === 'today' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('today')}
          >
            Hoy
          </Button>
          <Button
            variant={selectedPeriod === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('week')}
          >
            Semana
          </Button>
          <Button
            variant={selectedPeriod === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('month')}
          >
            Mes
          </Button>
          <Button
            variant={selectedPeriod === 'quarter' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('quarter')}
          >
            Trimestre
          </Button>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total de Citas"
          value={appointmentMetrics.totalAppointments.toLocaleString()}
          change={12.5}
          icon={Calendar}
          color="text-blue-600"
          description="Citas programadas en total"
        />
        <MetricCard
          title="Tasa de Completitud"
          value={`${appointmentMetrics.completionRate}%`}
          change={-2.1}
          icon={CheckCircle}
          color="text-green-600"
          description="Porcentaje de citas completadas"
        />
        <MetricCard
          title="Puntualidad"
          value={`${appointmentMetrics.onTimeRate}%`}
          change={5.3}
          icon={Clock}
          color="text-orange-600"
          description="Citas que iniciaron a tiempo"
        />
        <MetricCard
          title="Satisfacción"
          value={`${appointmentMetrics.satisfactionRating}/5`}
          change={0.3}
          icon={Activity}
          color="text-purple-600"
          description="Rating promedio de pacientes"
        />
      </div>

      {/* Tabs de análisis */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
          <TabsTrigger value="doctors">Por Médico</TabsTrigger>
          <TabsTrigger value="specialties">Especialidades</TabsTrigger>
          <TabsTrigger value="schedule">Horarios</TabsTrigger>
        </TabsList>

        {/* Resumen */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Estado de Citas</CardTitle>
                <CardDescription>Distribución del estado de las citas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Completadas', value: appointmentMetrics.completedAppointments, color: '#00C49F' },
                        { name: 'Canceladas', value: appointmentMetrics.cancelledAppointments, color: '#FF8042' },
                        { name: 'No asistió', value: appointmentMetrics.noShowAppointments, color: '#FFBB28' }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { color: '#00C49F' },
                        { color: '#FF8042' },
                        { color: '#FFBB28' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Eficiencia Semanal</CardTitle>
                <CardDescription>Porcentaje de eficiencia por día</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={appointmentTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { weekday: 'short' })}
                    />
                    <YAxis domain={[85, 100]} />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString('es-ES')}
                      formatter={(value: any) => [`${value}%`, 'Eficiencia']}
                    />
                    <Area type="monotone" dataKey="efficiency" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resumen de Indicadores</CardTitle>
              <CardDescription>Métricas clave de rendimiento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Duración Promedio</span>
                    <span className="text-sm text-muted-foreground">{appointmentMetrics.averageDuration} min</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Tasa de Cancelación</span>
                    <span className="text-sm text-muted-foreground">
                      {((appointmentMetrics.cancelledAppointments / appointmentMetrics.totalAppointments) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={15.6} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">No Shows</span>
                    <span className="text-sm text-muted-foreground">
                      {((appointmentMetrics.noShowAppointments / appointmentMetrics.totalAppointments) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={5.9} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tendencias */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendencias de Citas</CardTitle>
              <CardDescription>Evolución de citas programadas vs completadas</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={appointmentTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('es-ES')}
                  />
                  <Legend />
                  <Bar dataKey="scheduled" fill="#8884d8" name="Programadas" />
                  <Bar dataKey="completed" fill="#00C49F" name="Completadas" />
                  <Bar dataKey="cancelled" fill="#FF8042" name="Canceladas" />
                  <Line type="monotone" dataKey="efficiency" stroke="#FFBB28" strokeWidth={3} name="Eficiencia %" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Por Médico */}
        <TabsContent value="doctors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento por Médico</CardTitle>
              <CardDescription>Estadísticas detalladas de cada profesional</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {doctorStats.map((doctor) => (
                  <div key={doctor.doctorId} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{doctor.name}</h4>
                        <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                      </div>
                      <Badge variant="secondary">
                        {((doctor.completedAppointments / doctor.totalAppointments) * 100).toFixed(0)}% completitud
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                      <div>
                        <p className="font-medium">{doctor.totalAppointments}</p>
                        <p className="text-muted-foreground">Total citas</p>
                      </div>
                      <div>
                        <p className="font-medium">{doctor.completedAppointments}</p>
                        <p className="text-muted-foreground">Completadas</p>
                      </div>
                      <div>
                        <p className="font-medium">{doctor.averageDuration} min</p>
                        <p className="text-muted-foreground">Duración prom.</p>
                      </div>
                      <div>
                        <p className="font-medium">{doctor.onTimePercentage}%</p>
                        <p className="text-muted-foreground">Puntualidad</p>
                      </div>
                      <div>
                        <p className="font-medium">{doctor.satisfactionScore}/5</p>
                        <p className="text-muted-foreground">Satisfacción</p>
                      </div>
                      <div>
                        <p className="font-medium text-green-600">Disponible</p>
                        <p className="text-muted-foreground">{new Date(doctor.nextAvailable).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Especialidades */}
        <TabsContent value="specialties" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Citas por Especialidad</CardTitle>
              <CardDescription>Distribución y rendimiento por área médica</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={appointmentsBySpecialty} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="specialty" type="category" width={120} />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      name === 'count' ? `${value} citas` : 
                      name === 'completionRate' ? `${value}%` : `${value}/5`,
                      name === 'count' ? 'Total' : 
                      name === 'completionRate' ? 'Tasa completitud' : 'Rating promedio'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="#0088FE" name="Citas totales" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {appointmentsBySpecialty.map((specialty, index) => (
              <Card key={specialty.specialty}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{specialty.specialty}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{specialty.count}</div>
                  <div className="space-y-2 mt-2">
                    <div className="flex justify-between text-xs">
                      <span>Completitud</span>
                      <span>{specialty.completionRate}%</span>
                    </div>
                    <Progress value={specialty.completionRate} className="h-1" />
                    <div className="flex justify-between text-xs">
                      <span>Rating</span>
                      <span>{specialty.averageRating}/5</span>
                    </div>
                    <Progress value={(specialty.averageRating / 5) * 100} className="h-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Horarios */}
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Utilización por Horarios</CardTitle>
              <CardDescription>Análisis de ocupación y eficiencia por franja horaria</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={timeSlotUtilization}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timeSlot" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="utilization" fill="#0088FE" name="Utilización %" />
                  <Line yAxisId="right" type="monotone" dataKey="averageWaitTime" stroke="#FF8042" strokeWidth={2} name="Tiempo espera (min)" />
                  <Line yAxisId="right" type="monotone" dataKey="satisfaction" stroke="#00C49F" strokeWidth={2} name="Satisfacción" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Horarios Pico</CardTitle>
                <CardDescription>Franjas con mayor demanda</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {timeSlotUtilization
                    .sort((a, b) => b.utilization - a.utilization)
                    .slice(0, 5)
                    .map((slot, index) => (
                      <div key={slot.timeSlot} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant={index === 0 ? 'default' : 'secondary'}>
                            #{index + 1}
                          </Badge>
                          <span className="font-medium">{slot.timeSlot}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{slot.utilization}%</p>
                          <p className="text-xs text-muted-foreground">
                            {slot.averageWaitTime} min espera
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recomendaciones</CardTitle>
                <CardDescription>Optimizaciones sugeridas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Horario 10:00-11:00</p>
                      <p className="text-xs text-muted-foreground">
                        95% utilización. Considerar agregar otro médico.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Target className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Horario 12:00-14:00</p>
                      <p className="text-xs text-muted-foreground">
                        Baja utilización. Oportunidad para citas especiales.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Tiempo de espera</p>
                      <p className="text-xs text-muted-foreground">
                        Promedio de 7.2 min está dentro del objetivo.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AppointmentAnalytics;
