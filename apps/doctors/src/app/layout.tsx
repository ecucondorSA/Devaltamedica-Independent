import type { Metadata } from "next"
import './fonts.css';
import './globals.css';
import '../styles/telemedicine.css';
import '../styles/vscode-monokai.css';
import '../utils/browser-polyfills';
import { ClientLayout } from './client-layout';
import DoctorLayout from '@/components/layout/DoctorLayout';

export const metadata: Metadata = {
  title: "ALTAMEDICA Doctors",
  description: "Medical professionals management platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const handlerScript = `
    (function(){
      if (typeof window === 'undefined') return;
      var isDev = true;
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
      <body>
        <script dangerouslySetInnerHTML={{ __html: handlerScript }} />
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
