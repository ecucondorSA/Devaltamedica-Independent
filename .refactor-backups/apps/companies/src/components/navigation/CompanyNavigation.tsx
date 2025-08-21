'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '@altamedica/ui';
import { cn } from '@altamedica/utils';
import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  ChevronDown,
  FileText,
  HelpCircle,
  Home,
  MessageSquare,
  Settings,
  Stethoscope,
  TrendingUp,
  Users,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  subItems?: Array<{
    name: string;
    href: string;
  }>;
}

interface CompanyNavigationProps {
  expandedItems: string[];
  toggleExpanded: (itemName: string) => void;
  onNavigate?: () => void; // Para cerrar el sidebar móvil
}

const navigation: NavItem[] = [
  { 
    name: 'Centro de Control', 
    href: '/dashboard', 
    icon: Home 
  },
  { 
    name: 'Red Hospitalaria', 
    href: '/dashboard/network', 
    icon: Building2,
    badge: 3,
    subItems: [
      { name: 'Redistribución de Pacientes', href: '/dashboard/network/redistribution' },
      { name: 'Capacidad en Tiempo Real', href: '/dashboard/network/capacity' },
      { name: 'Alertas de Saturación', href: '/dashboard/network/alerts' }
    ]
  },
  { 
    name: 'Personal Médico', 
    href: '/dashboard/staff', 
    icon: Stethoscope,
    subItems: [
      { name: 'Directorio Médico', href: '/dashboard/staff/directory' },
      { name: 'Horarios y Turnos', href: '/dashboard/staff/schedules' },
      { name: 'Evaluación de Desempeño', href: '/dashboard/staff/performance' }
    ]
  },
  { 
    name: 'Contratación', 
    href: '/dashboard/hiring', 
    icon: Users,
    badge: 12,
    subItems: [
      { name: 'Publicar Vacantes', href: '/dashboard/hiring/post' },
      { name: 'Candidatos', href: '/dashboard/hiring/candidates' },
      { name: 'Entrevistas', href: '/dashboard/hiring/interviews' }
    ]
  },
  { 
    name: 'Analytics', 
    href: '/dashboard/analytics', 
    icon: BarChart3,
    subItems: [
      { name: 'Métricas Operativas', href: '/dashboard/analytics/operations' },
      { name: 'Análisis Financiero', href: '/dashboard/analytics/financial' },
      { name: 'Reportes Ejecutivos', href: '/dashboard/analytics/reports' }
    ]
  },
  { 
    name: 'Comunicación B2C', 
    href: '/dashboard/communication', 
    icon: MessageSquare,
    badge: 5
  },
  { 
    name: 'Configuración', 
    href: '/dashboard/settings', 
    icon: Settings 
  }
];

const secondaryNavigation = [
  { name: 'Documentación', href: '/docs', icon: FileText },
  { name: 'Soporte', href: '/support', icon: HelpCircle }
];

export default function CompanyNavigation({ expandedItems, toggleExpanded, onNavigate }: CompanyNavigationProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const handleNavClick = () => {
    onNavigate?.();
  };

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <nav className="flex-1 space-y-1 px-3 py-4">
        {/* Hospital info */}
        <div className="mb-6 px-3 py-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900">Hospital San Vicente</p>
              <p className="text-xs text-blue-700">Plan: Enterprise</p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-xs text-green-700">Sistema Operativo</span>
            </div>
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              <TrendingUp className="h-3 w-3 mr-1" />
              +15%
            </Badge>
          </div>
        </div>

        {/* Navigation items */}
        {navigation.map((item: NavItem) => (
          <div key={item.name}>
            <div
              className={cn(
                "w-full group flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                isActive(item.href)
                  ? "bg-blue-50 text-blue-700 shadow-sm"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Link 
                href={item.href} 
                className="flex items-center flex-1"
                onClick={handleNavClick}
              >
                <item.icon className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                  isActive(item.href) ? "text-blue-700" : "text-gray-400 group-hover:text-gray-500"
                )} />
                <span className="truncate">{item.name}</span>
              </Link>
              
              <div className="flex items-center space-x-1">
                {item.badge && (
                  <Badge variant="outline" className={cn(
                    "text-xs px-2 py-0.5",
                    isActive(item.href) 
                      ? "bg-blue-100 text-blue-800 border-blue-300"
                      : "bg-gray-100 text-gray-600 border-gray-200"
                  )}>
                    {item.badge}
                  </Badge>
                )}
                {item.subItems && (
                  <button
                    onClick={() => toggleExpanded(item.name)}
                    className="p-1 rounded hover:bg-gray-200"
                  >
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      expandedItems.includes(item.name) && "rotate-180"
                    )} />
                  </button>
                )}
              </div>
            </div>

            {/* Sub items */}
            {item.subItems && expandedItems.includes(item.name) && (
              <div className="mt-1 space-y-1 pl-11 animate-in slide-in-from-top-2 duration-200">
                {item.subItems.map((subItem) => (
                  <Link
                    key={subItem.name}
                    href={subItem.href}
                    onClick={handleNavClick}
                    className={cn(
                      "block rounded-md py-2 px-3 text-sm transition-colors",
                      isActive(subItem.href)
                        ? "bg-blue-50 text-blue-700 font-medium border-l-2 border-blue-400"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    {subItem.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Secondary navigation */}
      <div className="border-t border-gray-200 px-3 py-4">
        <div className="space-y-1">
          {secondaryNavigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={handleNavClick}
              className="group flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <item.icon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}