'use client';

import { useDashboardData } from '@/hooks/useDashboardData';
import { Badge, Button } from '@altamedica/ui';
import {
  Activity,
  CheckCircle,
  Clock,
  Eye,
  Plus,
  Video
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { logger } from '@altamedica/shared';
// Componentes simples
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 border-b border-gray-200 ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
    {children}
  </h3>
);

// Componente para mostrar sesiones de telemedicina
const TelemedicineSessionCard = ({ session, onJoin, onViewDetails }: {
  session: any;
  onJoin: (sessionId: string) => void;
  onViewDetails: (sessionId: string) => void;
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'ended': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'waiting': return 'En espera';
      case 'active': return 'Activa';
      case 'ended': return 'Finalizada';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">
              {session.patientName}
            </CardTitle>
            <p className="text-sm text-gray-600">
              {new Date(session.startTime).toLocaleString()}
            </p>
          </div>
          <Badge className={getStatusColor(session.status)}>
            {getStatusText(session.status)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Video className="w-4 h-4 text-blue-600" />
            <span className="capitalize">{session.type}</span>
            {session.duration && (
              <>
                <span>•</span>
                <span>{session.duration} min</span>
              </>
            )}
          </div>
          
          {session.symptoms.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Síntomas:</p>
              <div className="flex flex-wrap gap-1">
                {session.symptoms.map((symptom: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {symptom}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {session.notes && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {session.notes}
            </p>
          )}
          
          <div className="flex items-center gap-2 pt-2">
            {session.status === 'waiting' && (
              <Button
                size="sm"
                onClick={() => onJoin(session.id)}
                className="flex-1"
              >
                <Video className="w-4 h-4 mr-2" />
                Unirse
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onViewDetails(session.id)}
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-2" />
              Ver detalles
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function TelemedicinePage() {
  const router = useRouter();
  const { telemedicineSessions } = useDashboardData();

  const handleJoinSession = (sessionId: string) => {
    router.push(`/telemedicine/session/${sessionId}`);
  };

  const handleStartTelemedicine = () => {
    router.push('/telemedicine');
  };

  const handleViewSessionDetails = (sessionId: string) => {
    logger.info('Ver detalles de sesión:', sessionId);
  };

  return (
    <div className="space-y-6">
      {/* Header con botón de inicio rápido */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Telemedicina</h2>
          <p className="text-gray-600">Gestiona tus sesiones de telemedicina</p>
        </div>
        <Button onClick={handleStartTelemedicine} className="flex items-center gap-2">
          <Video className="w-4 h-4" />
          Iniciar Nueva Sesión
        </Button>
      </div>

      {/* Estadísticas de telemedicina */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sesiones</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{telemedicineSessions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Espera</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {telemedicineSessions.filter(s => s.status === 'waiting').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {telemedicineSessions.filter(s => s.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {telemedicineSessions.filter(s => s.status === 'ended').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de sesiones */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Sesiones de Telemedicina</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleStartTelemedicine}>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Sesión
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {telemedicineSessions.length === 0 ? (
            <div className="text-center py-8">
              <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay sesiones activas</h3>
              <p className="text-gray-600 mb-4">Inicia una nueva sesión de telemedicina para comenzar</p>
              <Button onClick={handleStartTelemedicine}>
                <Video className="w-4 h-4 mr-2" />
                Iniciar Sesión
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {telemedicineSessions.map((session) => (
                <TelemedicineSessionCard
                  key={session.id}
                  session={session}
                  onJoin={handleJoinSession}
                  onViewDetails={handleViewSessionDetails}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}