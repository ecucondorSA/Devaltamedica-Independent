"use client";

import dynamic from 'next/dynamic';

const MedicalHistoryMVP = dynamic(() => import('../../components/medical-history/MedicalHistoryMVP'), {
  ssr: false
});

export default function MedicalHistoryPage() {
  return <MedicalHistoryMVP className="p-6" />;
}
