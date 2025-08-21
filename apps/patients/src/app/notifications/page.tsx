'use client';

import dynamic from 'next/dynamic';

const NotificationsMVP = dynamic(() => import('../../components/notifications/NotificationsMVP'), {
  ssr: false
});

export default function NotificationsPage() {
  return <NotificationsMVP showAsList={true} className="p-6" />;
}
