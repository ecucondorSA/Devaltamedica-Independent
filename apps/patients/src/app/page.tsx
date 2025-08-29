'use client';

// Página de inicio que vive dentro del nuevo shell del layout.
// Incluye: bienvenida, panel de video (placeholder) plegable y actualización de historial.
import { Button, Card, Input } from '@altamedica/ui';
import DiagnosisPresuntivo from '../components/ai-diagnosis/DiagnosisPresuntivo';
import TelemedicineMVP from '../components/telemedicine/TelemedicineClient';
import { useLabResults } from '../hooks/useLabResults';
import { usePrescriptions } from '@altamedica/hooks';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export default function Home() {
  const [teleOpen, setTeleOpen] = useState(true);
  const [isInCall, setIsInCall] = useState(false);
  const searchParams = useSearchParams();
  const { labResults, loading: labsLoading, error: labsError, searchLabResults } = useLabResults();
  const {
    prescriptions,
    isLoading: rxLoading,
    error: rxError,
    refetch: searchPrescriptions,
  } = usePrescriptions();
  const hasEmergency = useMemo(() => searchParams.get('emergency') === '1', [searchParams]);

  useEffect(() => {
    // Carga inicial mínima
    searchLabResults();
    searchPrescriptions();
  }, [searchLabResults, searchPrescriptions]);
  return (
    <div className="space-y-4">
      {/* Telemedicina rápida (para E2E) */}
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
      {/* Título principal según boceto */}
      <section className="bg-white rounded-xl border shadow-sm p-4">
        <h1 className="text-lg sm:text-xl font-semibold">
          Centro de monitoreo personal y atención médica prioritaria
        </h1>
        <p className="text-sm text-neutral-600 mt-1">
          Sistema listo para telemedicina y seguimiento.
        </p>
      </section>

      {/* Telemedicina (plegable) */}
      <section className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-sm font-semibold">Telemedicina</h2>
          <button
            type="button"
            aria-expanded={teleOpen}
            aria-controls="tele-body"
            onClick={() => setTeleOpen((o) => !o)}
            className="text-xs rounded-md border px-2 py-1 hover:bg-neutral-50"
          >
            {teleOpen ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        <div
          id="tele-body"
          className={`${teleOpen ? 'max-h-[1000px]' : 'max-h-0'} transition-[max-height] duration-300 ease-in-out overflow-hidden`}
        >
          <div className="p-4">
            {isInCall ? (
              <TelemedicineMVP
                roomId="demo-room-123"
                doctorId="doc-demo"
                doctorName="Dr. Demo AltaMedica"
                onEndCall={() => setIsInCall(false)}
              />
            ) : (
              <div className="relative aspect-video w-full bg-gradient-to-br from-slate-900 to-blue-900 rounded-lg overflow-hidden">
                {/* Estado inicial - No en llamada */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold">Sistema de Telemedicina</h3>
                    <p className="text-sm text-white/80 max-w-sm">
                      Conecta directamente con médicos especialistas a través de videollamada segura
                    </p>
                    <button
                      onClick={() => setIsInCall(true)}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      Iniciar Consulta Demo
                    </button>
                  </div>
                </div>

                {/* Indicadores de estado en las esquinas */}
                <div className="absolute top-4 right-4">
                  <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    Sistema Activo
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="border-t px-4 py-2 text-xs text-neutral-500">
          Sistema único de videomedicina
        </div>
      </section>

      {/* Diagnóstico presuntivo y actualización de historial */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="bg-transparent p-0">
          <DiagnosisPresuntivo />
        </section>
        <section className="bg-white rounded-xl border shadow-sm p-4">
          <h3 className="text-sm font-semibold">Actualización de Historial</h3>
          <p className="text-xs text-neutral-500 mt-2">
            Panel de actualización de historial médico
          </p>
          <div className="mt-3">
            <button className="rounded-lg border bg-white hover:bg-neutral-50 text-sm px-3 py-2">
              Actualizar datos
            </button>
          </div>
        </section>
      </div>

      {/* Grid de módulos clínicos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Resultados de laboratorio */}
        <section className="bg-white rounded-xl border shadow-sm p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Resultados de laboratorio</h3>
            <Link href="/lab-results" className="text-xs text-primary-700 hover:underline">
              Ver todos
            </Link>
          </div>
          {labsLoading && <p className="text-xs text-neutral-500 mt-2">Cargando…</p>}
          {labsError && <p className="text-xs text-red-600 mt-2">{labsError}</p>}
          {!labsLoading &&
            !labsError &&
            (labResults.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {labResults.slice(0, 2).map((l) => (
                  <li key={l.id} className="text-xs border rounded-md p-2 hover:bg-neutral-50">
                    <div className="font-medium">{l.testName}</div>
                    <div className="text-neutral-600">{l.result}</div>
                    <div className="text-[10px] text-neutral-500 mt-1">{l.reportDate}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-neutral-500 mt-2">Sin datos recientes</p>
            ))}
          <div className="mt-3">
            <button className="rounded-lg border bg-white hover:bg-neutral-50 text-sm px-3 py-2">
              Subir resultado
            </button>
          </div>
        </section>

        {/* Recetas médicas - Temporalmente comentado por incompatibilidad de tipos */}
        {/* <section className="bg-white rounded-xl border shadow-sm p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Recetas médicas</h3>
            <Link href="/prescriptions" className="text-xs text-primary-700 hover:underline">
              Ver todas
            </Link>
          </div>
          {rxLoading && <p className="text-xs text-neutral-500 mt-2">Cargando…</p>}
          {rxError && <p className="text-xs text-red-600 mt-2">{rxError}</p>}
          {!rxLoading &&
            !rxError &&
            (prescriptions.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {prescriptions.slice(0, 2).map((r) => (
                  <li key={r.id} className="text-xs border rounded-md p-2 hover:bg-neutral-50">
                    <div className="font-medium">
                      {r.medicationName} {r.dosage} • {r.frequency}
                    </div>
                    <div className="text-neutral-600">{r.instructions}</div>
                    <div className="text-[10px] text-neutral-500 mt-1">{r.date}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-neutral-500 mt-2">Sin datos recientes</p>
            ))}
          <div className="mt-3 flex items-center gap-2">
            <button className="rounded-lg border bg-white hover:bg-neutral-50 text-sm px-3 py-2">
              Descargar
            </button>
            <button className="rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm px-3 py-2">
              Ver QR
            </button>
          </div>
        </section> */}

        {/* Recomendaciones de descanso */}
        <section className="bg-white rounded-xl border shadow-sm p-4">
          <h3 className="text-sm font-semibold">Recomendaciones de descanso</h3>
          <p className="text-xs text-neutral-500 mt-2">Sin datos recientes</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs px-2 py-1 rounded-full border">Sueño</span>
            <span className="text-xs px-2 py-1 rounded-full border">Actividad</span>
            <span className="text-xs px-2 py-1 rounded-full border">Hidratación</span>
          </div>
        </section>

        {/* Historial médico */}
        <section className="bg-white rounded-xl border shadow-sm p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Historial médico</h3>
            <button className="text-xs text-primary-700 hover:underline">Ver todo</button>
          </div>
          <p className="text-xs text-neutral-500 mt-2">Sin datos recientes</p>
          <div className="mt-3">
            <button className="rounded-lg border bg-white hover:bg-neutral-50 text-sm px-3 py-2">
              Actualizar historial
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
