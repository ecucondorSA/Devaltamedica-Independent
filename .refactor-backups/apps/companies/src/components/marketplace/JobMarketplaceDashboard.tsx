import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@altamedica/ui';
import { Briefcase, Building2, MapPin, Users } from 'lucide-react';

const JobMarketplaceDashboard: React.FC = () => {
  // Mock data for job marketplace
  const jobStats = {
    activeListings: 24,
    totalApplications: 156,
    newApplications: 12,
    hiredThisMonth: 8
  };

  const recentJobs = [
    {
      id: 1,
      title: 'Cardiólogo Senior',
      hospital: 'Hospital Central',
      location: 'Ciudad de México',
      applicants: 8,
      posted: '2 días atrás',
      type: 'Tiempo completo'
    },
    {
      id: 2,
      title: 'Enfermera Especializada',
      hospital: 'Clínica San José',
      location: 'Guadalajara',
      applicants: 15,
      posted: '5 días atrás',
      type: 'Medio tiempo'
    },
    {
      id: 3,
      title: 'Pediatra',
      hospital: 'Hospital Infantil',
      location: 'Monterrey',
      applicants: 6,
      posted: '1 semana atrás',
      type: 'Tiempo completo'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Job Marketplace</h2>
        <p className="text-muted-foreground">
          Gestiona ofertas de trabajo y contrataciones médicas
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ofertas Activas
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobStats.activeListings}</div>
            <p className="text-xs text-muted-foreground">
              +3 desde la semana pasada
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Aplicaciones
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobStats.totalApplications}</div>
            <p className="text-xs text-muted-foreground">
              En todas las ofertas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Nuevas Aplicaciones
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobStats.newApplications}</div>
            <p className="text-xs text-muted-foreground">
              En las últimas 24 horas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Contratados
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobStats.hiredThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              Este mes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs List */}
      <Card>
        <CardHeader>
          <CardTitle>Ofertas de Trabajo Recientes</CardTitle>
          <CardDescription>
            Últimas posiciones publicadas en el marketplace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentJobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{job.title}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {job.hospital}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {job.location}
                        </span>
                        <span>{job.type}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {job.applicants} aplicantes
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {job.posted}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Placeholder for more features */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Candidatos Destacados</CardTitle>
            <CardDescription>
              Profesionales médicos recomendados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Sistema de recomendaciones en desarrollo</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Análisis de Mercado</CardTitle>
            <CardDescription>
              Tendencias y estadísticas del sector
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Análisis de mercado en desarrollo</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JobMarketplaceDashboard;