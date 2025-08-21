import { Button, Card, Input } from '@altamedica/ui';
import React from 'react';

interface DiagnosisAssistantCardProps {
  age: number;
  gender: string;
  onStart?: () => void;
}

const DiagnosisAssistantCard: React.FC<DiagnosisAssistantCardProps> = ({ age, gender, onStart }) => (
  <div className="mb-6 shadow-lg border border-neutral-200 rounded-xl bg-white p-6">
    <div className="flex items-center gap-3 mb-2">
      <span className="inline-block text-primary-500">
        {/* Icono de diagnóstico inteligente */}
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 1 7 7c0 3.5-2.5 6.5-7 13-4.5-6.5-7-9.5-7-13a7 7 0 0 1 7-7zm0 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" fill="currentColor"/></svg>
      </span>
      <h2 className="text-xl font-semibold text-neutral-900">Asistente de Diagnóstico Inteligente</h2>
    </div>
    <p className="text-neutral-700 mb-2">Te ayudaré a entender mejor tus síntomas mediante preguntas específicas.</p>
    <div className="text-sm text-neutral-500 mb-2">{age} años · {gender}</div>
    <div className="bg-warning-50 border-l-4 border-warning-500 p-3 rounded mb-3 flex items-center gap-2">
      <svg className="w-5 h-5 text-warning-500" fill="none" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      <span><strong>Nota Importante:</strong> Este asistente es una herramienta de orientación. No reemplaza la consulta médica profesional.</span>
    </div>
    <button
      className="mt-2 px-5 py-2 rounded-lg bg-primary-500 text-white font-semibold text-base hover:bg-primary-600 transition"
      onClick={onStart}
    >
      Iniciar diagnóstico
    </button>
  </div>
);

export default DiagnosisAssistantCard;
