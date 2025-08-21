'use client';

import { Container } from '@/components/layout/Container';
import { Button } from '@altamedica/ui';
import { ArrowRight, Play } from 'lucide-react';
import React from 'react';

interface Role {
  label: string;
  value: string;
  register: string;
  login: string;
}

interface RoleSelectorProps {
  roles: Role[];
  selectedRole: string;
  setSelectedRole: (role: string) => void;
  currentRole: Role;
  className?: string;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({
  roles,
  selectedRole,
  setSelectedRole,
  currentRole,
  className = '',
}) => {
  return (
    <section className={`py-8 bg-white border-b border-slate-100 ${className}`}>
      <Container size="lg" className="text-center">
        <h2 className="text-2xl font-bold mb-4 text-slate-800">Selecciona tu rol</h2>
        <div className="flex justify-center gap-4 mb-6">
          {roles.map((rol) => (
            <button
              key={rol.value}
              className={`px-6 py-2 rounded-full font-semibold border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                selectedRole === rol.value
                  ? 'bg-sky-600 text-white border-sky-600'
                  : 'bg-white text-sky-700 border-sky-300 hover:bg-sky-50'
              }`}
              onClick={() => setSelectedRole(rol.value)}
              aria-pressed={selectedRole === rol.value}
            >
              {rol.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => (window.location.href = currentRole.register)}
            className="btn-primary flex items-center justify-center"
            aria-label={`Registrarse como ${currentRole.label}`}
          >
            Registrarse como {currentRole.label}
            <Play className="ml-2 h-5 w-5" />
          </Button>
          <Button
            onClick={() => (window.location.href = currentRole.login)}
            className="btn-secondary flex items-center justify-center"
            aria-label={`Iniciar sesión como ${currentRole.label}`}
          >
            Iniciar sesión como {currentRole.label}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </Container>
    </section>
  );
};

export default RoleSelector;
