"use client";

import { OperationsHubLayout } from '@/components/operations-hub/OperationsHubLayout';
import { CrisisDataProvider } from '@/contexts/CrisisDataContext';
import { MarketplaceProvider } from '@/contexts/MarketplaceContext';
import { OperationsUIProvider } from '@/contexts/OperationsUIContext';
import { Button, Progress } from '@altamedica/ui';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

type StepId =
  | 'intro'
  | 'tab-network'
  | 'tab-redistribution'
  | 'tab-marketplace'
  | 'profile-emergency'
  | 'zen-toggle'
  | 'auto-redis'
  | 'finish';

const STEPS: { id: StepId; title: string; description: string; target?: string }[] = [
  { id: 'intro', title: 'Bienvenido al Operations Hub', description: 'Te guiaremos por las funciones clave para gestionar tu red hospitalaria y el marketplace.' },
  { id: 'tab-network', title: 'Red Hospitalaria', description: 'Visualiza saturación y estado general de la red.', target: '[data-onboarding="tab-network"]' },
  { id: 'tab-redistribution', title: 'Redistribución', description: 'Gestiona rutas y traslados de pacientes.', target: '[data-onboarding="tab-redistribution"]' },
  { id: 'tab-marketplace', title: 'Marketplace', description: 'Publica y gestiona ofertas de profesionales y servicios.', target: '[data-onboarding="tab-marketplace"]' },
  { id: 'profile-emergency', title: 'Perfiles Operativos', description: 'Activa el perfil de Emergencias para priorizar decisiones críticas.', target: '[data-onboarding="profile-emergency"]' },
  { id: 'zen-toggle', title: 'Zen Mode', description: 'Oculta paneles para enfocarte en el mapa y métricas.', target: '[data-onboarding="zen-toggle"]' },
  { id: 'auto-redis', title: 'Auto-Redistribución', description: 'Activa el algoritmo automático de redistribución.', target: '[data-onboarding="auto-redis-toggle"]' },
  { id: 'finish', title: '¡Listo!', description: 'Has completado la guía. Puedes reabrirla desde Ayuda cuando quieras.' },
];

export default function CompaniesOnboardingPage() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const current = STEPS[currentIndex];
  const isLast = current.id === 'finish';

  // Redirigir si ya se completó
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const done = localStorage.getItem('companies_onboarding_done');
        if (done) router.replace('/operations-hub');
      }
    } catch {
      // localStorage can throw errors in some environments
    }
  }, [router]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Spotlight simple: calcula rect del target y dibuja un hueco en el overlay
  const spotlightRect = useMemo(() => {
    if (!mounted || typeof window === 'undefined') return null as DOMRect | null;
    if (!current.target) return null;
    const el = document.querySelector(current.target) as HTMLElement | null;
    if (el) {
      try {
        el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
      } catch {
        // scrollIntoView can fail in some cases
      }
    }
    return el ? el.getBoundingClientRect() : null;
  }, [mounted, current]);

  // Forzar reflow del mapa al cambiar paso
  useEffect(() => {
    try {
      window.dispatchEvent(new Event('map:invalidate-size'));
    } catch {
      // dispatchEvent can fail in some cases
    }
  }, [currentIndex]);

  const next = () => setCurrentIndex((i) => Math.min(STEPS.length - 1, i + 1));
  const prev = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const skip = () => {
    try {
      localStorage.setItem('companies_onboarding_done', '1');
    } catch {
      // localStorage can throw errors in some environments
    }
    router.replace('/operations-hub');
  };
  const finish = () => skip();

  return (
    <OperationsUIProvider>
      <CrisisDataProvider>
        <MarketplaceProvider>
          <div className="relative h-screen overflow-hidden bg-vscode-background">
            {/* Hub renderizado debajo del overlay de onboarding */}
            <OperationsHubLayout theme="vscode" />

            {/* Overlay */}
            <div ref={overlayRef} className="pointer-events-none fixed inset-0 z-[2000]">
              {/* Capa oscura */}
              <div className="absolute inset-0 bg-black/60" />

              {/* Spotlight */}
              {spotlightRect && (
                <div
                  aria-hidden
                  style={{
                    position: 'fixed',
                    left: `${spotlightRect.left - 8}px`,
                    top: `${spotlightRect.top - 8}px`,
                    width: `${spotlightRect.width + 16}px`,
                    height: `${spotlightRect.height + 16}px`,
                    boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
                    borderRadius: '8px',
                    outline: '2px solid #3b82f6',
                    transition: 'all 0.2s ease',
                  }}
                  className="pointer-events-none"
                />
              )}

              {/* Tarjeta de paso */}
              <div className="pointer-events-auto fixed bottom-6 left-1/2 -translate-x-1/2 w-[min(680px,92vw)] bg-vscode-panel border border-vscode-border rounded-xl shadow-2xl p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <h3 className="text-white text-lg font-semibold mb-1">{current.title}</h3>
                    <p className="text-vscode-foreground/80 text-sm">{current.description}</p>
                    <div className="mt-3">
                      <Progress value={Math.round(((currentIndex + 1) / STEPS.length) * 100)} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={prev} disabled={currentIndex === 0}>Anterior</Button>
                    {!isLast ? (
                      <Button onClick={next}>Siguiente</Button>
                    ) : (
                      <Button onClick={finish}>Finalizar</Button>
                    )}
                    <Button onClick={skip}>Saltar</Button>
                  </div>
                </div>
                <div className="mt-2 text-[11px] text-vscode-foreground/60">
                  Paso {currentIndex + 1} de {STEPS.length}
                </div>
              </div>
            </div>
          </div>
        </MarketplaceProvider>
      </CrisisDataProvider>
    </OperationsUIProvider>
  );
}
