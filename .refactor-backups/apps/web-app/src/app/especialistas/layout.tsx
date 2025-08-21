import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Especialistas Médicos - AltaMedica',
  description: 'Encuentra y conecta con más de 1,200 especialistas médicos verificados. Agenda citas presenciales o por telemedicina con los mejores profesionales.',
};

export default function EspecialistasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}