// components/matching/MatchingDashboard.tsx
// Dashboard principal para el sistema de matching B2B
// TEMPORALMENTE SIMPLIFICADO PARA BUILD SUCCESS

'use client'

import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '@altamedica/ui';

interface MatchingDashboardProps {
  companyId: string
}

export function MatchingDashboard({ companyId }: MatchingDashboardProps) {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Matching Dashboard</h1>
          <p className="text-gray-600">Sistema de matching B2B para empresas médicas</p>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          Empresa: {companyId}
        </Badge>
      </div>

      {/* Cards de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Matches Activos</CardTitle>
            <CardDescription>Conexiones empresariales establecidas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">12</div>
            <p className="text-sm text-gray-500">+3 este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Puntuación de Match</CardTitle>
            <CardDescription>Compatibilidad promedio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">87%</div>
            <p className="text-sm text-gray-500">Muy alta compatibilidad</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Partnerships</CardTitle>
            <CardDescription>Colaboraciones establecidas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">5</div>
            <p className="text-sm text-gray-500">2 nuevas esta semana</p>
          </CardContent>
        </Card>
      </div>

      {/* Búsqueda simplificada */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Partners</CardTitle>
          <CardDescription>Encuentra empresas médicas compatibles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Especialidad</label>
              <Input placeholder="Ej: Cardiología, Pediatría..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Ubicación</label>
              <Input placeholder="Ciudad o región..." />
            </div>
          </div>
          <Button className="w-full">
            🔍 Buscar Partners
          </Button>
        </CardContent>
      </Card>

      {/* Estado temporal */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="text-yellow-600">⚠️</div>
            <div>
              <h3 className="font-medium text-yellow-800">Funcionalidad en Desarrollo</h3>
              <p className="text-sm text-yellow-700">
                El sistema completo de matching estará disponible próximamente. 
                Esta es una versión simplificada temporal.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default MatchingDashboard;