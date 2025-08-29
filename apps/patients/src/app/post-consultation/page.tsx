'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { logger } from '@altamedica/shared';
// Importación desde @altamedica/ui centralizado
import {
  CardCorporate as Card,
  CardContentCorporate as CardContent,
  CardHeaderCorporate as CardHeader,
  ButtonCorporate as Button,
  StatusBadge as Badge,
  Separator,
} from '@altamedica/ui';

// Componente simple para CardTitle
const CardTitle = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>;
import {
  CheckCircle,
  FileText,
  Calendar,
  User,
  Star,
  MessageSquare,
  Download,
  Share2,
} from 'lucide-react';

interface PostConsultationData {
  sessionId: string;
  doctorName: string;
  specialty: string;
  date: string;
  duration: string;
  summary: string;
  prescriptions: Array<{
    id: string;
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>;
  nextSteps: Array<{
    id: string;
    action: string;
    timeline: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  followUpDate?: string;
  rating?: number;
}

export default function PostConsultationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Página temporalmente deshabilitada
        </h2>
        <p className="text-gray-600 mb-4">Esta funcionalidad estará disponible próximamente</p>
      </div>
    </div>
  );
}
