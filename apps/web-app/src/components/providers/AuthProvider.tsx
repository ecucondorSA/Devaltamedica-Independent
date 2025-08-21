'use client';
import { AuthProvider as CoreAuthProvider } from '@altamedica/auth/client';
import React from 'react';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return <CoreAuthProvider>{children}</CoreAuthProvider>;
}
