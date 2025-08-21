import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center gradient-primary">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-sky-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-800 mb-2">
          Cargando ALTAMEDICA
        </h2>
        <p className="text-slate-600">
          Preparando la mejor experiencia médica para ti...
        </p>
      </div>
    </div>
  );
}
