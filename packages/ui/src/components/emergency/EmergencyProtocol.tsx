/**
 * @fileoverview Panel de protocolos médicos de emergencia
 * @module @altamedica/ui/emergency
 * @description Panel interactivo para guiar protocolos médicos de emergencia
 */

import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Circle,
  Clock,
  Heart,
  Stethoscope,
  Syringe,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import { Progress } from '../Progress';

export interface ProtocolStep {
  id: string;
  title: string;
  description: string;
  criticalTime?: number; // Tiempo crítico en segundos
  icon?: React.ReactNode;
  required: boolean;
  subSteps?: string[];
}

export interface EmergencyProtocolProps {
  protocolCode:
    | 'CODE_BLUE'
    | 'CODE_STEMI'
    | 'CODE_STROKE'
    | 'CODE_ANAPHYLAXIS'
    | 'CODE_RESPIRATORY';
  patientInfo?: {
    name: string;
    age: number;
    medicalRecord: string;
  };
  onStepComplete?: (stepId: string, timestamp: Date) => void;
  onProtocolComplete?: (completedSteps: string[], duration: number) => void;
  onEmergencyEscalate?: () => void;
  className?: string;
}

const PROTOCOLS = {
  CODE_BLUE: {
    name: 'Paro Cardíaco',
    icon: <Heart className="w-5 h-5" />,
    color: 'blue',
    steps: [
      {
        id: 'verify-response',
        title: 'Verificar respuesta',
        description: 'Sacudir suavemente y gritar "¿Está usted bien?"',
        criticalTime: 10,
        required: true,
      },
      {
        id: 'call-help',
        title: 'Llamar ayuda',
        description: 'Activar código azul y solicitar DEA',
        criticalTime: 30,
        required: true,
      },
      {
        id: 'start-cpr',
        title: 'Iniciar RCP',
        description: '30 compresiones : 2 ventilaciones',
        criticalTime: 60,
        required: true,
        subSteps: [
          'Posicionar al paciente en superficie firme',
          'Colocar talón de la mano en centro del pecho',
          'Comprimir al menos 5cm de profundidad',
          'Ritmo 100-120 compresiones/minuto',
        ],
      },
      {
        id: 'attach-dea',
        title: 'Conectar DEA',
        description: 'Seguir instrucciones del dispositivo',
        criticalTime: 180,
        required: true,
      },
    ],
  },
  CODE_STEMI: {
    name: 'Infarto Agudo',
    icon: <Activity className="w-5 h-5" />,
    color: 'red',
    steps: [
      {
        id: 'ecg-12-lead',
        title: 'ECG 12 derivaciones',
        description: 'Obtener ECG en <10 minutos',
        criticalTime: 600,
        required: true,
      },
      {
        id: 'aspirin',
        title: 'Administrar Aspirina',
        description: '300mg sublingual STAT',
        criticalTime: 300,
        required: true,
      },
      {
        id: 'notify-cathlab',
        title: 'Activar sala de cateterismo',
        description: 'Notificar equipo de hemodinamia',
        criticalTime: 900,
        required: true,
      },
      {
        id: 'door-to-balloon',
        title: 'Preparar traslado',
        description: 'Objetivo: puerta-balón <90 min',
        criticalTime: 5400,
        required: true,
      },
    ],
  },
  CODE_STROKE: {
    name: 'ACV Agudo',
    icon: <Stethoscope className="w-5 h-5" />,
    color: 'purple',
    steps: [
      {
        id: 'fast-assessment',
        title: 'Evaluación FAST',
        description: 'Face-Arms-Speech-Time',
        criticalTime: 300,
        required: true,
        subSteps: [
          'Facial: Asimetría facial',
          'Arms: Debilidad en brazos',
          'Speech: Dificultad para hablar',
          'Time: Anotar hora de inicio',
        ],
      },
      {
        id: 'ct-scan',
        title: 'TC cerebral urgente',
        description: 'Descartar hemorragia',
        criticalTime: 1500,
        required: true,
      },
      {
        id: 'thrombolysis-eval',
        title: 'Evaluar trombolisis',
        description: 'Ventana <4.5 horas',
        criticalTime: 3600,
        required: true,
      },
    ],
  },
  CODE_ANAPHYLAXIS: {
    name: 'Anafilaxia',
    icon: <Syringe className="w-5 h-5" />,
    color: 'orange',
    steps: [
      {
        id: 'epinephrine',
        title: 'Epinefrina IM',
        description: '0.3-0.5mg cara anterolateral muslo',
        criticalTime: 60,
        required: true,
      },
      {
        id: 'oxygen',
        title: 'Oxígeno alto flujo',
        description: 'Mantener SatO2 >94%',
        criticalTime: 120,
        required: true,
      },
      {
        id: 'iv-access',
        title: 'Acceso IV',
        description: 'Iniciar cristaloides',
        criticalTime: 300,
        required: true,
      },
      {
        id: 'monitor',
        title: 'Monitorizar',
        description: 'Vigilar respuesta y shock',
        criticalTime: 600,
        required: true,
      },
    ],
  },
  CODE_RESPIRATORY: {
    name: 'Insuficiencia Respiratoria',
    icon: <Activity className="w-5 h-5" />,
    color: 'cyan',
    steps: [
      {
        id: 'position',
        title: 'Posición Fowler',
        description: 'Elevar cabecera 45-90°',
        criticalTime: 60,
        required: true,
      },
      {
        id: 'oxygen-therapy',
        title: 'Oxigenoterapia',
        description: 'Iniciar con máscara reservorio',
        criticalTime: 120,
        required: true,
      },
      {
        id: 'nebulization',
        title: 'Broncodilatadores',
        description: 'Salbutamol nebulizado',
        criticalTime: 300,
        required: true,
      },
      {
        id: 'prepare-intubation',
        title: 'Preparar intubación',
        description: 'Si no mejora con medidas',
        criticalTime: 600,
        required: false,
      },
    ],
  },
};

export const EmergencyProtocol: React.FC<EmergencyProtocolProps> = ({
  protocolCode,
  patientInfo,
  onStepComplete,
  onProtocolComplete,
  onEmergencyEscalate,
  className,
}) => {
  const protocol = PROTOCOLS[protocolCode];
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [startTime] = useState<Date>(new Date());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Timer para tiempo transcurrido
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  const handleStepToggle = (stepId: string) => {
    const newCompleted = new Set(completedSteps);

    if (newCompleted.has(stepId)) {
      newCompleted.delete(stepId);
    } else {
      newCompleted.add(stepId);
      onStepComplete?.(stepId, new Date());

      // Avanzar al siguiente paso
      const currentIndex = protocol.steps.findIndex((s) => s.id === stepId);
      if (currentIndex < protocol.steps.length - 1) {
        setCurrentStepIndex(currentIndex + 1);
      }
    }

    setCompletedSteps(newCompleted);

    // Verificar si el protocolo está completo
    const requiredSteps = protocol.steps.filter((s) => s.required);
    const allRequiredComplete = requiredSteps.every((s) => newCompleted.has(s.id));

    if (allRequiredComplete) {
      onProtocolComplete?.(Array.from(newCompleted), elapsedTime);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStepStatus = (step: ProtocolStep, index: number) => {
    if (completedSteps.has(step.id)) return 'completed';
    if (index === currentStepIndex) return 'current';
    if (step.criticalTime && elapsedTime > step.criticalTime) return 'overdue';
    return 'pending';
  };

  const progress = (completedSteps.size / protocol.steps.length) * 100;

  return (
    <Card data-testid="emergency-protocol" className={cn('w-full max-w-2xl', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {protocol.icon}
            <span>Protocolo: {protocol.name}</span>
            <Badge variant="destructive" className="ml-2">
              {protocolCode}
            </Badge>
          </CardTitle>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4" />
              <span className="font-mono">{formatTime(elapsedTime)}</span>
            </div>

            {onEmergencyEscalate && (
              <Button
                data-testid="escalate-emergency"
                onClick={onEmergencyEscalate}
                variant="destructive"
                size="sm"
              >
                Escalar Emergencia
              </Button>
            )}
          </div>
        </div>

        {patientInfo && (
          <div className="text-sm text-muted-foreground mt-2">
            Paciente: {patientInfo.name} | Edad: {patientInfo.age} | HC: {patientInfo.medicalRecord}
          </div>
        )}

        <Progress value={progress} className="mt-3" />
      </CardHeader>

      <CardContent className="space-y-3">
        {protocol.steps.map((step, index) => {
          const status = getStepStatus(step, index);
          const isOverdue = status === 'overdue';
          const isCurrent = status === 'current';
          const isCompleted = status === 'completed';

          return (
            <div
              key={step.id}
              className={cn(
                'border rounded-lg p-4 transition-all',
                isCompleted && 'bg-green-50 border-green-200',
                isCurrent && 'bg-blue-50 border-blue-300 shadow-md',
                isOverdue && 'bg-red-50 border-red-300 animate-pulse',
              )}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => handleStepToggle(step.id)}
                  className="mt-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full"
                  aria-label={`Marcar paso ${step.title} como ${isCompleted ? 'incompleto' : 'completo'}`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-400" />
                  )}
                </button>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold flex items-center gap-2">
                      {step.icon}
                      {step.title}
                      {step.required && (
                        <Badge variant="secondary" className="text-xs">
                          Requerido
                        </Badge>
                      )}
                    </h4>

                    {step.criticalTime && (
                      <span
                        className={cn(
                          'text-sm font-mono',
                          isOverdue ? 'text-red-600 font-bold' : 'text-gray-500',
                        )}
                      >
                        {isOverdue && <AlertCircle className="w-4 h-4 inline mr-1" />}
                        Límite: {formatTime(step.criticalTime)}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mt-1">{step.description}</p>

                  {step.subSteps && (
                    <ul className="mt-2 space-y-1">
                      {step.subSteps.map((subStep, subIndex) => (
                        <li key={subIndex} className="text-sm text-gray-500 flex items-start gap-2">
                          <span className="text-gray-400 mt-0.5">•</span>
                          {subStep}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default EmergencyProtocol;
