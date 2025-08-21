import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Servicios - AltaMedica',
  description: 'Descubre todos los servicios de AltaMedica: telemedicina, historia clínica digital, diagnóstico con IA y más. Soluciones médicas integrales.',
};

export default function ServiciosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}