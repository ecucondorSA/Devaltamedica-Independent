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
  return (
    <div className="bg-white rounded-xl border shadow-sm p-3 sm:p-4">
      <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
        <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
          <div className="w-5 h-5 sm:w-6 sm:h-6 text-white">🧠</div>
        </div>
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-gray-900">Diagnóstico AI</h2>
          <p className="text-xs sm:text-sm text-gray-600">
            Funcionalidad temporalmente deshabilitada
          </p>
        </div>
      </div>
      <div className="text-sm text-gray-500">Esta funcionalidad estará disponible próximamente</div>
    </div>
  );
}
