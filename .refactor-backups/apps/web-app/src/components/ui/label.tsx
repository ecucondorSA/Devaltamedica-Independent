import React from 'react';

export function Label({ children, className = '', ...props }: { 
  children: React.ReactNode; 
  className?: string; 
  [key: string]: any 
}) {
  return (
    <label 
      className={`block text-sm font-medium text-gray-700 mb-1 ${className}`} 
      {...props}
    >
      {children}
    </label>
  );
}