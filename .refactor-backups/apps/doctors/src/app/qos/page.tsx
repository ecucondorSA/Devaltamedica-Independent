import { Metadata } from 'next';
import { QoSDashboard } from '@/components/qos/QoSDashboard';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'QoS Dashboard | AltaMedica Doctors',
  description: 'Monitor call quality and network performance metrics',
};

export default async function QoSPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto p-6">
      <QoSDashboard doctorId={session.user.id} />
    </div>
  );
}