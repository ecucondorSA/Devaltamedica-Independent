"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { useRouter } from "next/navigation";

const TelemedicineMVP = dynamic(
  () => import("../../components/telemedicine/TelemedicineMVP"),
  { ssr: false }
);

export default function TelemedicinePage() {
  const router = useRouter();
  
  // Valores demo; en integración real, leer de searchParams o de estado global
  const roomId = "telemed-room-1";
  const doctorId = "doctor-123";
  const doctorName = "Rodríguez";

  const handleEndCall = () => {
    // Redirigir al dashboard o mostrar resumen de la consulta
    router.push('/dashboard');
  };

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Cargando telemedicina...</div>}>
      <TelemedicineMVP
        roomId={roomId}
        doctorId={doctorId}
        doctorName={doctorName}
        onEndCall={handleEndCall}
      />
    </Suspense>
  );
}
