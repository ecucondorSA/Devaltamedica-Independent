'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@altamedica/ui';
import { Button } from '@altamedica/ui';
import { Input } from '@altamedica/ui';
import { Textarea } from '@altamedica/ui';
import { Badge } from '@altamedica/ui';
import { logger } from '@altamedica/shared';
import { 
  Save,
  Send,
  Plus,
  Trash2,
  Pill,
  AlertTriangle
} from 'lucide-react';

// --- Interfaces de Datos ---
interface PatientData {
  id: string;
  name: string;
  age: number;
  gender: string;
  medicalHistory: string[];
}

interface Prescription {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  quantity: number;
}

interface PostConsultationFormData {
  patientId: string;
  sessionId: string;
  diagnosis: string;
  symptoms: string;
  physicalExam: string;
  treatmentPlan: string;
  prescriptions: Prescription[];
  followUpDate: string;
  followUpNotes: string;
  urgentAlerts: string[];
  labOrders: string[];
  imagingOrders: string[];
  referrals: string[];
  notes: string;
}

// --- Componente Principal ---
export default function PostConsultationForm() {
  const [formData, setFormData] = useState<PostConsultationFormData>({
    patientId: '',
    sessionId: '',
    diagnosis: '',
    symptoms: '',
    physicalExam: '',
    treatmentPlan: '',
    prescriptions: [],
    followUpDate: '',
    followUpNotes: '',
    urgentAlerts: [],
    labOrders: [],
    imagingOrders: [],
    referrals: [],
    notes: ''
  });

  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Simulación de carga de datos del paciente
  useEffect(() => {
    setPatientData({
      id: 'P001',
      name: 'Juan Pérez',
      age: 45,
      gender: 'Masculino',
      medicalHistory: ['Hipertensión', 'Diabetes tipo 2', 'Alergia a penicilina']
    });
  }, []);

  // --- Manejadores de Estado ---

  const addPrescription = () => {
    const newPrescription: Prescription = {
      id: Date.now().toString(),
      medication: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
      quantity: 1
    };
    setFormData(prev => ({
      ...prev,
      prescriptions: [...prev.prescriptions, newPrescription]
    }));
  };

  const updatePrescription = (id: string, field: keyof Prescription, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      prescriptions: prev.prescriptions.map(p =>
        p.id === id ? { ...p, [field]: value } : p
      )
    }));
  };

  const removePrescription = (id: string) => {
    setFormData(prev => ({
      ...prev,
      prescriptions: prev.prescriptions.filter(p => p.id !== id)
    }));
  };

  const createDynamicListUpdater = (field: keyof PostConsultationFormData) => {
    return {
      add: (item: string) => {
        if (item) {
          setFormData(prev => ({
            ...prev,
            [field]: [...(prev[field] as string[]), item]
          }));
        }
      },
      remove: (index: number) => {
        setFormData(prev => ({
          ...prev,
          [field]: (prev[field] as string[]).filter((_, i) => i !== index)
        }));
      }
    };
  };

  const urgentAlertsManager = createDynamicListUpdater('urgentAlerts');
  const labOrdersManager = createDynamicListUpdater('labOrders');
  const imagingOrdersManager = createDynamicListUpdater('imagingOrders');
  const referralsManager = createDynamicListUpdater('referrals');

  // --- Acciones de Formulario ---

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      logger.info('Datos guardados:', JSON.stringify(formData, null, 2));
      alert('Documentación guardada exitosamente');
    } catch (error) {
      logger.error('Error al guardar:', String(error));
      alert('Error al guardar la documentación');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      logger.info('Documentación enviada:', JSON.stringify(formData, null, 2));
      alert('Documentación enviada al paciente exitosamente');
    } catch (error) {
      logger.error('Error al enviar:', String(error));
      alert('Error al enviar la documentación');
    } finally {
      setLoading(false);
    }
  };

  if (!patientData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando datos del paciente...</p>
        </div>
      </div>
    );
  }

  // --- Renderizado ---
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Documentación Post-Consulta</h1>
          <p className="text-gray-600">Complete la documentación de la consulta médica</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={saving} variant="outline">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            <Send className="h-4 w-4 mr-2" />
            {loading ? 'Enviando...' : 'Enviar al Paciente'}
          </Button>
        </div>
      </header>

      {/* Información del Paciente */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Paciente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Nombre</label>
              <p className="font-medium">{patientData.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Edad</label>
              <p className="font-medium">{patientData.age} años</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Género</label>
              <p className="font-medium">{patientData.gender}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">ID Paciente</label>
              <p className="font-medium">{patientData.id}</p>
            </div>
          </div>
          <div className="mt-4">
            <label className="text-sm font-medium text-gray-700">Historial Médico</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {patientData.medicalHistory.map((condition, index) => (
                <Badge key={index} variant="secondary">{condition}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <main className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna Izquierda */}
        <div className="space-y-6">
          {/* Diagnóstico y Síntomas */}
          <Card>
            <CardHeader>
              <CardTitle>Diagnóstico y Síntomas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="diagnosis" className="text-sm font-medium text-gray-700">Diagnóstico Principal</label>
                <Input id="diagnosis" value={formData.diagnosis} onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))} placeholder="Ingrese el diagnóstico principal" />
              </div>
              <div>
                <label htmlFor="symptoms" className="text-sm font-medium text-gray-700">Síntomas Reportados</label>
                <Textarea id="symptoms" value={formData.symptoms} onChange={(e) => setFormData(prev => ({ ...prev, symptoms: e.target.value }))} placeholder="Describa los síntomas reportados" rows={3} />
              </div>
              <div>
                <label htmlFor="physicalExam" className="text-sm font-medium text-gray-700">Examen Físico</label>
                <Textarea id="physicalExam" value={formData.physicalExam} onChange={(e) => setFormData(prev => ({ ...prev, physicalExam: e.target.value }))} placeholder="Resultados del examen físico" rows={3} />
              </div>
            </CardContent>
          </Card>

          {/* Órdenes y Referencias */}
          <Card>
            <CardHeader>
              <CardTitle>Órdenes y Referencias</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DynamicListSection title="Órdenes de Laboratorio" items={formData.labOrders} manager={labOrdersManager} />
              <DynamicListSection title="Órdenes de Imagenología" items={formData.imagingOrders} manager={imagingOrdersManager} />
              <DynamicListSection title="Referencias" items={formData.referrals} manager={referralsManager} />
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha */}
        <div className="space-y-6">
          {/* Plan de Tratamiento */}
          <Card>
            <CardHeader>
              <CardTitle>Plan de Tratamiento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="treatmentPlan" className="text-sm font-medium text-gray-700">Plan de Tratamiento</label>
                <Textarea id="treatmentPlan" value={formData.treatmentPlan} onChange={(e) => setFormData(prev => ({ ...prev, treatmentPlan: e.target.value }))} placeholder="Describa el plan de tratamiento" rows={3} />
              </div>
              <div>
                <label htmlFor="followUpDate" className="text-sm font-medium text-gray-700">Fecha de Seguimiento</label>
                <Input id="followUpDate" type="date" value={formData.followUpDate} onChange={(e) => setFormData(prev => ({ ...prev, followUpDate: e.target.value }))} />
              </div>
              <div>
                <label htmlFor="followUpNotes" className="text-sm font-medium text-gray-700">Notas de Seguimiento</label>
                <Textarea id="followUpNotes" value={formData.followUpNotes} onChange={(e) => setFormData(prev => ({ ...prev, followUpNotes: e.target.value }))} placeholder="Notas para el seguimiento" rows={2} />
              </div>
            </CardContent>
          </Card>

          {/* Alertas Urgentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Alertas Urgentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DynamicListSection items={formData.urgentAlerts} manager={urgentAlertsManager} isUrgent />
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Prescripciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Prescripciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {formData.prescriptions.map((p) => (
              <PrescriptionItem key={p.id} prescription={p} onUpdate={updatePrescription} onRemove={removePrescription} />
            ))}
            <Button onClick={addPrescription} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Prescripción
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notas Adicionales */}
      <Card>
        <CardHeader>
          <CardTitle>Notas Adicionales</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} placeholder="Notas adicionales, observaciones importantes, etc." rows={4} />
        </CardContent>
      </Card>
    </div>
  );
}

// --- Sub-componentes ---

function PrescriptionItem({ prescription, onUpdate, onRemove }: { prescription: Prescription, onUpdate: Function, onRemove: Function }) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="col-span-2 md:col-span-3 lg:col-span-2">
          <label htmlFor={`med-${prescription.id}`} className="text-sm font-medium text-gray-700">Medicamento</label>
          <Input id={`med-${prescription.id}`} value={prescription.medication} onChange={(e) => onUpdate(prescription.id, 'medication', e.target.value)} placeholder="Nombre" />
        </div>
        <div>
          <label htmlFor={`dos-${prescription.id}`} className="text-sm font-medium text-gray-700">Dosis</label>
          <Input id={`dos-${prescription.id}`} value={prescription.dosage} onChange={(e) => onUpdate(prescription.id, 'dosage', e.target.value)} placeholder="500mg" />
        </div>
        <div>
          <label htmlFor={`freq-${prescription.id}`} className="text-sm font-medium text-gray-700">Frecuencia</label>
          <Input id={`freq-${prescription.id}`} value={prescription.frequency} onChange={(e) => onUpdate(prescription.id, 'frequency', e.target.value)} placeholder="Cada 8h" />
        </div>
        <div>
          <label htmlFor={`dur-${prescription.id}`} className="text-sm font-medium text-gray-700">Duración</label>
          <Input id={`dur-${prescription.id}`} value={prescription.duration} onChange={(e) => onUpdate(prescription.id, 'duration', e.target.value)} placeholder="7 días" />
        </div>
        <div className="flex items-end">
          <Button onClick={() => onRemove(prescription.id)} variant="destructive" size="icon">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div>
        <label htmlFor={`instr-${prescription.id}`} className="text-sm font-medium text-gray-700">Instrucciones</label>
        <Input id={`instr-${prescription.id}`} value={prescription.instructions} onChange={(e) => onUpdate(prescription.id, 'instructions', e.target.value)} placeholder="Instrucciones especiales" />
      </div>
    </div>
  );
}

function DynamicListSection({ title, items, manager, isUrgent = false }: { title?: string, items: string[], manager: { add: Function, remove: Function }, isUrgent?: boolean }) {
  const handleAdd = () => {
    const item = prompt(`Agregar ${title || (isUrgent ? 'Alerta' : 'Item')}:`);
    if (item) manager.add(item);
  };

  return (
    <div>
      {title && <h4 className="font-medium mb-2">{title}</h4>}
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className={`flex items-center gap-2 p-2 rounded ${isUrgent ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
            {isUrgent && <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />}
            <span className={`flex-1 text-sm ${isUrgent ? 'text-red-700' : ''}`}>{item}</span>
            <Button onClick={() => manager.remove(index)} variant="ghost" size="icon" className="h-6 w-6">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Button onClick={handleAdd} variant="outline" size="sm" className="w-full">
          <Plus className="h-3 w-3 mr-1" />
          Agregar
        </Button>
      </div>
    </div>
  );
}