'use client';

import { useDashboardData } from '@/hooks/useDashboardData';
import { Badge, Button } from '@altamedica/ui';
import {
  Calendar,
  Clock,
  FileText,
  Mail,
  Phone,
  Plus,
  Search,
  User,
  UserCheck,
  Users
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

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

const Input = ({ 
  placeholder, 
  value, 
  onChange, 
  className = "" 
}: { 
  placeholder?: string; 
  value?: string; 
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  className?: string;
}) => (
  <input
    type="text"
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
  />
);

// Componente de tarjeta de paciente
const PatientCard = ({ patient, onViewDetails }: {
  patient: any;
  onViewDetails: (patientId: string) => void;
}) => {
  const getStatusColor = (lastVisit: string) => {
    const daysSinceVisit = Math.floor((Date.now() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceVisit < 30) return 'text-green-600';
    if (daysSinceVisit < 90) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardContent>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{patient.name}</h4>
                <p className="text-sm text-gray-600">{patient.age} años • {patient.gender}</p>
              </div>
            </div>
            
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{patient.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{patient.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className={`${getStatusColor(patient.lastVisit)} font-medium`}>
                  Última visita: {new Date(patient.lastVisit).toLocaleDateString()}
                </span>
              </div>
            </div>

            {patient.conditions.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-2">Condiciones:</p>
                <div className="flex flex-wrap gap-1">
                  {patient.conditions.map((condition: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {condition}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onViewDetails(patient.id)}
          >
            <FileText className="w-4 h-4 mr-2" />
            Ver Historia
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default function PatientsPage() {
  const router = useRouter();
  const { patients } = useDashboardData();
  const [searchTerm, setSearchTerm] = useState('');

  const handleViewPatientDetails = (patientId: string) => {
    router.push(`/patients/${patientId}`);
  };

  const handleAddNewPatient = () => {
    router.push('/patients/new');
  };

  const filteredPatients = patients.filter((patient: any) => 
    patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pacientes</h2>
          <p className="text-gray-600">Gestiona tu lista de pacientes</p>
        </div>
        <Button onClick={handleAddNewPatient} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Agregar Paciente
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pacientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patients.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacientes Activos</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {patients.filter((p: any) => {
                const daysSinceVisit = Math.floor((Date.now() - new Date(p.lastVisit || Date.now()).getTime()) / (1000 * 60 * 60 * 24));
                return daysSinceVisit < 90;
              }).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nuevos este mes</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Citas pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
          </CardContent>
        </Card>
      </div>

      {/* Búsqueda y lista de pacientes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Pacientes</CardTitle>
            <div className="flex items-center gap-2 w-96">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre, email o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPatients.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No se encontraron pacientes' : 'No hay pacientes registrados'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando tu primer paciente'}
              </p>
              {!searchTerm && (
                <Button onClick={handleAddNewPatient}>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Paciente
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredPatients.map((patient) => (
                <PatientCard
                  key={patient.id}
                  patient={patient}
                  onViewDetails={handleViewPatientDetails}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}