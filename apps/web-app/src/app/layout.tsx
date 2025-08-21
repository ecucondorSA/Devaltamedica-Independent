import FirebaseInit from '@/components/firebase/FirebaseInit';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import JsonLdSchema from '@/components/JsonLdSchema';
import AuthProvider from '@/components/providers/AuthProvider';
import ChunkErrorHandler from '@/components/providers/ChunkErrorHandler';
import QueryProvider from '@/components/providers/QueryProvider';
import WebVitalsReporter from '@/components/WebVitalsReporter';
import type { Metadata } from 'next';
import { Inter, Lexend } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

// Configuración optimizada de fuentes con variables CSS
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap', // Mejora el rendimiento de carga
});

const lexend = Lexend({
  subsets: ['latin'],
  variable: '--font-lexend',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ALTAMEDICA - Portal Médico Inteligente | Telemedicina 24/7',
  description:
    'Plataforma médica digital líder en Argentina. Conecta con especialistas, agenda consultas online, accede a tu historia clínica digital. Telemedicina 24/7 con IA.',
  keywords:
    'telemedicina argentina, consultas médicas online, doctores online, historia clínica digital, medicina IA, salud digital, consultas 24/7, especialistas médicos',
  authors: [{ name: 'ALTAMEDICA Team' }],
  metadataBase: new URL('https://altamedica.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'ALTAMEDICA - Portal Médico Inteligente | Telemedicina 24/7',
    description:
      'Revoluciona tu atención médica. Consultas online, historia clínica digital, especialistas 24/7. Tecnología IA para mejor diagnóstico.',
    type: 'website',
    locale: 'es_AR',
    url: 'https://altamedica.com',
    siteName: 'ALTAMEDICA',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'ALTAMEDICA - Portal Médico Inteligente',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ALTAMEDICA - Portal Médico Inteligente',
    description: 'Telemedicina 24/7 con IA. Consultas online y especialistas.',
    images: ['/og-image.jpg'],
    creator: '@altamedica',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-code',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${lexend.variable} scroll-smooth`}>
      <head>
        {/* 🚀 CRITICAL RESOURCE PRELOADING */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#06b6d4" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AltaMedica" />
        <link rel="dns-prefetch" href="//firebaseapp.com" />
        <link rel="dns-prefetch" href="//firebase.googleapis.com" />
        <link rel="dns-prefetch" href="//firestore.googleapis.com" />

        {/* 3D preloads removidos en marketing scope */}

        {/* Font CSS - Direct stylesheet link (Server Component compatible) */}
        <link rel="stylesheet" href="/api/font-css" />
        
        {/* Optional: Preconnect for external font sources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Performance hints */}
        <meta httpEquiv="x-dns-prefetch-control" content="on" />
      </head>
      <body className="font-sans antialiased">
        <GoogleAnalytics />
        <JsonLdSchema />
        <WebVitalsReporter />
        <ChunkErrorHandler />
        <QueryProvider>
          <FirebaseInit />
          <AuthProvider>
            <div id="root">
              {children}
              <Toaster richColors />
            </div>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
