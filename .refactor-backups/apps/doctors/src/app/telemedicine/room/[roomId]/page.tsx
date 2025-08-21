"use client";

import { Button, Card, Input } from '@altamedica/ui';
import { useParams } from "next/navigation";
import DoctorVideoCall from '../../../../components/telemedicine/DoctorVideoCall';

export default function TelemedicineRoomPage() {
  const params = useParams();
  const roomId = (params?.roomId as string) || "test-room";

  // Datos mínimos de ejemplo para MVP
  const patientId = "patient-mvp";
  const patientName = "Paciente Demo";

  return (
    <main className="w-full h-screen bg-gray-900 p-4">
      <DoctorVideoCall
        roomId={roomId}
        patientId={patientId}
        patientName={patientName}
        onEndCall={() => history.back()}
        showControls
        showStats
        className="h-full"
      />
    </main>
  );
}