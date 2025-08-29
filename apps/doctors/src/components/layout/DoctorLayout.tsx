'use client';

import NotificationCenter from '@/components/NotificationCenter';
import { useAuth } from '@altamedica/auth';
import {
  BarChart3,
  Bell,
  Briefcase,
  Calendar,
  CalendarDays,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Pill,
  Settings,
  Stethoscope,
  Users,
  Video,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '../../utils-stub';

interface DoctorLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Patients',
    href: '/patients',
    icon: Users,
    badge: 'new',
  },
  {
    title: 'Appointments',
    href: '/appointments',
    icon: CalendarDays,
    subItems: [
      { title: "Today's Appointments", href: '/appointments?filter=today' },
      { title: 'Upcoming', href: '/appointments?filter=upcoming' },
      { title: 'Past', href: '/appointments?filter=past' },
    ],
  },
  {
    title: 'Schedule',
    href: '/schedule',
    icon: Calendar,
  },
  {
    title: 'Telemedicine',
    href: '/telemedicine',
    icon: Video,
    badge: 'live',
  },
  {
    title: 'Prescriptions',
    href: '/prescriptions',
    icon: Pill,
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    title: 'Marketplace',
    href: '/marketplace',
    icon: Briefcase,
  },
  {
    title: 'Job Applications',
    href: '/job-applications',
    icon: Briefcase,
    badge: 'b2c',
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export default function DoctorLayout({ children }: DoctorLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title],
    );
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={cn(
          'bg-white shadow-lg transition-all duration-300 flex flex-col',
          sidebarOpen ? 'w-64' : 'w-16',
        )}
      >
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Stethoscope className="h-8 w-8 text-blue-600" />
              {sidebarOpen && <span className="text-xl font-bold">Dr. Portal</span>}
            </Link>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 rounded hover:bg-gray-100"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.href}>
                <div>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center justify-between p-2 rounded-lg transition-colors',
                      isActive(item.href) ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100',
                    )}
                    onClick={() => {
                      if (item.subItems && sidebarOpen) {
                        toggleExpanded(item.title);
                      }
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="h-5 w-5" />
                      {sidebarOpen && <span>{item.title}</span>}
                    </div>
                    <div className="flex items-center space-x-2">
                      {item.badge && sidebarOpen && (
                        <span
                          className={cn(
                            'px-2 py-1 text-xs rounded-full',
                            item.badge === 'new'
                              ? 'bg-green-100 text-green-700'
                              : item.badge === 'live'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-700',
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                      {sidebarOpen && item.subItems && (
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 transition-transform',
                            expandedItems.includes(item.title) && 'rotate-180',
                          )}
                        />
                      )}
                    </div>
                  </Link>

                  {/* Sub-items */}
                  {sidebarOpen && item.subItems && expandedItems.includes(item.title) && (
                    <ul className="ml-8 mt-2 space-y-1">
                      {item.subItems.map((subItem) => (
                        <li key={subItem.href}>
                          <Link
                            href={subItem.href}
                            className={cn(
                              'block p-2 rounded text-sm transition-colors',
                              isActive(subItem.href)
                                ? 'bg-blue-50 text-blue-600'
                                : 'hover:bg-gray-100',
                            )}
                          >
                            {subItem.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </nav>

        {/* User section */}
        <div className="border-t p-4">
          <div
            className={cn('flex items-center', sidebarOpen ? 'justify-between' : 'justify-center')}
          >
            {sidebarOpen && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {user ? (user as any).name?.charAt(0).toUpperCase() : 'D'}
                </div>
                <div>
                  <p className="text-sm font-medium">{user ? (user as any).name : 'Doctor'}</p>
                  <p className="text-xs text-gray-500">
                    {user ? (user as any).specialization : 'General Practice'}
                  </p>
                </div>
              </div>
            )}
            <button onClick={logout} className="p-2 rounded hover:bg-gray-100" title="Logout">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between p-4">
            <h2 className="text-xl font-semibold">
              {menuItems.find((item) => isActive(item.href))?.title || 'Doctor Portal'}
            </h2>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded hover:bg-gray-100 relative"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold">Notifications</h3>
            <button
              onClick={() => setShowNotifications(false)}
              className="p-1 rounded hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <NotificationCenter />
        </div>
      )}
    </div>
  );
}
