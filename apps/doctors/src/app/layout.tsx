import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AltaMedica Doctors',
  description: 'The AltaMedica platform for medical professionals.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#007bff" />
      </head>
      <body>{children}</body>
    </html>
  );
}
