'use client';

import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Pill, 
  AlertTriangle, 
  FileText, 
  Stethoscope,
  ChevronRight,
  Mic,
  MicOff,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { Card, Button, Badge, Tabs, TabsContent, TabsList, TabsTrigger } from '@altamedica/ui';
import { medicalAssistant, type Diagnosis, type DrugInteraction, type ClinicalNote } from '@/services/medical-assistant.service';
import { motion, AnimatePresence } from 'framer-motion';

import { logger } from '@altamedica/shared';
interface MedicalAssistantPanelProps {
  patientId?: string;
  consultationId?: string;
  symptoms?: string[];
  medications?: Array<{
    name: string;
    dosage: string;
    frequency: string;
  }>;
  onDiagnosisSelect?: (diagnosis: Diagnosis) => void;
}

export function MedicalAssistantPanel({
  patientId,
  consultationId,
  symptoms = [],
  medications = [],
  onDiagnosisSelect
}: MedicalAssistantPanelProps) {
  const [activeTab, setActiveTab] = useState('diagnostics');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Estados para resultados
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [interactions, setInteractions] = useState<DrugInteraction[]>([]);
  const [clinicalNote, setClinicalNote] = useState<ClinicalNote | null>(null);
  const [protocol, setProtocol] = useState<string[]>([]);
  const [conversationAnalysis, setConversationAnalysis] = useState<any>(null);

  // Efecto para actualizar diagnósticos cuando cambian los síntomas
  useEffect(() => {
    if (symptoms.length > 0) {
      suggestDiagnoses();
    }
  }, [symptoms]);

  // Efecto para verificar interacciones cuando cambian los medicamentos
  useEffect(() => {
    if (medications.length > 1) {
      checkInteractions();
    }
  }, [medications]);

  const suggestDiagnoses = async () => {
    if (symptoms.length === 0) return;
    
    setIsProcessing(true);
    try {
      const suggestions = await medicalAssistant.suggestDiagnosis(symptoms);
      setDiagnoses(suggestions);
    } catch (error) {
      logger.error('Error al sugerir diagnósticos:', String(error));
    } finally {
      setIsProcessing(false);
    }
  };

  const checkInteractions = async () => {
    if (medications.length < 2) return;
    
    setIsProcessing(true);
    try {
      const medicationData = medications.map(med => ({
        ...med,
        route: 'oral', // Default
        genericName: '',
      }));
      const results = await medicalAssistant.checkDrugInteractions(medicationData);
      setInteractions(results);
    } catch (error) {
      logger.error('Error al verificar interacciones:', String(error));
    } finally {
      setIsProcessing(false);
    }
  };

  const generateNote = async () => {
    setIsProcessing(true);
    try {
      const note = await medicalAssistant.generateClinicalNotes({
        symptoms,
        diagnosis: diagnoses.map(d => d.name),
        medications: medications.map(med => ({
          ...med,
          route: 'oral',
          genericName: '',
        })),
      });
      setClinicalNote(note);
    } catch (error) {
      logger.error('Error al generar nota clínica:', String(error));
    } finally {
      setIsProcessing(false);
    }
  };

  const loadProtocol = async (condition: string) => {
    setIsProcessing(true);
    try {
      const protocolSteps = await medicalAssistant.getProtocol(condition);
      setProtocol(protocolSteps);
    } catch (error) {
      logger.error('Error al cargar protocolo:', String(error));
    } finally {
      setIsProcessing(false);
    }
  };

  const analyzeConversation = async () => {
    if (!transcript) return;
    
    setIsProcessing(true);
    try {
      const analysis = await medicalAssistant.analyzeConversation(transcript);
      setConversationAnalysis(analysis);
    } catch (error) {
      logger.error('Error al analizar conversación:', String(error));
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleListening = () => {
    if (!isListening) {
      // Iniciar grabación (simulado para POC)
      setIsListening(true);
      // En producción, aquí iniciarías el reconocimiento de voz real
      simulateTranscription();
    } else {
      setIsListening(false);
      // Analizar al detener
      if (transcript) {
        analyzeConversation();
      }
    }
  };

  const simulateTranscription = () => {
    // Simulación de transcripción para POC
    const sampleTranscript = "El paciente refiere dolor en el pecho de tipo opresivo, " +
      "que se irradia al brazo izquierdo. También menciona dificultad para respirar " +
      "y sudoración excesiva. Los síntomas comenzaron hace aproximadamente 30 minutos.";
    
    setTimeout(() => {
      setTranscript(sampleTranscript);
      setIsListening(false);
      analyzeConversation();
    }, 3000);
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      'minor': 'bg-yellow-100 text-yellow-800',
      'moderate': 'bg-orange-100 text-orange-800',
      'major': 'bg-red-100 text-red-800',
      'contraindicated': 'bg-red-200 text-red-900',
    };
    return colors[severity] || 'bg-gray-100 text-gray-800';
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 70) return 'bg-green-500';
    if (probability >= 40) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  return (
    <Card className="w-full h-full bg-white shadow-xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Asistente Médico IA</h2>
              <p className="text-sm opacity-90">Soporte diagnóstico en tiempo real</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={isListening ? "destructive" : "secondary"}
              size="sm"
              onClick={toggleListening}
              className="bg-white/20"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {isListening ? 'Detener' : 'Escuchar'}
            </Button>
            <Badge variant="secondary" className="bg-white/20 text-white">
              <Sparkles className="w-3 h-3 mr-1" />
              IA Activa
            </Badge>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="p-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="diagnostics">
            <Stethoscope className="w-4 h-4 mr-2" />
            Diagnósticos
          </TabsTrigger>
          <TabsTrigger value="medications">
            <Pill className="w-4 h-4 mr-2" />
            Medicamentos
          </TabsTrigger>
          <TabsTrigger value="notes">
            <FileText className="w-4 h-4 mr-2" />
            Notas
          </TabsTrigger>
          <TabsTrigger value="protocol">
            <Brain className="w-4 h-4 mr-2" />
            Protocolo
          </TabsTrigger>
        </TabsList>

        {/* Diagnósticos Tab */}
        <TabsContent value="diagnostics" className="space-y-4">
          {symptoms.length > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-semibold text-blue-800 mb-2">Síntomas actuales:</p>
              <div className="flex flex-wrap gap-2">
                {symptoms.map((symptom, index) => (
                  <Badge key={index} variant="secondary">
                    {symptom}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {isProcessing ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-primary-500" />
              <span className="ml-2 text-gray-600">Analizando síntomas...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {diagnoses.map((diagnosis, index) => (
                <motion.div
                  key={diagnosis.code}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => onDiagnosisSelect?.(diagnosis)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">{diagnosis.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {diagnosis.code}
                        </Badge>
                      </div>
                      
                      <div className="mt-2 flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <span className="text-sm text-gray-600">Probabilidad:</span>
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${getProbabilityColor(diagnosis.probability)}`}
                              style={{ width: `${diagnosis.probability}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold">{diagnosis.probability}%</span>
                        </div>
                      </div>

                      {diagnosis.evidence && diagnosis.evidence.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500">Evidencia:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {diagnosis.evidence.map((ev, i) => (
                              <span key={i} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                {ev}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {diagnosis.differentialDiagnosis && diagnosis.differentialDiagnosis.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500">Diagnóstico diferencial:</p>
                          <p className="text-sm text-gray-600">
                            {diagnosis.differentialDiagnosis.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        loadProtocol(diagnosis.name);
                        setActiveTab('protocol');
                      }}
                    >
                      Ver protocolo
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              ))}

              {diagnoses.length === 0 && symptoms.length > 0 && (
                <div className="text-center py-8 text-gray-500">
                  No se encontraron diagnósticos sugeridos para estos síntomas
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Medicamentos Tab */}
        <TabsContent value="medications" className="space-y-4">
          {medications.length > 0 && (
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm font-semibold text-green-800 mb-2">Medicamentos actuales:</p>
              <div className="space-y-1">
                {medications.map((med, index) => (
                  <div key={index} className="text-sm text-green-700">
                    • {med.name} - {med.dosage} {med.frequency}
                  </div>
                ))}
              </div>
            </div>
          )}

          {interactions.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
                Interacciones Detectadas
              </h3>
              
              {interactions.map((interaction, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg ${getSeverityColor(interaction.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">
                        {interaction.drug1} ↔ {interaction.drug2}
                      </h4>
                      <p className="text-sm mt-1">{interaction.description}</p>
                      <p className="text-sm mt-2 font-medium">
                        Recomendación: {interaction.recommendation}
                      </p>
                    </div>
                    <Badge variant="destructive">
                      {interaction.severity.toUpperCase()}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {medications.length > 1 && interactions.length === 0 && (
            <div className="p-4 bg-green-50 rounded-lg text-green-800">
              <p className="font-semibold">✓ No se detectaron interacciones significativas</p>
              <p className="text-sm mt-1">Los medicamentos pueden administrarse de forma segura</p>
            </div>
          )}
        </TabsContent>

        {/* Notas Clínicas Tab */}
        <TabsContent value="notes" className="space-y-4">
          <Button onClick={generateNote} disabled={isProcessing}>
            <FileText className="w-4 h-4 mr-2" />
            Generar Nota SOAP
          </Button>

          {clinicalNote && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-bold text-gray-900 mb-2">S - Subjetivo</h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{clinicalNote.subjective}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-bold text-gray-900 mb-2">O - Objetivo</h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{clinicalNote.objective}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-bold text-gray-900 mb-2">A - Assessment</h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{clinicalNote.assessment}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-bold text-gray-900 mb-2">P - Plan</h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{clinicalNote.plan}</p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" size="sm">
                  Copiar
                </Button>
                <Button variant="primary" size="sm">
                  Guardar en expediente
                </Button>
              </div>
            </motion.div>
          )}
        </TabsContent>

        {/* Protocolo Tab */}
        <TabsContent value="protocol" className="space-y-4">
          {protocol.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Protocolo Clínico Recomendado</h3>
              {protocol.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-3"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold text-sm">
                    {index + 1}
                  </div>
                  <p className="text-sm text-gray-700 pt-1">{step}</p>
                </motion.div>
              ))}
            </div>
          )}

          {protocol.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Selecciona un diagnóstico para ver el protocolo recomendado
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Análisis de Conversación (si está activo) */}
      {conversationAnalysis && (
        <div className="p-4 border-t">
          <h3 className="font-semibold text-gray-900 mb-3">Análisis de Conversación</h3>
          
          {conversationAnalysis.redFlags.length > 0 && (
            <div className="mb-3 p-3 bg-red-50 rounded-lg">
              <p className="font-semibold text-red-800 text-sm mb-1">Señales de Alarma:</p>
              {conversationAnalysis.redFlags.map((flag: string, i: number) => (
                <p key={i} className="text-sm text-red-700">{flag}</p>
              ))}
            </div>
          )}

          {conversationAnalysis.keyPoints.length > 0 && (
            <div className="mb-3">
              <p className="font-semibold text-sm text-gray-700 mb-1">Puntos Clave:</p>
              {conversationAnalysis.keyPoints.map((point: string, i: number) => (
                <p key={i} className="text-sm text-gray-600">• {point}</p>
              ))}
            </div>
          )}

          {conversationAnalysis.suggestedQuestions.length > 0 && (
            <div className="mb-3">
              <p className="font-semibold text-sm text-gray-700 mb-1">Preguntas Sugeridas:</p>
              {conversationAnalysis.suggestedQuestions.map((q: string, i: number) => (
                <p key={i} className="text-sm text-blue-600">? {q}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}