import { Button, Card, Input } from '@altamedica/ui';
import { CompanyLayoutProvider } from '@/components/layout/CompanyLayoutProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { AuthProvider } from '@altamedica/auth';
// import '@altamedica/firebase/client-only'; // Initialize Firebase Client
import type { Metadata } from 'next';
import './globals.css';

// Fuente local deshabilitada por entorno sin red (fallback a sistema)

export const metadata: Metadata = {
  title: 'ALTAMEDICA Companies - Dashboard Empresarial',
  description: 'Plataforma corporativa para clínicas y hospitales con gestión avanzada',
  keywords: 'hospital, clínica, gestión médica, AltaMedica, dashboard empresarial',
  authors: [{ name: 'AltaMedica Platform' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#2563eb',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Cliente: handler de ChunkLoadError en DEV (evita pantallas en blanco por hot reload)
  const handlerScript = `
    (function(){
      if (typeof window === 'undefined') return;
      var isDev = window.location.hostname === 'localhost' || window.location.port;
      if (!isDev) return;
      var origConsoleError = console.error;
      console.error = function(){
        try {
          var args = Array.prototype.slice.call(arguments);
          var isChunkErr = args && args.some && args.some(function(a){
            return a && a.name === 'ChunkLoadError' || (typeof a === 'string' && a.indexOf('ChunkLoadError') !== -1);
          });
          if (isChunkErr) {
            var url = new URL(window.location.href);
            url.searchParams.set('nocache', Date.now().toString());
            window.location.replace(url.toString());
            return;
          }
        } catch {}
        origConsoleError.apply(console, arguments);
      };
    })();
  `;
  return (
    <html lang="es">
      <head>
        <meta name="theme-color" content="#2563eb" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        {/* Inyectar handler solo en cliente (no usar componentes inexistentes) */}
        <script dangerouslySetInnerHTML={{ __html: handlerScript }} />
        <AuthProvider>
          <QueryProvider>
            <CompanyLayoutProvider>
              <div id="__next" className="min-h-screen">
                {children}
              </div>
            </CompanyLayoutProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
