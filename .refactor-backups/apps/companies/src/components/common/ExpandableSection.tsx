"use client";

import { Button, Card, Input } from '@altamedica/ui';
import { ChevronDown, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';

interface ExpandableSectionProps {
  title: React.ReactNode;
  defaultOpen?: boolean;
  rightActions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
  storageKey?: string; // si se provee, persiste el estado abierto/cerrado
}

export function ExpandableSection({
  title,
  defaultOpen = true,
  rightActions,
  className,
  children,
  storageKey,
}: ExpandableSectionProps) {
  const [open, setOpen] = useState<boolean>(defaultOpen);

  // Cargar estado persistido
  React.useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return;
    try {
      const val = window.localStorage.getItem(storageKey);
      if (val === 'true' || val === 'false') {
        setOpen(val === 'true');
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Guardar estado persistido
  React.useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(storageKey, String(open));
    } catch {}
  }, [open, storageKey]);

  // Notificar cambio de layout (útil para Leaflet invalidateSize)
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const evt = new Event('crisis:layout-changed');
      // rAF + delay por si hay transiciones CSS
      requestAnimationFrame(() => {
        window.dispatchEvent(evt);
        setTimeout(() => window.dispatchEvent(evt), 120);
      });
    } catch {}
  }, [open]);

  return (
    <div className={className}>
      <div className="px-3 py-2 border-b border-vscode-border bg-vscode-input flex items-center justify-between select-none">
        <button
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-2 text-sm text-vscode-foreground hover:text-white"
          aria-expanded={open}
        >
          {open ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          <span className="font-medium">{title}</span>
        </button>
        {rightActions && <div className="ml-2 shrink-0">{rightActions}</div>}
      </div>
      {open && (
        <div className="p-3">
          {children}
        </div>
      )}
    </div>
  );
}

export default ExpandableSection;
