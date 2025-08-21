'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { logger } from '@altamedica/shared/services/logger.service';
// Importación desde @altamedica/ui centralizado
import {
  CardCorporate as Card,
  CardContentCorporate as CardContent,
  CardHeaderCorporate as CardHeader,
  ButtonCorporate as Button,
  StatusBadge as Badge,
  Separator
} from '@altamedica/ui';

// Componente simple para CardTitle
const CardTitle = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>
);
import { 
  CheckCircle, 
  FileText, 
  Calendar, 
  User, 
  Star,
  MessageSquare,
  Download,
  Share2
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  
  const [consultationData, setConsultationData] = useState<PostConsultationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState<number>(0);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (sessionId) {
      // Simular carga de datos de la consulta
      setTimeout(() => {
        setConsultationData({
          sessionId,
          doctorName: 'Dr. María González',
          specialty: 'Cardiología',
          date: new Date().toLocaleDateString('es-ES'),
          duration: '30 minutos',
          summary: 'Consulta de seguimiento cardiológico. El paciente presenta mejoría en los síntomas reportados. Se mantiene el tratamiento actual con ajustes menores en la dosis.',
          prescriptions: [
            {
              id: '1',
              medication: 'Amlodipino',
              dosage: '5mg',
              frequency: 'Una vez al día',
              duration: '30 días',
              instructions: 'Tomar en la mañana con el desayuno'
            },
            {
              id: '2',
              medication: 'Atorvastatina',
              dosage: '20mg',
              frequency: 'Una vez al día',
              duration: '30 días',
              instructions: 'Tomar en la noche'
            }
          ],
          nextSteps: [
            {
              id: '1',
              action: 'Continuar medicación actual',
              timeline: '30 días',
              priority: 'high'
            },
            {
              id: '2',
              action: 'Exámenes de laboratorio',
              timeline: '1 semana',
              priority: 'medium'
            },
            {
              id: '3',
              action: 'Seguimiento cardiológico',
              timeline: '3 meses',
              priority: 'medium'
            }
          ],
          followUpDate: '2025-03-19'
        });
        setLoading(false);
      }, 1000);
    }
  }, [sessionId]);

  const handleRating = (value: number) => {
    setRating(value);
  };

  const handleSubmitFeedback = () => {
    // Enviar feedback al backend
    logger.info('Feedback enviado:', { rating, feedback });
    // Mostrar confirmación
    alert('¡Gracias por tu feedback!');
  };

  const downloadPrescription = () => {
    // Generar PDF de prescripción
    logger.info('Descargando prescripción...');
  };

  const shareSummary = () => {
    // Compartir resumen
    if (navigator.share) {
      navigator.share({
        title: 'Resumen de Consulta Médica',
        text: `Consulta con ${consultationData?.doctorName} - ${consultationData?.date}`,
        url: window.location.href
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando resumen de consulta...</p>
        </div>
      </div>
    );
  }

  if (!consultationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Consulta no encontrada</h2>
          <p className="text-gray-600 mb-4">No se pudo cargar la información de la consulta</p>
          <Button onClick={() => router.push('/dashboard')}>
            Volver al Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Consulta Finalizada
          </h1>
          <p className="text-gray-600">
            Tu consulta con {consultationData.doctorName} ha sido completada exitosamente
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Resumen de Consulta */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Resumen de la Consulta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{consultationData.doctorName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{consultationData.date}</span>
                    </div>
                    <Badge variant="secondary">{consultationData.duration}</Badge>
                  </div>
                  <Separator />
                  <p className="text-gray-700 leading-relaxed">
                    {consultationData.summary}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Prescripciones */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Prescripciones Médicas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {consultationData.prescriptions.map((prescription) => (
                    <div key={prescription.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-lg">{prescription.medication}</h4>
                        <Badge variant="outline">{prescription.dosage}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Frecuencia:</span> {prescription.frequency}
                        </div>
                        <div>
                          <span className="font-medium">Duración:</span> {prescription.duration}
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-700">
                        <span className="font-medium">Instrucciones:</span> {prescription.instructions}
                      </div>
                    </div>
                  ))}
                  <Button 
                    onClick={downloadPrescription}
                    className="w-full"
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar Prescripción
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Próximos Pasos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Próximos Pasos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {consultationData.nextSteps.map((step) => (
                    <div key={step.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className={`w-3 h-3 rounded-full ${
                        step.priority === 'high' ? 'bg-red-500' :
                        step.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="font-medium">{step.action}</p>
                        <p className="text-sm text-gray-600">Timeline: {step.timeline}</p>
                      </div>
                      <Badge variant={
                        step.priority === 'high' ? 'destructive' :
                        step.priority === 'medium' ? 'secondary' : 'default'
                      }>
                        {step.priority}
                      </Badge>
                    </div>
                  ))}
                  {consultationData.followUpDate && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <p className="font-medium text-blue-800">
                        Próxima cita de seguimiento: {consultationData.followUpDate}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Evaluación */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Evalúa tu Experiencia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        onClick={() => handleRating(value)}
                        className={`p-2 rounded-full transition-colors ${
                          rating >= value ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      >
                        <Star className="h-6 w-6 fill-current" />
                      </button>
                    ))}
                  </div>
                  <textarea
                    placeholder="Comparte tu experiencia (opcional)"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full p-3 border rounded-lg resize-none"
                    rows={3}
                  />
                  <Button 
                    onClick={handleSubmitFeedback}
                    className="w-full"
                    disabled={rating === 0}
                  >
                    Enviar Evaluación
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Acciones Rápidas */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    onClick={() => router.push('/dashboard')}
                    className="w-full"
                    variant="outline"
                  >
                    Ir al Dashboard
                  </Button>
                  <Button 
                    onClick={() => router.push('/appointments')}
                    className="w-full"
                    variant="outline"
                  >
                    Programar Nueva Cita
                  </Button>
                  <Button 
                    onClick={shareSummary}
                    className="w-full"
                    variant="outline"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartir Resumen
                  </Button>
                  <Button 
                    onClick={() => router.push('/chat')}
                    className="w-full"
                    variant="outline"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contactar al Médico
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 