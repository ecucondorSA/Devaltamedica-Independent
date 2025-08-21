'use client';

import { BarChart3, Briefcase, Calendar, Users, Video } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavTab {
  id: string;
  label: string;
  icon: typeof BarChart3;
  href: string;
}

const tabs: NavTab[] = [
  { id: 'overview', label: 'Resumen', icon: BarChart3, href: '/dashboard' },
  { id: 'marketplace', label: 'Marketplace', icon: Briefcase, href: '/dashboard/marketplace' },
  { id: 'telemedicine', label: 'Telemedicina', icon: Video, href: '/dashboard/telemedicine' },
  { id: 'patients', label: 'Pacientes', icon: Users, href: '/dashboard/patients' },
  { id: 'appointments', label: 'Citas', icon: Calendar, href: '/dashboard/appointments' }
];

export default function DashboardNavigation() {
  const pathname = usePathname();

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href || (tab.href !== '/dashboard' && pathname.startsWith(tab.href));
            
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}