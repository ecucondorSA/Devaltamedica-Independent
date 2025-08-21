"use client";
import { Button, Card, Input } from '@altamedica/ui';
import VSCodeLayout from "@/components/layout/VSCodeLayout";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

export default function DoctorsPage() {
  const searchParams = useSearchParams();
  const hasEmergency = useMemo(() => searchParams.get('emergency') === '1', [searchParams]);
  return (
    <div className="flex flex-col gap-4">
      {/* Tarjeta mínima para E2E */}
      <section className="bg-white rounded-xl border shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/telemedicine/session/demo"
            data-testid="webrtc-session"
            className="text-xs px-3 py-2 rounded-md border hover:bg-neutral-50"
          >
            Ingresar a sesión WebRTC (demo)
          </Link>
          <button
            type="button"
            data-testid="emergency-consultations"
            className="text-xs px-3 py-2 rounded-md border hover:bg-neutral-50"
          >
            Consultas de emergencia
          </button>
          <button
            type="button"
            data-testid="new-secure-session"
            className="text-xs px-3 py-2 rounded-md border hover:bg-neutral-50"
          >
            Nueva sesión segura
          </button>
        </div>
        {hasEmergency && (
          <div
            className="mt-3 flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-3 py-2"
            data-testid="emergency-alert"
            role="alert"
          >
            <span className="text-xs text-red-700">Emergencia activa detectada</span>
            <Link
              href="/telemedicine/session/demo"
              data-testid="join-emergency"
              className="text-xs px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700"
            >
              Unirse ahora
            </Link>
          </div>
        )}
      </section>
      <VSCodeLayout />
    </div>
  );
}
