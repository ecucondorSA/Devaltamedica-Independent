"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const VSCodeLayout = dynamic(() => import("../../../../components/layout/VSCodeLayout"), { ssr: false });

export default function DoctorsTelemedicineDemo() {
  return (
    <Suspense fallback={<div className="p-6">Cargando entorno del médico…</div>}>
      <VSCodeLayout />
    </Suspense>
  );
}
