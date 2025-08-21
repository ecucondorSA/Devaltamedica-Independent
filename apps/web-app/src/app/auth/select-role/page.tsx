'use client';

import { useAuth, PublicUserRole } from '@altamedica/auth/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SelectRolePage() {
  const router = useRouter();
  const { user, updateProfile, isLoading } = useAuth() as any;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!isLoading && user && user.pendingRoleSelection === false) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  const handleSelect = async (role: PublicUserRole) => {
    if (!user) return;
    setSaving(true);
    setError('');
    try {
      // Persistir rol y limpiar bandera de selección pendiente
      await updateProfile({ role, pendingRoleSelection: false, profileComplete: true });
      // Enviar al login de su app para que sigan el flujo normal
      const base = role === PublicUserRole.DOCTOR
        ? 'http://localhost:3002'
        : role === PublicUserRole.COMPANY
          ? 'http://localhost:3004'
          : 'http://localhost:3003';
      window.location.href = `${base}/auth/login`;
    } catch (e: any) {
      setError(e?.message || 'Error guardando rol');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Selecciona tu rol</h1>
        <p className="text-neutral-600 mb-6">Necesitamos tu rol para enviarte al portal correcto.</p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => handleSelect(PublicUserRole.PATIENT)}
            disabled={saving}
            className="w-full py-3 rounded-xl border-2 border-neutral-200 hover:border-primary-400 transition disabled:opacity-50"
          >
            Paciente
          </button>
          <button
            onClick={() => handleSelect(PublicUserRole.DOCTOR)}
            disabled={saving}
            className="w-full py-3 rounded-xl border-2 border-neutral-200 hover:border-primary-400 transition disabled:opacity-50"
          >
            Médico
          </button>
          <button
            onClick={() => handleSelect(PublicUserRole.COMPANY)}
            disabled={saving}
            className="w-full py-3 rounded-xl border-2 border-neutral-200 hover:border-primary-400 transition disabled:opacity-50"
          >
            Empresa
          </button>
        </div>
      </div>
    </div>
  );
}


