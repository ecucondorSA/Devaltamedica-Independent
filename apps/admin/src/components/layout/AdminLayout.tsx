'use client';

import { Button, Card, Input } from '@altamedica/ui';
import { useAuth } from '@altamedica/auth';
import { cn } from '@altamedica/utils';
import {
  Activity,
  BarChart,
  Bell,
  ChevronDown,
  Database,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Shield,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Users',
    href: '/users',
    icon: Users,
    subItems: [
      { title: 'All Users', href: '/users' },
      { title: 'Roles & Permissions', href: '/users/roles' },
      { title: 'Add New User', href: '/users/new' },
    ],
  },
  {
    title: 'Monitoring',
    href: '/monitoring',
    icon: Activity,
    subItems: [
      { title: 'System Health', href: '/monitoring/health' },
      { title: 'Activity Logs', href: '/monitoring/logs' },
      { title: 'Performance', href: '/monitoring/performance' },
    ],
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: FileText,
    subItems: [
      { title: 'Analytics', href: '/reports/analytics' },
      { title: 'Financial', href: '/reports/financial' },
      { title: 'User Activity', href: '/reports/activity' },
    ],
  },
  {
    title: 'Security',
    href: '/security',
    icon: Shield,
    subItems: [
      { title: 'Audit Logs', href: '/security/audit' },
      { title: 'Access Control', href: '/security/access' },
      { title: 'Compliance', href: '/security/compliance' },
    ],
  },
  {
    title: 'Data Management',
    href: '/data',
    icon: Database,
  },
  {
    title: 'FinOps',
    href: '/finops',
    icon: BarChart,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title],
    );
  };

  const isActive = (href: string) => {
    return pathname === href || (pathname && pathname.startsWith(href + '/'));
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
              <Shield className="h-8 w-8 text-blue-600" />
              {sidebarOpen && <span className="text-xl font-bold">Admin Panel</span>}
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
                    {sidebarOpen && item.subItems && (
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 transition-transform',
                          expandedItems.includes(item.title) && 'rotate-180',
                        )}
                      />
                    )}
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
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {(user?.displayName || user?.email || 'Admin').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {user?.displayName || user?.email || 'Admin'}
                  </p>
                  {user?.email && <p className="text-xs text-gray-500">{user.email}</p>}
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
              {menuItems.find((item) => isActive(item.href))?.title || 'Admin Panel'}
            </h2>
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded hover:bg-gray-100 relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
