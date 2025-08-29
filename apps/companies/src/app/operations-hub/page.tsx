"use client";

import { CommandPalette } from '@/components/crisis/CommandPalette';
import { OperationsHubLayout } from '@/components/operations-hub/OperationsHubLayout';
import { CrisisDataProvider } from '@/contexts/CrisisDataContext';
import { MarketplaceProvider } from '@/contexts/MarketplaceContext';
import { OperationsUIProvider } from '@/contexts/OperationsUIContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function OperationsHubPage() {
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const router = useRouter();

  // Primera visita: enviar a onboarding si no fue completado
  useEffect(() => {
    try {
      const done = typeof window !== 'undefined' ? localStorage.getItem('companies_onboarding_done') : '1';
      if (!done) {
        router.replace('/onboarding');
      }
    } catch {
      // localStorage can throw errors in some environments
    }
  }, [router]);

  return (
    <OperationsUIProvider>
      <CrisisDataProvider>
        <MarketplaceProvider>
          <div data-testid="operations-hub-root" className="relative">
            <OperationsHubLayout
              theme="vscode"
              showCommandPalette={showCommandPalette}
              onCommandPalette={() => setShowCommandPalette(true)}
            />
            
            {/* Command Palette */}
            {showCommandPalette && (
              <CommandPalette
                onClose={() => setShowCommandPalette(false)}
              />
            )}
          </div>
        </MarketplaceProvider>
      </CrisisDataProvider>
    </OperationsUIProvider>
  );
}