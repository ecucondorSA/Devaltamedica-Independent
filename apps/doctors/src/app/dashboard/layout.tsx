'use client';

import DashboardNavigation from '@/components/navigation/DashboardNavigation';
import NotificationCenter from '@/components/NotificationCenter';
import { Button } from '@altamedica/ui';
import { Plus, Settings, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleNewAppointment = () => {
    router.push('/appointments/new');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Médico</h1>
              <p className="text-sm text-gray-600">Bienvenido, Dr. Carlos López</p>
            </div>
            <div className="flex items-center gap-4">
              <NotificationCenter />
              <Link href="/profile">
                <Button variant="secondary" size="small">
                  <User className="w-4 h-4 mr-2" />
                  Mi Perfil
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="secondary" size="small">
                  <Settings className="w-4 h-4 mr-2" />
                  Configuración
                </Button>
              </Link>
              <Button size="small" onClick={handleNewAppointment}>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Cita
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <DashboardNavigation />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
}