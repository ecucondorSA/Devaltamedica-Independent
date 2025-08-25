// Stub temporal para @altamedica/auth hasta que se resuelva el problema de resolución de módulos
import React from 'react';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;

export const useAuth = () => ({
  user: {
    id: 'stub-user-id',
    email: 'stub@example.com',
    name: 'Stub User',
  },
  isAuthenticated: true,
  isLoading: false,
  logout: () => {
    console.log('Stub logout called');
  },
});

export type User = {
  id: string;
  email: string;
  name: string;
};
