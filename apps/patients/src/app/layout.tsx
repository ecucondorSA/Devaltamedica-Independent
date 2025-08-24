/**
 * layout.tsx - Layout Raíz de la Aplicación de Pacientes
 * Proyecto: Altamedica Pacientes
 * Diseño: Ultra-conservador con autenticación robusta
 */

import { Button, Card, Input } from '@altamedica/ui';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { QueryProvider } from '../providers/QueryProvider';

import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Altamedica - Portal de Pacientes',
  description: 'Portal de pacientes para gestión de citas, historial médico y telemedicina',
  keywords: 'pacientes, citas médicas, telemedicina, historial médico, Altamedica',
  authors: [{ name: 'Altamedica' }],
  robots: 'noindex, nofollow', // Para desarrollo
};

// Configuración de viewport separada según Next.js 15
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#3b82f6',
};

// Wrapper cliente unificado para renderizar widgets CSR dentro del layout (Server Component)
import ClientSidebarWidgets, { EmergencyBannerWrapper, AuthProvider } from './client-wrappers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-gray-50 text-neutral-900`}>
        <QueryProvider>
          <AuthProvider>
            {/* Shell principal con header fijo y grid 3 columnas (izq: citas, centro: contenido, der: signos vitales) */}
            <div className="min-h-dvh grid grid-rows-[auto,1fr]">
              {/* Banda superior de crédito */}
              <div className="w-full bg-neutral-900 text-white text-[10px] sm:text-xs py-1 px-3 text-center">
                creado por Eduardo Marques / Med / UBA
              </div>
              {/* Header superior */}
              <header className="border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                <div className="mx-auto max-w-[1400px] px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-primary-600" aria-hidden />
                    <div className="font-semibold">AltaMedica – Telemedicina</div>
                  </div>
                  <nav className="text-sm text-neutral-600 hidden sm:block">
                    <span className="mr-4">Inicio</span>
                    <span className="mr-4">Citas</span>
                    <span>Ayuda</span>
                  </nav>
                </div>
              </header>

              {/* Emergency Banner - Se muestra cuando hay emergencias activas */}
              <EmergencyBannerWrapper />

              {/* Contenido principal con 3 columnas */}
              <div className="mx-auto w-full max-w-[1400px] grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_24px_320px] gap-4 p-4">
                {/* Columna izquierda: Citas rápidas */}
                <aside className="order-2 lg:order-1">
                  <section className="bg-white rounded-xl border shadow-sm p-4">
                    <h2 className="text-sm font-semibold mb-3">Calendario de Citas</h2>
                    <ul className="space-y-3">
                      <li className="flex items-center justify-between">
                        <span className="text-sm">RL</span>
                        <div className="h-2 w-40 bg-neutral-100 rounded-full overflow-hidden">
                          <div className="h-full w-1/3 bg-blue-500" />
                        </div>
                      </li>
                      <li className="flex items-center justify-between">
                        <span className="text-sm">RC</span>
                        <div className="h-2 w-40 bg-neutral-100 rounded-full overflow-hidden">
                          <div className="h-full w-1/5 bg-emerald-500" />
                        </div>
                      </li>
                      <li className="flex items-center justify-between">
                        <span className="text-sm">PC</span>
                        <div className="h-2 w-40 bg-neutral-100 rounded-full overflow-hidden">
                          <div className="h-full w-1/2 bg-amber-500" />
                        </div>
                      </li>
                    </ul>
                    <button className="mt-4 w-full inline-flex items-center justify-center rounded-lg border bg-white hover:bg-neutral-50 text-sm py-2">
                      Abrir agenda
                    </button>
                  </section>

                  {/* CTA Síntomas en móvil: visible aquí en pantallas pequeñas */}
                  <div className="lg:hidden mt-4">
                    <button className="w-full rounded-xl bg-primary-600 hover:bg-primary-700 text-white py-3 font-medium">
                      Síntomas
                    </button>
                  </div>
                </aside>

                {/* Columna central: children (contenido de cada página) */}
                <main className="order-1 lg:order-2 min-w-0">{children}</main>

                {/* Separador GLB (decorativo) entre centro y derecha */}
                <section aria-hidden className="hidden lg:block order-3">
                  <div className="sticky top-20 h-[70vh] min-h-[520px] w-6 rounded-xl border bg-white shadow-sm overflow-hidden grid place-items-center">
                    <span className="rotate-90 text-[10px] text-neutral-500">
                      Contenedor GLB separador
                    </span>
                  </div>
                </section>

                {/* Columna derecha: Perfil, Notificaciones y Signos vitales */}
                <aside className="order-4 space-y-4 lg:sticky lg:top-20 self-start">
                  {/* Perfil del paciente */}
                  <section className="bg-white rounded-xl border shadow-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-semibold">Perfil del paciente</h2>
                      <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 border">
                        Perfil
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-neutral-200" aria-hidden />
                      <div>
                        <div className="text-sm font-medium">Paciente</div>
                        <div className="text-xs text-neutral-500">Sin datos recientes</div>
                      </div>
                    </div>
                  </section>

                  {/* Notificaciones y otros widgets cliente */}
                  <ClientSidebarWidgets />
                  <section className="bg-white rounded-xl border shadow-sm p-4">
                    <h2 className="text-sm font-semibold mb-3">Signos vitales</h2>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-3 sm:col-span-1">
                        <div className="text-xs text-neutral-500">Frecuencia cardiaca</div>
                        <div className="mt-1 flex items-end gap-1">
                          <span className="text-2xl font-semibold">–</span>
                          <span className="text-xs text-neutral-500">bpm</span>
                        </div>
                      </div>
                      <div className="col-span-3 sm:col-span-1">
                        <div className="text-xs text-neutral-500">Cognitivo</div>
                        <div className="mt-1 text-2xl font-semibold">–</div>
                      </div>
                      <div className="col-span-3 sm:col-span-1">
                        <div className="text-xs text-neutral-500">Temperatura</div>
                        <div className="mt-1 flex items-end gap-1">
                          <span className="text-2xl font-semibold">–</span>
                          <span className="text-xs text-neutral-500">°C</span>
                        </div>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-neutral-500">Sin datos recientes</p>
                  </section>
                  {/* CTA Síntomas en desktop */}
                  <div className="hidden lg:block">
                    <button className="w-full rounded-xl bg-primary-600 hover:bg-primary-700 text-white py-3 font-medium">
                      Síntomas
                    </button>
                  </div>
                </aside>
              </div>
            </div>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
