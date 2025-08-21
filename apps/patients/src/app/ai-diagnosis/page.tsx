'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Html } from '@react-three/drei';
import * as THREE from 'three';
import { logger } from '@altamedica/shared/services/logger.service';
// import dynamic from 'next/dynamic';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Brain,
  Camera,
  CameraOff,
  ChevronRight,
  Download,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  Scan,
  Send,
  Shield,
  Star,
  Users,
  X
} from 'lucide-react';

// Importación dinámica del mapa - comentado porque no se usa
// const Map = dynamic(() => import('@/components/Map'), {
//   ssr: false,
//   loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
// });

// Modelos 3D del doctor (del anamnesis-juego)
const DOCTOR_MODELS = [
  '/models/nurse.glb',
  '/models/doctor_male.glb',
  '/models/doctor_female.glb'
];

// Posiciones personalizadas por modelo
const DOCTOR_MODEL_POSITIONS: Record<string, [number, number, number]> = {
  '/models/nurse.glb': [0, 0.7, 0],
  '/models/doctor_male.glb': [0, 0.3, 0],
  '/models/doctor_female.glb': [0, -3., 0],
};

const DOCTOR_MODEL_SCALES: Record<string, [number, number, number]> = {
  '/models/nurse.glb': [1.1, 1.1, 1.1],
  '/models/doctor_male.glb': [1.1, 1.1, 1.1],
  '/models/doctor_female.glb': [1.5, 1.5, 1.5],
};

// Interfaces
interface VitalSigns {
  heartRate?: number;
  temperature?: number;
  bloodPressure?: string;
  oxygenSaturation?: number;
  respiratoryRate?: number;
  timestamp: Date;
}

interface SymptomEntry {
  id: string;
  text: string;
  intensity: number;
  duration: string;
  bodyPart: string;
  timestamp: Date;
  source: 'voice' | 'text' | 'visual';
  audioUrl?: string;
  imageUrl?: string;
}

interface VisualAnalysis {
  id: string;
  type: 'rash' | 'swelling' | 'injury' | 'skin' | 'eye' | 'throat';
  confidence: number;
  description: string;
  severity: 'mild' | 'moderate' | 'severe';
  imageUrl: string;
  annotations?: Array<{
    x: number;
    y: number;
    label: string;
  }>;
}

interface DiagnosisResult {
  id: string;
  diagnosis: string;
  confidence: number;
  specialist: string;
  urgency: 'low' | 'medium' | 'high';
  recommendations: string[];
  estimatedTime: string;
  symptoms: SymptomEntry[];
  vitalSigns?: VitalSigns;
  visualAnalysis?: VisualAnalysis[];
  nearbySpecialists?: SpecialistLocation[];
  probabilityScore: number;
  differentialDiagnosis: Array<{
    condition: string;
    probability: number;
  }>;
  nextSteps: string[];
  timestamp: Date;
}

interface SpecialistLocation {
  id: string;
  name: string;
  specialty: string;
  distance: number;
  lat: number;
  lng: number;
  availability: 'available' | 'busy' | 'offline';
  rating: number;
  phone: string;
  address: string;
  canVideoCall: boolean;
  nextAvailable: Date;
  estimatedWaitTime: number;
}

interface DeviceSensor {
  type: 'heartRate' | 'temperature' | 'oxygenSaturation';
  available: boolean;
  lastReading?: number;
  unit: string;
}

// Componente 3D del Doctor (migrado del anamnesis-juego)
function Doctor3D({ 
  currentStep,
  isAnalyzing,
  confidence,
  symptomsCount,
}: { 
  currentStep: number;
  isAnalyzing: boolean;
  confidence: number;
  symptomsCount: number;
}) {
  const modelIndex = Math.floor(currentStep / 3) % DOCTOR_MODELS.length;
  const modelo = DOCTOR_MODELS[modelIndex];
  const { scene, animations } = useGLTF(modelo, true);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  // const [animacionActual, setAnimacionActual] = useState<string | null>(null);

  useEffect(() => {
    if (scene) {
      scene.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.frustumCulled = true;
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
    if (animations && animations.length > 0) {
      const mixer = new THREE.AnimationMixer(scene);
      mixerRef.current = mixer;
      const clipIndex = Math.min(currentStep, animations.length - 1);
      const clip = animations[clipIndex] || animations[0];
      if (clip) {
        const action = mixer.clipAction(clip);
        action.reset().play();
        // setAnimacionActual(clip.name);
      }
    }

    return () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
        mixerRef.current = null;
      }
    };
  }, [scene, animations, currentStep]);

  useFrame((state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
  });

  const position = DOCTOR_MODEL_POSITIONS[modelo] || [0, 0.5, 0];
  const scale = DOCTOR_MODEL_SCALES[modelo] || [1.1, 1.1, 1.1];

  return (
    <group>
      <primitive 
        object={scene} 
        position={position}
        rotation={[0, Math.PI / 14, 0]} 
        scale={scale}
      />
      
      {/* Mensaje del doctor */}
      <Html position={[2, 5.2, 0]} occlude>
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-xl border-2 border-blue-200 max-w-xs select-none">
          <div className="text-sm font-semibold text-gray-800 mb-2">
            Dr. AltaMedica AI
          </div>
          <div className="text-xs text-gray-600">
            {isAnalyzing 
              ? 'Analizando síntomas con IA neural...'
              : symptomsCount > 0 
              ? 'Información recibida. ¿Algo más que agregar?'
              : 'Hola, soy tu asistente médico. Describe tus síntomas.'}
          </div>
        </div>
      </Html>
      
      {/* Indicador de confianza */}
      <Html position={[0, 4.5, 0]} occlude>
        <div className={`text-white p-3 rounded-lg text-sm font-semibold select-none ${
          confidence > 80 ? 'bg-green-600/90' : 
          confidence > 60 ? 'bg-yellow-600/90' : 
          'bg-blue-600/90'
        }`}>
          {confidence > 0 ? `Confianza: ${confidence}%` : 'Sistema Neural Activo'}
        </div>
      </Html>
    </group>
  );
}

// Hook personalizado para reconocimiento de voz
const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as typeof window & { webkitSpeechRecognition: typeof SpeechRecognition }).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'es-ES';

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript + ' ';
          }
        }
        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        setError(`Error de reconocimiento: ${event.error}`);
        setIsListening(false);
      };
    }
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      setTranscript('');
      setError(null);
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  return { isListening, transcript, error, startListening, stopListening };
};

// Hook para acceso a cámara
const useCamera = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1280, height: 720 }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch {
      setError('No se pudo acceder a la cámara');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureImage = (): string | null => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        return canvas.toDataURL('image/jpeg');
      }
    }
    return null;
  };

  return { stream, error, videoRef, startCamera, stopCamera, captureImage };
};

// Hook para geolocalización
const useGeolocation = () => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getLocation = () => {
    setLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLoading(false);
        },
        (err) => {
          setError(err.message);
          setLoading(false);
        }
      );
    } else {
      setError('Geolocalización no disponible');
      setLoading(false);
    }
  };

  return { location, error, loading, getLocation };
};

// Componente principal
export default function AIDiagnosisPage() {
  // Estados principales
  const [symptoms, setSymptoms] = useState<SymptomEntry[]>([]);
  const [currentSymptom, setCurrentSymptom] = useState('');
  const [vitalSigns, setVitalSigns] = useState<VitalSigns | null>(null);
  const [visualAnalyses, setVisualAnalyses] = useState<VisualAnalysis[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  // const [showVitals, setShowVitals] = useState(false);
  // const [showMap, setShowMap] = useState(false);
  // const [selectedSpecialist, setSelectedSpecialist] = useState<SpecialistLocation | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Estados para restricciones de uso y analytics
  const [usageRestriction, setUsageRestriction] = useState<{
    can_use: boolean;
    next_available_date?: string;
    days_remaining?: number;
    total_diagnoses_count: number;
  } | null>(null);
  const [isSubmittingDiagnosis, setIsSubmittingDiagnosis] = useState(false);
  const [lastDiagnosisId, setLastDiagnosisId] = useState<string | null>(null);
  const [showUsageWarning, setShowUsageWarning] = useState(false);
  
  // Estado de demografía del paciente
  const [patientDemographics, setPatientDemographics] = useState({
    age: 35,
    gender: 'masculino' as 'masculino' | 'femenino' | 'otro',
    location_country: 'Mexico',
    location_state: '',
    location_city: '',
    occupation: ''
  });
  
  // Estados de sensores - comentado porque no se usa
  // const [sensors, setSensors] = useState<DeviceSensor[]>([
  //   { type: 'heartRate', available: false, unit: 'bpm' },
  //   { type: 'temperature', available: false, unit: '°C' },
  //   { type: 'oxygenSaturation', available: false, unit: '%' }
  // ]);

  // Hooks personalizados
  const { isListening, transcript, startListening, stopListening } = useSpeechRecognition();
  const { videoRef, startCamera, stopCamera, captureImage } = useCamera();
  const { location, getLocation } = useGeolocation();

  // ID único del usuario (simulado - en producción vendría de auth)
  // const userId = 'patient_' + Math.random().toString(36).substr(2, 9);

  // Verificar restricciones de uso al cargar la página
  useEffect(() => {
    checkUsageRestriction();
  }, []);

  const checkUsageRestriction = async () => {
    try {
      // Simular verificación de restricciones localmente
      const lastDiagnosisDate = localStorage.getItem('lastAIDiagnosisDate');
      const diagnosisCount = parseInt(localStorage.getItem('aiDiagnosisCount') || '0');
      
      let canUse = true;
      let daysRemaining = 0;
      let nextAvailableDate = undefined;
      
      if (lastDiagnosisDate) {
        const lastDate = new Date(lastDiagnosisDate);
        const daysSince = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        canUse = daysSince >= 10;
        
        if (!canUse) {
          daysRemaining = 10 - daysSince;
          nextAvailableDate = new Date(lastDate.getTime() + (10 * 24 * 60 * 60 * 1000)).toISOString();
        }
      }
      
      const restrictionData = {
        can_use: canUse,
        next_available_date: nextAvailableDate,
        days_remaining: daysRemaining,
        total_diagnoses_count: diagnosisCount
      };
      
      setUsageRestriction(restrictionData);
      
      if (!canUse) {
        setShowUsageWarning(true);
      }
    } catch (error) {
      // logger.error('Error verificando restricciones:', error);
      // Si hay error, permitir uso
      setUsageRestriction({
        can_use: true,
        total_diagnoses_count: 0
      });
    }
  };

  // Función para guardar diagnóstico localmente
  const submitDiagnosisToAnalytics = async (diagnosisData: DiagnosisResult) => {
    setIsSubmittingDiagnosis(true);
    
    try {
      // Simular guardado local de diagnóstico
      const diagnosisId = 'diag_' + Date.now().toString(36);
      
      // Guardar en localStorage
      const savedDiagnoses = JSON.parse(localStorage.getItem('aiDiagnoses') || '[]');
      const newDiagnosis = {
        id: diagnosisId,
        date: new Date().toISOString(),
        diagnosis: diagnosisData.diagnosis,
        confidence: diagnosisData.confidence,
        symptoms: symptoms.map(s => s.text),
        demographics: patientDemographics
      };
      
      savedDiagnoses.push(newDiagnosis);
      localStorage.setItem('aiDiagnoses', JSON.stringify(savedDiagnoses));
      
      // Actualizar fecha y contador
      localStorage.setItem('lastAIDiagnosisDate', new Date().toISOString());
      const currentCount = parseInt(localStorage.getItem('aiDiagnosisCount') || '0');
      localStorage.setItem('aiDiagnosisCount', String(currentCount + 1));
      
      setLastDiagnosisId(diagnosisId);
      
      // Actualizar restricciones de uso
      await checkUsageRestriction();
      
      // logger.info('✅ Diagnóstico guardado localmente:', diagnosisId);
      
    } catch {
      // logger.error('❌ Error guardando diagnóstico:', error);
    } finally {
      setIsSubmittingDiagnosis(false);
    }
  };

  // Funciones auxiliares para categorización
  // const categorizeSymphom = (symptomText: string): string => {
  //   const text = symptomText.toLowerCase();
  //   
  //   if (text.includes('dolor de cabeza') || text.includes('mareo') || text.includes('vértigo')) return 'neurologico';
  //   if (text.includes('tos') || text.includes('respirar') || text.includes('pecho')) return 'respiratorio';
  //   if (text.includes('corazón') || text.includes('presión') || text.includes('palpitaciones')) return 'cardiovascular';
  //   if (text.includes('estómago') || text.includes('náusea') || text.includes('diarrea')) return 'gastrointestinal';
  //   if (text.includes('fiebre') || text.includes('fatiga') || text.includes('cansancio')) return 'sintomas_generales';
  //   if (text.includes('dolor') && (text.includes('músculo') || text.includes('articulación'))) return 'musculoesqueletico';
  //   if (text.includes('piel') || text.includes('rash') || text.includes('picazón')) return 'dermatologico';
  //   
  //   return 'otro';
  // };

  // const categorizeDiagnosis = (diagnosis: string): string => {
  //   const text = diagnosis.toLowerCase();
  //   
  //   if (text.includes('infección') || text.includes('viral') || text.includes('bacteriana')) return 'infeccioso';
  //   if (text.includes('respiratoria') || text.includes('pulmonar') || text.includes('bronquitis')) return 'respiratorio';
  //   if (text.includes('cardiovascular') || text.includes('cardíaco') || text.includes('corazón')) return 'cardiovascular';
  //   if (text.includes('neurológico') || text.includes('neuronal') || text.includes('cerebral')) return 'nervioso';
  //   if (text.includes('digestivo') || text.includes('gástrico') || text.includes('intestinal')) return 'digestivo';
  //   if (text.includes('mental') || text.includes('psicológico') || text.includes('ansiedad')) return 'mental';
  //   if (text.includes('piel') || text.includes('dermatológico')) return 'piel';
  //   
  //   return 'sintomas_generales';
  // };

  // const parseDuration = (duration: string): number => {
  //   const text = duration.toLowerCase();
  //   if (text.includes('día') || text.includes('day')) {
  //     const match = text.match(/(\d+)/);
  //     return match ? parseInt(match[1]) : 1;
  //   }
  //   if (text.includes('semana') || text.includes('week')) {
  //     const match = text.match(/(\d+)/);
  //     return match ? parseInt(match[1]) * 7 : 7;
  //   }
  //   if (text.includes('mes') || text.includes('month')) {
  //     const match = text.match(/(\d+)/);
  //     return match ? parseInt(match[1]) * 30 : 30;
  //   }
  //   return 1; // default
  // };

  // Efecto para manejar transcripción de voz
  useEffect(() => {
    if (transcript && !isListening) {
      const newSymptom: SymptomEntry = {
        id: Date.now().toString(),
        text: transcript,
        intensity: 5,
        duration: 'reciente',
        bodyPart: 'general',
        timestamp: new Date(),
        source: 'voice',
        audioUrl: undefined
      };
      setSymptoms(prev => [...prev, newSymptom]);
      setCurrentStep(prev => prev + 1);
    }
  }, [transcript, isListening]);

  // Simular conexión con dispositivos IoT
  const connectToVitalSensors = async () => {
    setShowVitals(true);
    
    setTimeout(() => {
      setSensors([
        { type: 'heartRate', available: true, lastReading: 72, unit: 'bpm' },
        { type: 'temperature', available: true, lastReading: 36.6, unit: '°C' },
        { type: 'oxygenSaturation', available: true, lastReading: 98, unit: '%' }
      ]);
      
      setVitalSigns({
        heartRate: 72,
        temperature: 36.6,
        oxygenSaturation: 98,
        bloodPressure: '120/80',
        respiratoryRate: 16,
        timestamp: new Date()
      });
    }, 2000);
  };

  // Análisis visual con IA
  const analyzeVisualSymptom = async () => {
    const imageData = captureImage();
    if (!imageData) return;

    const mockAnalysis: VisualAnalysis = {
      id: Date.now().toString(),
      type: 'skin',
      confidence: 0.89,
      description: 'Eritema leve detectado en área capturada',
      severity: 'mild',
      imageUrl: imageData,
      annotations: [
        { x: 150, y: 200, label: 'Área afectada' }
      ]
    };

    setVisualAnalyses(prev => [...prev, mockAnalysis]);
    stopCamera();
    setShowCamera(false);
    setCurrentStep(prev => prev + 1);
  };

  // Motor de IA para diagnóstico
  const runAIDiagnosis = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    getLocation();

    const steps = [
      { progress: 20, delay: 500, message: 'Analizando síntomas...' },
      { progress: 40, delay: 800, message: 'Procesando datos vitales...' },
      { progress: 60, delay: 700, message: 'Evaluando imágenes...' },
      { progress: 80, delay: 900, message: 'Consultando base de conocimientos médicos...' },
      { progress: 100, delay: 600, message: 'Generando diagnóstico...' }
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, step.delay));
      setAnalysisProgress(step.progress);
    }

    // Generar diagnóstico simulado
    const mockDiagnosis: DiagnosisResult = {
      id: Date.now().toString(),
      diagnosis: 'Infección respiratoria superior con componente alérgico',
      confidence: 87,
      specialist: 'Otorrinolaringología',
      urgency: 'medium',
      recommendations: [
        'Antihistamínicos de segunda generación',
        'Lavados nasales con solución salina',
        'Evitar alérgenos conocidos',
        'Hidratación abundante',
        'Reposo relativo por 48-72 horas'
      ],
      estimatedTime: '5-7 días para recuperación completa',
      symptoms,
      vitalSigns: vitalSigns || undefined,
      visualAnalysis: visualAnalyses,
      probabilityScore: 0.87,
      differentialDiagnosis: [
        { condition: 'Rinitis alérgica', probability: 0.65 },
        { condition: 'Sinusitis aguda', probability: 0.22 },
        { condition: 'Resfriado común', probability: 0.13 }
      ],
      nextSteps: [
        'Agendar cita con especialista en 24-48h',
        'Monitorear temperatura cada 6 horas',
        'Consultar si síntomas empeoran'
      ],
      timestamp: new Date(),
      nearbySpecialists: generateNearbySpecialists(location)
    };

    setDiagnosis(mockDiagnosis);
    setIsAnalyzing(false);
    setShowMap(true);
    
    // Enviar diagnóstico al servidor de analytics médicos
    await submitDiagnosisToAnalytics(mockDiagnosis);
  };

  // Generar especialistas cercanos
  const generateNearbySpecialists = (userLocation: any): SpecialistLocation[] => {
    if (!userLocation) return [];

    return [
      {
        id: '1',
        name: 'Dr. Carlos Mendoza',
        specialty: 'Otorrinolaringología',
        distance: 1.2,
        lat: userLocation.lat + 0.01,
        lng: userLocation.lng + 0.01,
        availability: 'available',
        rating: 4.8,
        phone: '+1234567890',
        address: 'Clínica San Rafael, Piso 3',
        canVideoCall: true,
        nextAvailable: new Date(Date.now() + 3600000),
        estimatedWaitTime: 15
      },
      {
        id: '2',
        name: 'Dra. Ana García',
        specialty: 'Medicina General',
        distance: 0.8,
        lat: userLocation.lat - 0.008,
        lng: userLocation.lng + 0.005,
        availability: 'available',
        rating: 4.9,
        phone: '+0987654321',
        address: 'Centro Médico Plaza, Consultorio 205',
        canVideoCall: true,
        nextAvailable: new Date(Date.now() + 1800000),
        estimatedWaitTime: 5
      }
    ];
  };

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-black overflow-hidden">
      <div className="w-full h-full flex flex-row">
        
        {/* MITAD IZQUIERDA - MÉDICO 3D */}
        <div className="w-1/2 h-full flex flex-col items-center justify-center bg-black relative">
          {/* Header del médico */}
          <div className="absolute top-4 left-4 right-4 z-10">
            <div className="text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
                ALTAMEDICA AI GENESIS
              </h1>
              <p className="text-cyan-400 text-sm font-mono">
                Sistema de Diagnóstico Neural Avanzado
              </p>
            </div>
          </div>

          {/* Canvas 3D del médico */}
          <div className="w-full h-full flex-1 relative mt-16">
            <Canvas
              camera={{ position: [0, 1.1, 5.7], fov: 29 }} 
              shadows
              style={{ background: 'transparent' }}
              performance={{ min: 0.5 }}
            >
              <Suspense fallback={<Html center><div className="text-cyan-400">Cargando Dr. AltaMedica...</div></Html>}>
                <ambientLight intensity={0.6} color="#ffffff" />
                <directionalLight 
                  position={[5, 5, 5]} 
                  intensity={1}
                  color="#ffffff"
                />
                <pointLight position={[-5, 5, 5]} intensity={0.5} color="#88ccff" />
                <hemisphereLight 
                  intensity={0.3} 
                  groundColor="#404040" 
                  color="#ffffff" 
                />
                <Doctor3D 
                  currentStep={currentStep}
                  isAnalyzing={isAnalyzing}
                  confidence={diagnosis ? diagnosis.confidence : 0}
                  symptomsCount={symptoms.length}
                  onInteraction={() => {}}
                />
                <Environment 
                  preset="sunset" 
                  background={false}
                  resolution={256}
                />
                <OrbitControls 
                  enableZoom={false}
                  enablePan={false}
                  minPolarAngle={Math.PI / 3}
                  maxPolarAngle={Math.PI / 2}
                />
              </Suspense>
            </Canvas>
          </div>
        </div>

        {/* MITAD DERECHA - PANEL DE IA, DIAGNÓSTICO, PROBABILIDAD, ANAMNESIS */}
        <div className="w-1/2 h-full bg-slate-900/90 backdrop-blur-sm overflow-y-auto">
          <div className="p-6 space-y-6">
            
            {/* Alerta de restricción de uso */}
            {showUsageWarning && usageRestriction && !usageRestriction.can_use && (
              <div className="bg-red-500/20 backdrop-blur-sm rounded-2xl border border-red-400/50 p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-red-400 font-bold mb-2">Límite de Uso Alcanzado</h3>
                    <p className="text-red-300 text-sm mb-3">
                      Has alcanzado el límite de 1 diagnóstico cada 10 días. 
                      Próximo diagnóstico disponible en {usageRestriction.days_remaining} días.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowUsageWarning(false)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                      >
                        Entendido
                      </button>
                      <button
                        onClick={checkUsageRestriction}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
                      >
                        Verificar de nuevo
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Panel de estadísticas de uso */}
            {usageRestriction && (
              <div className="bg-black/40 backdrop-blur-sm rounded-2xl border border-gray-400/30 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-300 text-sm">
                      Sistema de Uso Responsable
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-400 text-xs">Diagnósticos realizados</div>
                    <div className="text-cyan-400 font-mono">{usageRestriction.total_diagnoses_count}</div>
                  </div>
                </div>
                {lastDiagnosisId && (
                  <div className="mt-2 text-xs text-green-400">
                    ✅ Último diagnóstico guardado: {lastDiagnosisId.substring(0, 8)}...
                  </div>
                )}
              </div>
            )}

            {/* Panel de demographics (expandible) */}
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl border border-purple-400/30 p-4">
              <details>
                <summary className="cursor-pointer text-purple-400 font-medium mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Información Demográfica (Opcional)
                </summary>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="text-gray-400 text-xs">Edad</label>
                    <input
                      type="number"
                      value={patientDemographics.age}
                      onChange={(e) => setPatientDemographics(prev => ({...prev, age: parseInt(e.target.value) || 35}))}
                      className="w-full p-2 bg-black/60 border border-purple-400/30 rounded text-white text-sm"
                      min="0"
                      max="120"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs">Género</label>
                    <select
                      value={patientDemographics.gender}
                      onChange={(e) => setPatientDemographics(prev => ({...prev, gender: e.target.value as any}))}
                      className="w-full p-2 bg-black/60 border border-purple-400/30 rounded text-white text-sm"
                    >
                      <option value="masculino">Masculino</option>
                      <option value="femenino">Femenino</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs">Estado</label>
                    <input
                      type="text"
                      value={patientDemographics.location_state}
                      onChange={(e) => setPatientDemographics(prev => ({...prev, location_state: e.target.value}))}
                      className="w-full p-2 bg-black/60 border border-purple-400/30 rounded text-white text-sm"
                      placeholder="ej. CDMX"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs">Ocupación</label>
                    <input
                      type="text"
                      value={patientDemographics.occupation}
                      onChange={(e) => setPatientDemographics(prev => ({...prev, occupation: e.target.value}))}
                      className="w-full p-2 bg-black/60 border border-purple-400/30 rounded text-white text-sm"
                      placeholder="ej. Estudiante"
                    />
                  </div>
                </div>
              </details>
            </div>

            {/* Panel de Input de Síntomas */}
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl border border-cyan-400/30 p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-cyan-400" />
                <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Interface Neural de Síntomas
                </span>
              </h2>
              
              <div className="space-y-4">
                {/* Input de texto */}
                <div className="relative">
                  <textarea
                    value={currentSymptom}
                    onChange={(e) => setCurrentSymptom(e.target.value)}
                    placeholder="Describe tus síntomas con detalle..."
                    className="w-full p-4 bg-black/60 border-2 border-cyan-400/30 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400/50 resize-none text-white placeholder-gray-400 h-32"
                    rows={4}
                  />
                  <button
                    onClick={() => {
                      if (currentSymptom.trim()) {
                        const newSymptom: SymptomEntry = {
                          id: Date.now().toString(),
                          text: currentSymptom,
                          intensity: 5,
                          duration: 'reciente',
                          bodyPart: 'general',
                          timestamp: new Date(),
                          source: 'text'
                        };
                        setSymptoms(prev => [...prev, newSymptom]);
                        setCurrentSymptom('');
                        setCurrentStep(prev => prev + 1);
                      }
                    }}
                    className="absolute bottom-3 right-3 p-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>

                {/* Controles neurales */}
                <div className="flex gap-3">
                  <button
                    onClick={isListening ? stopListening : startListening}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all border ${
                      isListening 
                        ? 'bg-red-500/20 text-red-400 border-red-400/50' 
                        : 'bg-cyan-500/20 text-cyan-400 border-cyan-400/30 hover:bg-cyan-500/30'
                    }`}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    <span className="text-sm">{isListening ? 'PARAR' : 'VOZ'}</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      if (showCamera) {
                        stopCamera();
                        setShowCamera(false);
                      } else {
                        startCamera();
                        setShowCamera(true);
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all border bg-purple-500/20 text-purple-400 border-purple-400/30 hover:bg-purple-500/30"
                  >
                    {showCamera ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                    <span className="text-sm">{showCamera ? 'CERRAR' : 'CÁMARA'}</span>
                  </button>
                  
                  <button
                    onClick={connectToVitalSensors}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all border bg-green-500/20 text-green-400 border-green-400/30 hover:bg-green-500/30"
                  >
                    <Activity className="w-4 h-4" />
                    <span className="text-sm">VITALES</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Vista de cámara */}
            {showCamera && (
              <div className="bg-black/40 backdrop-blur-sm rounded-2xl border border-purple-400/30 p-4">
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full rounded-lg"
                  />
                  <button
                    onClick={analyzeVisualSymptom}
                    className="absolute bottom-4 right-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                  >
                    <Scan className="w-4 h-4" />
                    Analizar
                  </button>
                </div>
              </div>
            )}

            {/* Panel de Anamnesis */}
            {symptoms.length > 0 && (
              <div className="bg-black/40 backdrop-blur-sm rounded-2xl border border-cyan-400/30 p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    Anamnesis Neural
                  </span>
                </h3>
                
                <div className="space-y-3">
                  {symptoms.map((symptom) => (
                    <div key={symptom.id} className="bg-black/60 p-3 rounded-lg border border-cyan-400/20">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {symptom.source === 'voice' && <Mic className="w-4 h-4 text-cyan-400" />}
                          {symptom.source === 'text' && <MessageSquare className="w-4 h-4 text-cyan-400" />}
                          {symptom.source === 'visual' && <Camera className="w-4 h-4 text-cyan-400" />}
                        </div>
                        <div className="flex-grow">
                          <p className="text-cyan-300 text-sm">{symptom.text}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-400">
                              {new Date(symptom.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setSymptoms(prev => prev.filter(s => s.id !== symptom.id))}
                          className="text-gray-400 hover:text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Signos vitales */}
            {vitalSigns && (
              <div className="bg-black/40 backdrop-blur-sm rounded-2xl border border-green-400/30 p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-400" />
                  <span className="text-green-400">Signos Vitales</span>
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/60 p-3 rounded border border-green-400/20">
                    <div className="text-xs text-gray-400">Pulso</div>
                    <div className="text-green-400 font-mono text-xl">{vitalSigns.heartRate} bpm</div>
                  </div>
                  <div className="bg-black/60 p-3 rounded border border-green-400/20">
                    <div className="text-xs text-gray-400">Temperatura</div>
                    <div className="text-green-400 font-mono text-xl">{vitalSigns.temperature}°C</div>
                  </div>
                  <div className="bg-black/60 p-3 rounded border border-green-400/20">
                    <div className="text-xs text-gray-400">SpO2</div>
                    <div className="text-green-400 font-mono text-xl">{vitalSigns.oxygenSaturation}%</div>
                  </div>
                  <div className="bg-black/60 p-3 rounded border border-green-400/20">
                    <div className="text-xs text-gray-400">Presión</div>
                    <div className="text-green-400 font-mono text-xl">{vitalSigns.bloodPressure}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Panel de Diagnóstico con Probabilidades */}
            {diagnosis && (
              <div className="bg-black/40 backdrop-blur-sm rounded-2xl border border-purple-400/30 p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Brain className="w-6 h-6 text-purple-400" />
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Diagnóstico IA Neural
                  </span>
                </h3>
                
                <div className="space-y-4">
                  {/* Diagnóstico principal */}
                  <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-4 rounded-xl border border-green-400/30">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-green-400 font-bold">{diagnosis.diagnosis}</h4>
                      <div className="text-2xl font-mono text-green-400">{diagnosis.confidence}%</div>
                    </div>
                    <div className="w-full bg-black/40 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-emerald-400 h-3 rounded-full transition-all duration-1000"
                        style={{width: `${diagnosis.confidence}%`}}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Diagnósticos diferenciales */}
                  <div className="space-y-2">
                    <h4 className="text-gray-300 font-medium">Diagnósticos Alternativos:</h4>
                    {diagnosis.differentialDiagnosis.map((dd, index) => (
                      <div key={index} className="bg-black/60 p-3 rounded-lg border border-blue-400/20">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-blue-400 text-sm">{dd.condition}</span>
                          <span className="text-blue-400 font-mono text-sm">{Math.round(dd.probability * 100)}%</span>
                        </div>
                        <div className="w-full bg-black/40 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-400 to-cyan-400 h-2 rounded-full transition-all duration-1000"
                            style={{width: `${dd.probability * 100}%`}}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Recomendaciones */}
                  <div>
                    <h4 className="text-purple-400 font-medium mb-2">Recomendaciones:</h4>
                    <div className="space-y-2">
                      {diagnosis.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start gap-2 text-purple-300 text-sm">
                          <ChevronRight className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Botón de Análisis IA */}
            <div className="relative">
              <button
                onClick={runAIDiagnosis}
                disabled={symptoms.length === 0 || isAnalyzing || isSubmittingDiagnosis || (usageRestriction && !usageRestriction.can_use)}
                className="w-full py-6 bg-gradient-to-r from-cyan-500 via-purple-500 to-blue-500 text-white font-bold text-xl rounded-xl hover:from-cyan-600 hover:via-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-500 flex items-center justify-center gap-4 border border-cyan-400/30 shadow-2xl"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                    <div className="flex flex-col items-start">
                      <span className="font-mono text-cyan-400">ANÁLISIS NEURAL ACTIVO</span>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-32 h-2 bg-black/40 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full transition-all duration-300"
                            style={{width: `${analysisProgress}%`}}
                          ></div>
                        </div>
                        <span className="text-sm font-mono text-gray-300">{analysisProgress}%</span>
                      </div>
                    </div>
                  </>
                ) : isSubmittingDiagnosis ? (
                  <>
                    <Download className="w-8 h-8 animate-bounce text-green-400" />
                    <span className="font-mono text-green-400">GUARDANDO DIAGNÓSTICO...</span>
                  </>
                ) : (
                  <>
                    <Brain className="w-8 h-8 text-cyan-400" />
                    <div className="flex flex-col items-center">
                      <span className="font-mono">INICIAR DIAGNÓSTICO NEURAL</span>
                      <span className="text-xs text-gray-300 font-normal">
                        + Guardar para análisis anónimo
                      </span>
                    </div>
                    <ArrowRight className="w-6 h-6 text-cyan-400" />
                  </>
                )}
              </button>
              
              {/* Info sobre restricciones */}
              {usageRestriction && !usageRestriction.can_use && (
                <div className="mt-2 text-center text-red-400 text-sm">
                  ⛔ Límite alcanzado. Próximo diagnóstico en {usageRestriction.days_remaining} días.
                </div>
              )}
            </div>

            {/* Panel de información del sistema */}
            <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 backdrop-blur-sm rounded-2xl border border-indigo-400/30 p-4">
              <h4 className="text-indigo-400 font-medium mb-2 flex items-center gap-2">
                <Star className="w-4 h-4" />
                Sistema de Análisis Poblacional
              </h4>
              <div className="text-xs text-gray-300 space-y-1">
                <div>• Los diagnósticos se almacenan de forma anónima</div>
                <div>• Contribuyes a estadísticas de salud poblacional</div>
                <div>• Límite de 1 diagnóstico cada 10 días</div>
                <div>• Datos categorizados por síntomas y demografía</div>
                <div>• Sistema compatible con estándares médicos</div>
              </div>
              {lastDiagnosisId && (
                <div className="mt-2 p-2 bg-green-500/20 rounded border border-green-400/30">
                  <div className="text-green-400 text-xs font-mono">
                    ✅ Diagnóstico guardado exitosamente
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}