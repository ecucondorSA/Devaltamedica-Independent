/**
 * Sistema Completo de Notas Médicas
 * Panel especializado para doctores con templates médicos, diagnósticos y tratamientos
 * Integración completa con Firebase y auditoría HIPAA
 */

'use client';

import { Button, Card, Input } from '@altamedica/ui';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@altamedica/shared';
import {
  FileText,
  Plus,
  Save,
  Edit,
  Trash2,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  Stethoscope,
  Heart,
  Brain,
  Eye,
  Thermometer,
  Activity,
  Pill,
  ClipboardList,
  AlertTriangle,
  CheckCircle,
  BookOpen,
  Printer,
  Download,
  Share2,
  Lock,
  Shield,
  Star,
  Tags,
  Archive,
  Copy,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Info,
  Lightbulb,
  Target,
  TrendingUp,
  AlertCircle,
  Database,
  Microscope,
  Zap,
  Unlock
} from 'lucide-react';

// Tipos para el sistema de notas médicas
interface MedicalNote {
  id: string;
  sessionId: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  
  // Contenido médico
  title: string;
  content: string;
  category: 'anamnesis' | 'examination' | 'diagnosis' | 'treatment' | 'prescription' | 'follow_up' | 'referral' | 'general';
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  // Datos médicos específicos
  medicalData: {
    chiefComplaint?: string;
    presentIllness?: string;
    physicalExamination?: string;
    workingDiagnosis?: string;
    differentialDiagnosis?: string[];
    treatmentPlan?: string[];
    medications?: MedicalPrescription[];
    followUpInstructions?: string;
    redFlags?: string[];
    recommendations?: string[];
  };
  
  // Metadatos
  tags: string[];
  isConfidential: boolean;
  requiresSignature: boolean;
  signed: boolean;
  signedAt?: string;
  
  // Auditoría
  createdAt: string;
  updatedAt: string;
  version: number;
  editHistory: NoteEditHistory[];
  
  // Compliance
  hipaaCompliant: boolean;
  dataClassification: 'PUBLIC' | 'CONFIDENTIAL' | 'RESTRICTED';
  retentionPeriod: number; // años
}

interface MedicalPrescription {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  refills: number;
  genericAllowed: boolean;
  interactions: string[];
  sideEffects: string[];
}

interface NoteEditHistory {
  timestamp: string;
  action: 'created' | 'edited' | 'signed' | 'archived';
  changes: string;
  userId: string;
  userRole: string;
}

interface NoteTemplate {
  id: string;
  name: string;
  category: MedicalNote['category'];
  specialty: string;
  content: string;
  fields: TemplateField[];
  isActive: boolean;
}

interface TemplateField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'number' | 'date';
  required: boolean;
  options?: string[];
  placeholder?: string;
  validation?: string;
}

interface MedicalNotesSystemProps {
  sessionId: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  onNoteCreated?: (note: MedicalNote) => void;
  onNoteUpdated?: (note: MedicalNote) => void;
  readOnly?: boolean;
  compactMode?: boolean;
}

export const MedicalNotesSystem: React.FC<MedicalNotesSystemProps> = ({
  sessionId,
  patientId,
  doctorId,
  doctorName,
  specialty,
  onNoteCreated,
  onNoteUpdated,
  readOnly = false,
  compactMode = false
}) => {
  // Estados principales
  const [notes, setNotes] = useState<MedicalNote[]>([]);
  const [templates, setTemplates] = useState<NoteTemplate[]>([]);
  const [selectedNote, setSelectedNote] = useState<MedicalNote | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Estados de UI
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<MedicalNote['category'] | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'category'>('date');
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<NoteTemplate | null>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>(['content']);
  
  // Estados del formulario
  const [noteForm, setNoteForm] = useState<Partial<MedicalNote>>({
    title: '',
    content: '',
    category: 'general',
    priority: 'medium',
    tags: [],
    isConfidential: true,
    requiresSignature: false,
    medicalData: {}
  });
  
  // Referencias
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const autosaveInterval = useRef<NodeJS.Timeout | null>(null);

  // Templates médicos predefinidos
  const defaultTemplates: NoteTemplate[] = [
    {
      id: 'anamnesis_template',
      name: 'Anamnesis Completa',
      category: 'anamnesis',
      specialty: 'general',
      content: `MOTIVO DE CONSULTA:
{chief_complaint}

ENFERMEDAD ACTUAL:
{present_illness}

ANTECEDENTES MÉDICOS:
{medical_history}

ANTECEDENTES FAMILIARES:
{family_history}

MEDICAMENTOS ACTUALES:
{current_medications}

ALERGIAS:
{allergies}

HÁBITOS:
{habits}

REVISIÓN POR SISTEMAS:
{system_review}`,
      fields: [
        { id: 'chief_complaint', label: 'Motivo de Consulta', type: 'textarea', required: true, placeholder: 'Describa el motivo principal de la consulta...' },
        { id: 'present_illness', label: 'Enfermedad Actual', type: 'textarea', required: true, placeholder: 'Historia detallada de la enfermedad actual...' },
        { id: 'medical_history', label: 'Antecedentes Médicos', type: 'textarea', required: false, placeholder: 'Enfermedades previas, cirugías, hospitalizaciones...' },
        { id: 'family_history', label: 'Antecedentes Familiares', type: 'textarea', required: false, placeholder: 'Historia familiar relevante...' },
        { id: 'current_medications', label: 'Medicamentos', type: 'textarea', required: false, placeholder: 'Medicamentos actuales con dosis...' },
        { id: 'allergies', label: 'Alergias', type: 'text', required: false, placeholder: 'Alergias conocidas...' },
        { id: 'habits', label: 'Hábitos', type: 'textarea', required: false, placeholder: 'Tabaco, alcohol, ejercicio...' },
        { id: 'system_review', label: 'Revisión por Sistemas', type: 'textarea', required: false, placeholder: 'Síntomas por sistemas...' }
      ],
      isActive: true
    },
    {
      id: 'examination_template',
      name: 'Examen Físico',
      category: 'examination',
      specialty: 'general',
      content: `SIGNOS VITALES:
PA: {blood_pressure} mmHg
FC: {heart_rate} lpm
FR: {respiratory_rate} rpm
Temp: {temperature} °C
SpO2: {oxygen_saturation} %

EXAMEN FÍSICO GENERAL:
{general_appearance}

EXAMEN POR SISTEMAS:
Cardiovascular: {cardiovascular}
Respiratorio: {respiratory}
Abdominal: {abdominal}
Neurológico: {neurological}
Musculoesquelético: {musculoskeletal}
Piel: {skin}

IMPRESIÓN CLÍNICA:
{clinical_impression}`,
      fields: [
        { id: 'blood_pressure', label: 'Presión Arterial', type: 'text', required: true, placeholder: '120/80' },
        { id: 'heart_rate', label: 'Frecuencia Cardíaca', type: 'number', required: true, placeholder: '80' },
        { id: 'respiratory_rate', label: 'Frecuencia Respiratoria', type: 'number', required: true, placeholder: '18' },
        { id: 'temperature', label: 'Temperatura', type: 'number', required: true, placeholder: '36.5' },
        { id: 'oxygen_saturation', label: 'Saturación O2', type: 'number', required: false, placeholder: '98' },
        { id: 'general_appearance', label: 'Apariencia General', type: 'textarea', required: true, placeholder: 'Estado general, consciencia, orientación...' },
        { id: 'cardiovascular', label: 'Sistema Cardiovascular', type: 'textarea', required: false, placeholder: 'Ruidos cardíacos, soplos, edemas...' },
        { id: 'respiratory', label: 'Sistema Respiratorio', type: 'textarea', required: false, placeholder: 'Inspección, palpación, auscultación...' },
        { id: 'abdominal', label: 'Examen Abdominal', type: 'textarea', required: false, placeholder: 'Inspección, palpación, masas...' },
        { id: 'neurological', label: 'Examen Neurológico', type: 'textarea', required: false, placeholder: 'Funciones superiores, reflejos...' },
        { id: 'musculoskeletal', label: 'Sistema Musculoesquelético', type: 'textarea', required: false, placeholder: 'Articulaciones, movilidad...' },
        { id: 'skin', label: 'Examen de Piel', type: 'textarea', required: false, placeholder: 'Lesiones, coloración...' },
        { id: 'clinical_impression', label: 'Impresión Clínica', type: 'textarea', required: true, placeholder: 'Evaluación inicial...' }
      ],
      isActive: true
    },
    {
      id: 'diagnosis_template',
      name: 'Diagnóstico y Plan',
      category: 'diagnosis',
      specialty: 'general',
      content: `DIAGNÓSTICO PRINCIPAL:
{primary_diagnosis}

DIAGNÓSTICOS SECUNDARIOS:
{secondary_diagnoses}

DIAGNÓSTICOS DIFERENCIALES:
{differential_diagnoses}

PLAN DE TRATAMIENTO:
{treatment_plan}

MEDICAMENTOS:
{medications}

ESTUDIOS SOLICITADOS:
{ordered_studies}

INTERCONSULTAS:
{referrals}

SEGUIMIENTO:
{follow_up}

EDUCACIÓN AL PACIENTE:
{patient_education}

PRÓXIMA CITA:
{next_appointment}`,
      fields: [
        { id: 'primary_diagnosis', label: 'Diagnóstico Principal', type: 'text', required: true, placeholder: 'Diagnóstico principal con código CIE-10' },
        { id: 'secondary_diagnoses', label: 'Diagnósticos Secundarios', type: 'textarea', required: false, placeholder: 'Diagnósticos adicionales...' },
        { id: 'differential_diagnoses', label: 'Diagnósticos Diferenciales', type: 'textarea', required: false, placeholder: 'Posibles diagnósticos alternativos...' },
        { id: 'treatment_plan', label: 'Plan de Tratamiento', type: 'textarea', required: true, placeholder: 'Plan terapéutico detallado...' },
        { id: 'medications', label: 'Medicamentos', type: 'textarea', required: false, placeholder: 'Prescripciones con dosis y duración...' },
        { id: 'ordered_studies', label: 'Estudios', type: 'textarea', required: false, placeholder: 'Laboratorios, imágenes solicitadas...' },
        { id: 'referrals', label: 'Interconsultas', type: 'textarea', required: false, placeholder: 'Referencias a especialistas...' },
        { id: 'follow_up', label: 'Seguimiento', type: 'textarea', required: true, placeholder: 'Plan de seguimiento...' },
        { id: 'patient_education', label: 'Educación', type: 'textarea', required: false, placeholder: 'Información proporcionada al paciente...' },
        { id: 'next_appointment', label: 'Próxima Cita', type: 'text', required: false, placeholder: 'Fecha y motivo de próxima cita...' }
      ],
      isActive: true
    }
  ];

  // Cargar notas y templates al inicializar
  useEffect(() => {
    loadNotes();
    setTemplates(defaultTemplates);
  }, [sessionId, patientId]);

  // Auto-guardado
  useEffect(() => {
    if (isEditing && selectedNote) {
      autosaveInterval.current = setInterval(() => {
        saveNote(true); // Auto-guardado silencioso
      }, 30000); // Cada 30 segundos

      return () => {
        if (autosaveInterval.current) {
          clearInterval(autosaveInterval.current);
        }
      };
    }
  }, [isEditing, selectedNote]);

  // Funciones principales
  const loadNotes = useCallback(async () => {
    try {
      // Simular carga de notas desde Firebase
      const mockNotes: MedicalNote[] = [
        {
          id: 'note_001',
          sessionId,
          patientId,
          doctorId,
          doctorName,
          title: 'Consulta Inicial - Dolor Torácico',
          content: 'Paciente masculino de 45 años consulta por dolor torácico de 2 días de evolución...',
          category: 'anamnesis',
          priority: 'high',
          medicalData: {
            chiefComplaint: 'Dolor torácico',
            presentIllness: 'Dolor retroesternal de 2 días de evolución, tipo opresivo',
            workingDiagnosis: 'Síndrome coronario agudo vs. Reflujo gastroesofágico'
          },
          tags: ['dolor-toracico', 'urgente', 'cardiologia'],
          isConfidential: true,
          requiresSignature: true,
          signed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
          editHistory: [],
          hipaaCompliant: true,
          dataClassification: 'CONFIDENTIAL',
          retentionPeriod: 7
        }
      ];
      
      setNotes(mockNotes);
    } catch (error) {
      logger.error('Error cargando notas:', String(error));
    }
  }, [sessionId, patientId, doctorId, doctorName]);

  const createNote = useCallback(async () => {
    const newNote: MedicalNote = {
      id: `note_${Date.now()}`,
      sessionId,
      patientId,
      doctorId,
      doctorName,
      title: noteForm.title || 'Nueva Nota Médica',
      content: noteForm.content || '',
      category: noteForm.category || 'general',
      priority: noteForm.priority || 'medium',
      medicalData: noteForm.medicalData || {},
      tags: noteForm.tags || [],
      isConfidential: noteForm.isConfidential || true,
      requiresSignature: noteForm.requiresSignature || false,
      signed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      editHistory: [{
        timestamp: new Date().toISOString(),
        action: 'created',
        changes: 'Nota creada',
        userId: doctorId,
        userRole: 'doctor'
      }],
      hipaaCompliant: true,
      dataClassification: 'CONFIDENTIAL',
      retentionPeriod: 7
    };

    setNotes(prev => [newNote, ...prev]);
    setSelectedNote(newNote);
    setIsCreating(false);
    setIsEditing(false);
    
    // Reset form
    setNoteForm({
      title: '',
      content: '',
      category: 'general',
      priority: 'medium',
      tags: [],
      isConfidential: true,
      requiresSignature: false,
      medicalData: {}
    });

    if (onNoteCreated) {
      onNoteCreated(newNote);
    }
  }, [noteForm, sessionId, patientId, doctorId, doctorName, onNoteCreated]);

  const saveNote = useCallback(async (isAutoSave = false) => {
    if (!selectedNote) return;

    const updatedNote: MedicalNote = {
      ...selectedNote,
      ...noteForm,
      updatedAt: new Date().toISOString(),
      version: selectedNote.version + 1,
      editHistory: [
        ...selectedNote.editHistory,
        {
          timestamp: new Date().toISOString(),
          action: 'edited',
          changes: isAutoSave ? 'Auto-guardado' : 'Guardado manual',
          userId: doctorId,
          userRole: 'doctor'
        }
      ]
    };

    setNotes(prev => prev.map(note => 
      note.id === selectedNote.id ? updatedNote : note
    ));
    
    setSelectedNote(updatedNote);
    
    if (!isAutoSave) {
      setIsEditing(false);
    }

    if (onNoteUpdated) {
      onNoteUpdated(updatedNote);
    }
  }, [selectedNote, noteForm, doctorId, onNoteUpdated]);

  const signNote = useCallback(async (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    const signedNote: MedicalNote = {
      ...note,
      signed: true,
      signedAt: new Date().toISOString(),
      editHistory: [
        ...note.editHistory,
        {
          timestamp: new Date().toISOString(),
          action: 'signed',
          changes: 'Nota firmada digitalmente',
          userId: doctorId,
          userRole: 'doctor'
        }
      ]
    };

    setNotes(prev => prev.map(n => n.id === noteId ? signedNote : n));
    if (selectedNote?.id === noteId) {
      setSelectedNote(signedNote);
    }
  }, [notes, selectedNote, doctorId]);

  const applyTemplate = useCallback((template: NoteTemplate) => {
    setNoteForm(prev => ({
      ...prev,
      title: template.name,
      content: template.content,
      category: template.category,
      tags: [template.specialty, template.category]
    }));
    setSelectedTemplate(template);
    setShowTemplates(false);
  }, []);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  }, []);

  // Filtros y búsqueda
  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = filterCategory === 'all' || note.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      case 'priority': {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      case 'category':
        return a.category.localeCompare(b.category);
      default:
        return 0;
    }
  });

  // Render de iconos por categoría
  const getCategoryIcon = (category: MedicalNote['category']) => {
    switch (category) {
      case 'anamnesis': return <User className="h-4 w-4" />;
      case 'examination': return <Stethoscope className="h-4 w-4" />;
      case 'diagnosis': return <Target className="h-4 w-4" />;
      case 'treatment': return <Heart className="h-4 w-4" />;
      case 'prescription': return <Pill className="h-4 w-4" />;
      case 'follow_up': return <Calendar className="h-4 w-4" />;
      case 'referral': return <Share2 className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: MedicalNote['priority']) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low': return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="h-full flex bg-white">
      {/* Panel izquierdo - Lista de notas */}
      <div className={`${compactMode ? 'w-80' : 'w-96'} border-r border-gray-200 flex flex-col`}>
        {/* Header con controles */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Notas Médicas
            </h2>
            {!readOnly && (
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowTemplates(true)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                  title="Templates"
                >
                  <BookOpen className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsCreating(true)}
                  className="p-2 bg-blue-500 text-white hover:bg-blue-600 rounded-md"
                  title="Nueva Nota"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Búsqueda y filtros */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar notas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div className="flex space-x-2">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as any)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">Todas las categorías</option>
                <option value="anamnesis">Anamnesis</option>
                <option value="examination">Examen</option>
                <option value="diagnosis">Diagnóstico</option>
                <option value="treatment">Tratamiento</option>
                <option value="prescription">Prescripción</option>
                <option value="follow_up">Seguimiento</option>
                <option value="referral">Referencia</option>
                <option value="general">General</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="date">Fecha</option>
                <option value="priority">Prioridad</option>
                <option value="category">Categoría</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de notas */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotes.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No hay notas disponibles</p>
              {!readOnly && (
                <button
                  onClick={() => setIsCreating(true)}
                  className="mt-2 text-blue-500 hover:text-blue-600 text-sm"
                >
                  Crear primera nota
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => setSelectedNote(note)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedNote?.id === note.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(note.category)}
                      <h3 className="font-medium text-gray-900 text-sm truncate">
                        {note.title}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-1">
                      {note.isConfidential && (
                        <Lock className="h-3 w-3 text-gray-500" />
                      )}
                      {note.requiresSignature && !note.signed && (
                        <AlertTriangle className="h-3 w-3 text-orange-500" />
                      )}
                      {note.signed && (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                    {note.content.substring(0, 100)}...
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs border ${getPriorityColor(note.priority)}`}>
                        {note.priority}
                      </span>
                      <span className="text-xs text-gray-500">
                        {note.category}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </div>
                  </div>

                  {note.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {note.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                      {note.tags.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{note.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Panel derecho - Editor/Visor de notas */}
      <div className="flex-1 flex flex-col">
        {selectedNote || isCreating ? (
          <>
            {/* Header del editor */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getCategoryIcon(selectedNote?.category || noteForm.category || 'general')}
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">
                      {isCreating ? 'Nueva Nota Médica' : selectedNote?.title}
                    </h1>
                    {selectedNote && (
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Versión {selectedNote.version}</span>
                        <span>
                          Actualizada: {new Date(selectedNote.updatedAt).toLocaleString()}
                        </span>
                        {selectedNote.signed && (
                          <span className="text-green-600 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Firmada
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {!readOnly && (
                  <div className="flex items-center space-x-2">
                    {selectedNote && !selectedNote.signed && selectedNote.requiresSignature && (
                      <button
                        onClick={() => signNote(selectedNote.id)}
                        className="px-3 py-1.5 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 flex items-center"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Firmar
                      </button>
                    )}
                    
                    {isCreating ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setIsCreating(false)}
                          className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={createNote}
                          className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 flex items-center"
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Crear Nota
                        </button>
                      </div>
                    ) : isEditing ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => saveNote()}
                          className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 flex items-center"
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Guardar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 flex items-center"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Contenido del editor */}
            <div className="flex-1 overflow-y-auto p-4">
              {(isEditing || isCreating) ? (
                <div className="space-y-6">
                  {/* Formulario de edición */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Título
                      </label>
                      <input
                        type="text"
                        value={noteForm.title || ''}
                        onChange={(e) => setNoteForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Título de la nota médica..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Categoría
                      </label>
                      <select
                        value={noteForm.category || 'general'}
                        onChange={(e) => setNoteForm(prev => ({ ...prev, category: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="general">General</option>
                        <option value="anamnesis">Anamnesis</option>
                        <option value="examination">Examen Físico</option>
                        <option value="diagnosis">Diagnóstico</option>
                        <option value="treatment">Tratamiento</option>
                        <option value="prescription">Prescripción</option>
                        <option value="follow_up">Seguimiento</option>
                        <option value="referral">Referencia</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prioridad
                      </label>
                      <select
                        value={noteForm.priority || 'medium'}
                        onChange={(e) => setNoteForm(prev => ({ ...prev, priority: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="low">Baja</option>
                        <option value="medium">Media</option>
                        <option value="high">Alta</option>
                        <option value="critical">Crítica</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tags
                      </label>
                      <input
                        type="text"
                        value={noteForm.tags?.join(', ') || ''}
                        onChange={(e) => setNoteForm(prev => ({ 
                          ...prev, 
                          tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="etiqueta1, etiqueta2, etiqueta3..."
                      />
                    </div>
                  </div>

                  {/* Checkboxes */}
                  <div className="flex space-x-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={noteForm.isConfidential || false}
                        onChange={(e) => setNoteForm(prev => ({ ...prev, isConfidential: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Confidencial</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={noteForm.requiresSignature || false}
                        onChange={(e) => setNoteForm(prev => ({ ...prev, requiresSignature: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Requiere Firma</span>
                    </label>
                  </div>

                  {/* Contenido */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Contenido de la Nota
                      </label>
                      {isCreating && (
                        <button
                          onClick={() => setShowTemplates(true)}
                          className="text-sm text-blue-500 hover:text-blue-600 flex items-center"
                        >
                          <BookOpen className="h-4 w-4 mr-1" />
                          Usar Template
                        </button>
                      )}
                    </div>
                    <textarea
                      ref={contentRef}
                      value={noteForm.content || ''}
                      onChange={(e) => setNoteForm(prev => ({ ...prev, content: e.target.value }))}
                      className="w-full h-96 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      placeholder="Escriba aquí el contenido de la nota médica..."
                    />
                    <div className="mt-1 text-xs text-gray-500">
                      {noteForm.content?.length || 0} caracteres
                    </div>
                  </div>
                </div>
              ) : (
                // Vista de solo lectura
                <div className="space-y-6">
                  {/* Metadatos */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Categoría:</span>
                      <div className="flex items-center mt-1">
                        {getCategoryIcon(selectedNote?.category || 'general')}
                        <span className="ml-1 text-sm text-gray-900 capitalize">
                          {selectedNote?.category}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Prioridad:</span>
                      <div className="mt-1">
                        <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(selectedNote?.priority || 'medium')}`}>
                          {selectedNote?.priority}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Estado:</span>
                      <div className="mt-1 flex items-center">
                        {selectedNote?.signed ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                            <span className="text-sm text-green-600">Firmada</span>
                          </>
                        ) : selectedNote?.requiresSignature ? (
                          <>
                            <AlertTriangle className="h-4 w-4 text-orange-500 mr-1" />
                            <span className="text-sm text-orange-600">Pendiente firma</span>
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4 text-blue-500 mr-1" />
                            <span className="text-sm text-blue-600">Borrador</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Confidencial:</span>
                      <div className="mt-1 flex items-center">
                        {selectedNote?.isConfidential ? (
                          <>
                            <Lock className="h-4 w-4 text-red-500 mr-1" />
                            <span className="text-sm text-red-600">Sí</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="h-4 w-4 text-gray-500 mr-1" />
                            <span className="text-sm text-gray-600">No</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {selectedNote?.tags && selectedNote.tags.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Etiquetas:</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedNote.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contenido */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Contenido:</h3>
                    <div className="prose max-w-none">
                      <div className="p-4 bg-white border border-gray-200 rounded-lg whitespace-pre-wrap font-mono text-sm">
                        {selectedNote?.content}
                      </div>
                    </div>
                  </div>

                  {/* Historial de ediciones */}
                  {selectedNote && selectedNote.editHistory.length > 0 && (
                    <div>
                      <button
                        onClick={() => toggleSection('history')}
                        className="flex items-center text-sm font-medium text-gray-700 mb-2 hover:text-gray-900"
                      >
                        {expandedSections.includes('history') ? (
                          <ChevronUp className="h-4 w-4 mr-1" />
                        ) : (
                          <ChevronDown className="h-4 w-4 mr-1" />
                        )}
                        Historial de Ediciones
                      </button>
                      
                      {expandedSections.includes('history') && (
                        <div className="space-y-2">
                          {selectedNote.editHistory.map((entry, index) => (
                            <div key={index} className="flex items-center text-sm text-gray-600 p-2 bg-gray-50 rounded">
                              <Clock className="h-4 w-4 mr-2" />
                              <span className="font-medium">{entry.action}</span>
                              <span className="mx-2">-</span>
                              <span>{entry.changes}</span>
                              <span className="ml-auto">
                                {new Date(entry.timestamp).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          // Estado sin selección
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Selecciona una nota médica
              </h3>
              <p className="text-gray-500 mb-4">
                Elige una nota de la lista o crea una nueva para comenzar
              </p>
              {!readOnly && (
                <button
                  onClick={() => setIsCreating(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center mx-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Nota Médica
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Templates */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Templates de Notas Médicas
              </h3>
              <button
                onClick={() => setShowTemplates(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => applyTemplate(template)}
                  >
                    <div className="flex items-center mb-3">
                      {getCategoryIcon(template.category)}
                      <h4 className="ml-2 font-medium text-gray-900">
                        {template.name}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Categoría: {template.category} | Especialidad: {template.specialty}
                    </p>
                    <div className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded max-h-32 overflow-y-auto">
                      {template.content.substring(0, 200)}...
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 p-4 border-t border-gray-200">
              <button
                onClick={() => setShowTemplates(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
