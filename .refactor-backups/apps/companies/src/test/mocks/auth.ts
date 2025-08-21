import React from 'react';

// Permite usar jest.fn en contexto de pruebas sin tipos
declare const jest: any;

export const mockAuth = {
  user: {
    uid: 'test-uid',
    email: 'test@example.com',
    displayName: 'Test User',
  },
  isAuthenticated: true,
  isAuthenticating: false,
  error: null,
  login: jest.fn(),
  logout: jest.fn(),
  signup: jest.fn(),
};

export const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Wrapper simple sin JSX para evitar errores en archivo .ts
  return (children as any) as unknown as React.ReactElement;
};
