'use client';

import * as React from 'react';
import { cn } from './lib/utils';

interface PopoverProps {
  children: React.ReactNode;
}

interface PopoverTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  children: React.ReactNode;
}

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const PopoverContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>({ open: false, setOpen: () => {} });

export const Popover: React.FC<PopoverProps> = ({ children }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </PopoverContext.Provider>
  );
};

export const PopoverTrigger: React.FC<PopoverTriggerProps> = ({
  asChild,
  children,
  className,
  onClick,
  ...props
}) => {
  const { open, setOpen } = React.useContext(PopoverContext);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    setOpen(!open);
    onClick?.(e);
  };

  return (
    <div className={cn('cursor-pointer', className)} onClick={handleClick} {...props}>
      {children}
    </div>
  );
};

export const PopoverContent: React.FC<PopoverContentProps> = ({
  children,
  className,
  ...props
}) => {
  const { open } = React.useContext(PopoverContext);

  if (!open) return null;

  return (
    <div
      className={cn('absolute z-50 mt-1 rounded-md border bg-white p-4 shadow-lg', className)}
      {...props}
    >
      {children}
    </div>
  );
};
