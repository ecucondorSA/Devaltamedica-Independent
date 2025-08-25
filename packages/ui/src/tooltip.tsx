import React from 'react';

export const Tooltip: React.FC<
  React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }
> = ({ children, ...props }) => <div {...props}>{children}</div>;

export const TooltipContent: React.FC<
  React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }
> = ({ children, ...props }) => <div {...props}>{children}</div>;

export const TooltipProvider: React.FC<
  React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }
> = ({ children, ...props }) => <div {...props}>{children}</div>;

export const TooltipTrigger: React.FC<
  React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode; asChild?: boolean }
> = ({ children, asChild, ...props }) =>
  asChild ? <>{children}</> : <div {...props}>{children}</div>;
