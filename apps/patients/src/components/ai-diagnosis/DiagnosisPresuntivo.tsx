'use client';

import { useDiagnosisQuickAnalysis } from '../../hooks/ai/useDiagnosisQuickAnalysis.stub';
import { useDiagnosisRestrictions } from '../../hooks/ai/useDiagnosisRestrictions.stub';
import { ButtonCorporate } from '@altamedica/ui';
import {
  Activity,
  Brain,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  Info,
  Shield,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type DiagnosisRestriction = ReturnType<typeof useDiagnosisRestrictions>['data'];

interface QuickSymptom {
  id: string;
  text: string;
  icon: string;
}

const QUICK_SYMPTOMS: QuickSymptom[] = [
  { id: '1', text: 'Dolor de cabeza', icon: '🤕' },
  { id: '2', text: 'Fiebre', icon: '🌡️' },
  { id: '3', text: 'Tos', icon: '🤧' },
  { id: '4', text: 'Dolor de garganta', icon: '🗣️' },
  { id: '5', text: 'Fatiga', icon: '😴' },
  { id: '6', text: 'Náuseas', icon: '🤢' },
];

export default function DiagnosisPresuntivo() {
  const router = useRouter();
  const [restriction, setRestriction] = useState<NonNullable<DiagnosisRestriction> | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [showDataUsageInfo, setShowDataUsageInfo] = useState(false);
  const { mutateAsync: runAnalysis, isPending: isAnalyzing } = useDiagnosisQuickAnalysis();
  const [lastAnalysis, setLastAnalysis] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  const restrictionsQuery = useDiagnosisRestrictions(undefined);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (restrictionsQuery.data) {
      const r = restrictionsQuery.data;
      setRestriction({
        canUse: r.canUse,
        nextAvailableDate: r.nextAvailableDate,
        daysRemaining: r.daysRemaining,
        totalDiagnosesCount: r.totalDiagnosesCount,
        lastDiagnosisDate: r.lastDiagnosisDate,
      });
    } else if (
      (restrictionsQuery.status === 'error' || restrictionsQuery.status === 'pending') &&
      isClient
    ) {
      const lastDate = localStorage.getItem('lastDiagnosisDate');
      const count = parseInt(localStorage.getItem('diagnosisCount') || '0');
      if (lastDate) {
        const daysSince = Math.floor(
          (Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24),
        );
        const canUse = daysSince >= 10;
        setRestriction({
          canUse,
          nextAvailableDate: canUse
            ? undefined
            : new Date(
                new Date(lastDate).getTime() + 10 * 24 * 60 * 60 * 1000,
              ).toLocaleDateString(),
          daysRemaining: canUse ? 0 : 10 - daysSince,
          totalDiagnosesCount: count,
          lastDiagnosisDate: lastDate || undefined,
        });
      } else {
        setRestriction({ canUse: true, totalDiagnosesCount: count });
      }
    }
  }, [restrictionsQuery.data, restrictionsQuery.status, isClient]);

  // Evitar hidratación si no estamos en el cliente
  if (!isClient) {
    return (
      <div className="bg-white rounded-xl border shadow-sm p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
              <div className="w-5 h-5 sm:w-6 sm:h-6 text-white">🧠</div>
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-gray-900">Diagnóstico AI</h2>
              <p className="text-xs sm:text-sm text-gray-600">Análisis rápido de síntomas</p>
            </div>
          </div>
        </div>
        <div className="text-sm text-gray-500">Cargando sistema de diagnóstico...</div>
      </div>
    );
  }

  const toggleSymptom = (symptomId: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptomId) ? prev.filter((id) => id !== symptomId) : [...prev, symptomId],
    );
  };

  const handleQuickAnalysis = async () => {
    if (!restriction?.canUse || selectedSymptoms.length === 0 || !isClient) return;
    const result = await runAnalysis({ symptoms: selectedSymptoms });
    if (isClient) {
      localStorage.setItem('lastDiagnosisDate', new Date().toISOString());
      localStorage.setItem('diagnosisCount', String((restriction?.totalDiagnosesCount || 0) + 1));
    }
    setLastAnalysis(result?.summary || 'Análisis completado.');
    setTimeout(() => {
      router.push('/ai-diagnosis');
    }, 3000);
  };

  const canUseDiagnosis = restriction?.canUse ?? true;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-sky-100 p-4 sm:p-6 h-full flex flex-col">
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="p-1.5 sm:p-2 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg">
            <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900">Diagnóstico presuntivo</h3>
            <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
              Análisis rápido de síntomas
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowDataUsageInfo(!showDataUsageInfo)}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Información de uso de datos"
        >
          <Info className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {showDataUsageInfo && (
        <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-2">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-blue-800">
              <p className="font-medium mb-0.5 sm:mb-1">Uso de datos para investigación</p>
              <p className="text-xs">Datos anónimos para mejorar la salud poblacional.</p>
            </div>
          </div>
        </div>
      )}

      {/* Aviso de orientación general */}
      <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-2">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-blue-800">
            No esperes a que empeore: los datos indican que, en promedio, los hombres tienden a
            retrasar las consultas; ante dudas o síntomas persistentes, busca atención médica.
          </p>
        </div>
      </div>

      {restriction && !canUseDiagnosis && (
        <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <div className="text-sm">
              <p className="font-medium text-amber-800">
                Próximo diagnóstico disponible en {restriction.daysRemaining} días
              </p>
              <p className="text-xs text-amber-700">Límite: 1 diagnóstico cada 10 días</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 space-y-3 sm:space-y-4">
        <div>
          <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Selecciona síntomas:</p>
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            {QUICK_SYMPTOMS.map((symptom) => (
              <button
                key={symptom.id}
                onClick={() => toggleSymptom(symptom.id)}
                disabled={!canUseDiagnosis}
                className={`p-1.5 sm:p-2 rounded-lg border text-xs sm:text-sm font-medium transition-all ${
                  selectedSymptoms.includes(symptom.id)
                    ? 'bg-sky-100 border-sky-300 text-sky-700'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-sky-200'
                } ${!canUseDiagnosis ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="mr-0.5 sm:mr-1 text-sm sm:text-base">{symptom.icon}</span>
                <span className="hidden sm:inline">{symptom.text}</span>
                <span className="sm:hidden">{symptom.text.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {lastAnalysis && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-green-800 mb-1">Análisis completado</p>
                <p className="text-green-700">{lastAnalysis}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <Activity className="w-4 h-4" />
            <span>Diagnósticos realizados: {restriction?.totalDiagnosesCount || 0}</span>
          </div>
          {restriction?.lastDiagnosisDate && (
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>Último: {new Date(restriction.lastDiagnosisDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <ButtonCorporate
          variant="primary"
          className="w-full"
          onClick={handleQuickAnalysis}
          disabled={!canUseDiagnosis || selectedSymptoms.length === 0 || isAnalyzing}
        >
          {isAnalyzing ? (
            <span className="flex items-center justify-center">
              <Activity className="w-4 h-4 mr-2 animate-pulse" />
              Analizando síntomas...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <Brain className="w-4 h-4 mr-2" />
              Obtener diagnóstico rápido
            </span>
          )}
        </ButtonCorporate>

        <ButtonCorporate
          variant="ghost"
          className="w-full"
          onClick={() => router.push('/ai-diagnosis')}
        >
          <span className="flex items-center justify-center text-sm">
            Análisis completo con IA
            <ChevronRight className="w-4 h-4 ml-1" />
          </span>
        </ButtonCorporate>
      </div>
    </div>
  );
}
