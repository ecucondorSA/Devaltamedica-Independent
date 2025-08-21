"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const TelemedicineMVP = dynamic(
  () => import("../../../../components/telemedicine/TelemedicineMVP"),
  { ssr: false }
);

export default function TelemedicineDemoSessionPage() {
  const roomId = "demo-room-123";
  const doctorId = "doc-demo";
  const doctorName = "Dr. Demo AltaMedica";

  return (
    <Suspense fallback={<div className="p-6">Cargando sesión de telemedicina…</div>}>
      <TelemedicineMVP
        roomId={roomId}
        doctorId={doctorId}
        doctorName={doctorName}
        onEndCall={() => history.back()}
      />
    </Suspense>
  );
}
