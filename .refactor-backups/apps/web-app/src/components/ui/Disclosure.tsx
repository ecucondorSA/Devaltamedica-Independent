"use client";

import { Button, Card, Input } from '@altamedica/ui';
import React, { useState, createContext, useContext, useRef } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

// Context for disclosure state
interface DisclosureContextValue {
  isOpen: boolean;
  toggle: () => void;
  panelId: string;
  buttonId: string;
}

const DisclosureContext = createContext<DisclosureContextValue | null>(null);

// Hook to use disclosure context
function useDisclosure() {
  const context = useContext(DisclosureContext);
  if (!context) {
    throw new Error("useDisclosure must be used within a Disclosure component");
  }
  return context;
}

// Main Disclosure component
interface DisclosureProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function Disclosure({ children, defaultOpen = false, className = "" }: DisclosureProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const panelId = useRef(`disclosure-panel-${Math.random().toString(36).substr(2, 9)}`).current;
  const buttonId = useRef(`disclosure-button-${Math.random().toString(36).substr(2, 9)}`).current;

  const toggle = () => setIsOpen(!isOpen);

  return (
    <DisclosureContext.Provider value={{ isOpen, toggle, panelId, buttonId }}>
      <div className={className}>
        {children}
      </div>
    </DisclosureContext.Provider>
  );
}

// Disclosure Button component
interface DisclosureButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function DisclosureButton({ children, className = "", onClick }: DisclosureButtonProps) {
  const { isOpen, toggle, panelId, buttonId } = useDisclosure();

  const handleClick = () => {
    toggle();
    onClick?.();
  };

  return (
    <button
      id={buttonId}
      className={`w-full text-left focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-inset ${className}`}
      onClick={handleClick}
      aria-expanded={isOpen}
      aria-controls={panelId}
    >
      {children}
    </button>
  );
}

// Disclosure Panel component
interface DisclosurePanelProps {
  children: React.ReactNode;
  className?: string;
  unmount?: boolean;
}

export function DisclosurePanel({ children, className = "", unmount = true }: DisclosurePanelProps) {
  const { isOpen, panelId, buttonId } = useDisclosure();

  if (unmount && !isOpen) {
    return null;
  }

  return (
    <div
      id={panelId}
      className={`${className} ${isOpen ? "block" : "hidden"}`}
      aria-labelledby={buttonId}
    >
      {children}
    </div>
  );
}

// Convenience component with icon
interface DisclosureButtonWithIconProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  iconClassName?: string;
}

export function DisclosureButtonWithIcon({ 
  children, 
  className = "", 
  onClick,
  iconClassName = "h-6 w-6 text-slate-400"
}: DisclosureButtonWithIconProps) {
  const { isOpen } = useDisclosure();

  return (
    <DisclosureButton 
      className={`flex items-center justify-between ${className}`} 
      onClick={onClick}
    >
      {children}
      {isOpen ? (
        <ChevronUp className={iconClassName} />
      ) : (
        <ChevronDown className={iconClassName} />
      )}
    </DisclosureButton>
  );
}

// Export default as main component
export default Disclosure;
