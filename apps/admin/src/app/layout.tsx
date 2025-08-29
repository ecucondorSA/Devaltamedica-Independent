'use client';

import type { ReactNode } from 'react';

import { AuthProvider } from '@altamedica/auth';

import AdminLayout from '@/components/layout/AdminLayout';
import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <AdminLayout>{children}</AdminLayout>
        </AuthProvider>
      </body>
    </html>
  );
}