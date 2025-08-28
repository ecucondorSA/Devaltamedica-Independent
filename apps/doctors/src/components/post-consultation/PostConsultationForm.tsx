'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@altamedica/ui';
import { Button } from '@altamedica/ui';
import { Input } from '@altamedica/ui';
import { Textarea } from '@altamedica/ui';

import { Badge } from '@altamedica/ui';
import { Separator } from '@altamedica/ui';
import { logger } from '@altamedica/shared/services/logger.service';
import { 
  FileText, 
  Pill, 
  Calendar, 
  AlertTriangle,
  Save,
  Send,
  Plus,
  Trash2
} from 'lucide-react';

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

  // Simular carga de datos del paciente
  useEffect(() => {
    setPatientData({
      id: 'P001',
      name: 'Juan Pérez',
      age: 45,
      gender: 'Masculino',
      medicalHistory: ['Hipertensión', 'Diabetes tipo 2', 'Alergia a penicilina']
    });
  }, []);

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
      prescriptions: prev.prescriptions.map(prescription =>
        prescription.id === id ? { ...prescription, [field]: value } : prescription
      )
    }));
  };

  const removePrescription = (id: string) => {
    setFormData(prev => ({
      ...prev,
      prescriptions: prev.prescriptions.filter(prescription => prescription.id !== id)
    }));
  };

  const addUrgentAlert = () => {
    const alert = prompt('Ingrese alerta urgente:');
    if (alert) {
      setFormData(prev => ({
        ...prev,
        urgentAlerts: [...prev.urgentAlerts, alert]
      }));
    }
  };

  const removeUrgentAlert = (index: number) => {
    setFormData(prev => ({
      ...prev,
      urgentAlerts: prev.urgentAlerts.filter((_, i) => i !== index)
    }));
  };

  const addLabOrder = () => {
    const order = prompt('Ingrese orden de laboratorio:');
    if (order) {
      setFormData(prev => ({
        ...prev,
        labOrders: [...prev.labOrders, order]
      }));
    }
  };

  const addImagingOrder = () => {
    const order = prompt('Ingrese orden de imagenología:');
    if (order) {
      setFormData(prev => ({
        ...prev,
        imagingOrders: [...prev.imagingOrders, order]
      }));
    }
  };

  const addReferral = () => {
    const referral = prompt('Ingrese referencia médica:');
    if (referral) {
      setFormData(prev => ({
        ...prev,
        referrals: [...prev.referrals, referral]
      }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 2000));
      logger.info('Datos guardados:', formData);
      alert('Documentación guardada exitosamente');
    } catch (error) {
      logger.error('Error al guardar:', error);
      alert('Error al guardar la documentación');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Simular envío
      await new Promise(resolve => setTimeout(resolve, 3000));
      logger.info('Documentación enviada:', formData);
      alert('Documentación enviada al paciente exitosamente');
    } catch (error) {
      logger.error('Error al enviar:', error);
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

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Documentación Post-Consulta</h1>
          <p className="text-gray-600">Complete la documentación de la consulta médica</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={handleSave}
            disabled={saving}
            variant="outline"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading}
          >
            <Send className="h-4 w-4 mr-2" />
            {loading ? 'Enviando...' : 'Enviar al Paciente'}
          </Button>
        </div>
      </div>

      {/* Información del Paciente */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Paciente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block">Nombre</div>
              <p className="font-medium">{patientData.name}</p>
            </div>
            <div>
              <div className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block">Edad</div>
              <p className="font-medium">{patientData.age} años</p>
            </div>
            <div>
              <div className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block">Género</div>
              <p className="font-medium">{patientData.gender}</p>
            </div>
            <div>
              <div className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block">ID Paciente</div>
              <p className="font-medium">{patientData.id}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block">Historial Médico</div>
            <div className="flex flex-wrap gap-2 mt-2">
              {patientData.medicalHistory.map((condition, index) => (
                <Badge key={index} variant="secondary">{condition}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Diagnóstico y Síntomas */}
        <Card>
          <CardHeader>
            <CardTitle>Diagnóstico y Síntomas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="diagnosis">Diagnóstico Principal</div>
              <Input
                id="diagnosis"
                value={formData.diagnosis}
                onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
                placeholder="Ingrese el diagnóstico principal"
              />
            </div>
            <div>
              <Label htmlFor="symptoms">Síntomas Reportados</div>
              <Textarea
                id="symptoms"
                value={formData.symptoms}
                onChange={(e) => setFormData(prev => ({ ...prev, symptoms: e.target.value }))}
                placeholder="Describa los síntomas reportados por el paciente"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="physicalExam">Examen Físico</div>
              <Textarea
                id="physicalExam"
                value={formData.physicalExam}
                onChange={(e) => setFormData(prev => ({ ...prev, physicalExam: e.target.value }))}
                placeholder="Resultados del examen físico"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Plan de Tratamiento */}
        <Card>
          <CardHeader>
            <CardTitle>Plan de Tratamiento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="treatmentPlan">Plan de Tratamiento</div>
              <Textarea
                id="treatmentPlan"
                value={formData.treatmentPlan}
                onChange={(e) => setFormData(prev => ({ ...prev, treatmentPlan: e.target.value }))}
                placeholder="Describa el plan de tratamiento"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="followUpDate">Fecha de Seguimiento</div>
              <Input
                id="followUpDate"
                type="date"
                value={formData.followUpDate}
                onChange={(e) => setFormData(prev => ({ ...prev, followUpDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="followUpNotes">Notas de Seguimiento</div>
              <Textarea
                id="followUpNotes"
                value={formData.followUpNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, followUpNotes: e.target.value }))}
                placeholder="Notas para el seguimiento"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      </div>

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
            {formData.prescriptions.map((prescription) => (
              <div key={prescription.id} className="border rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  <div>
                    <div className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block">Medicamento</div>
                    <Input
                      value={prescription.medication}
                      onChange={(e) => updatePrescription(prescription.id, 'medication', e.target.value)}
                      placeholder="Nombre del medicamento"
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block">Dosis</div>
                    <Input
                      value={prescription.dosage}
                      onChange={(e) => updatePrescription(prescription.id, 'dosage', e.target.value)}
                      placeholder="Ej: 500mg"
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block">Frecuencia</div>
                    <Input
                      value={prescription.frequency}
                      onChange={(e) => updatePrescription(prescription.id, 'frequency', e.target.value)}
                      placeholder="Ej: Cada 8 horas"
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block">Duración</div>
                    <Input
                      value={prescription.duration}
                      onChange={(e) => updatePrescription(prescription.id, 'duration', e.target.value)}
                      placeholder="Ej: 7 días"
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block">Cantidad</div>
                    <Input
                      type="number"
                      value={prescription.quantity}
                      onChange={(e) => updatePrescription(prescription.id, 'quantity', parseInt(e.target.value))}
                      min="1"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={() => removePrescription(prescription.id)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block">Instrucciones Especiales</div>
                  <Input
                    value={prescription.instructions}
                    onChange={(e) => updatePrescription(prescription.id, 'instructions', e.target.value)}
                    placeholder="Instrucciones especiales para el paciente"
                  />
                </div>
              </div>
            ))}
            <Button onClick={addPrescription} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Prescripción
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Órdenes y Referencias */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Órdenes de Laboratorio */}
        <Card>
          <CardHeader>
            <CardTitle>Órdenes de Laboratorio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {formData.labOrders.map((order, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <span className="flex-1 text-sm">{order}</span>
                  <Button
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      labOrders: prev.labOrders.filter((_, i) => i !== index)
                    }))}
                    variant="ghost"
                    size="sm"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Button onClick={addLabOrder} variant="outline" size="sm" className="w-full">
                <Plus className="h-3 w-3 mr-1" />
                Agregar Orden
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Órdenes de Imagenología */}
        <Card>
          <CardHeader>
            <CardTitle>Imagenología</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {formData.imagingOrders.map((order, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <span className="flex-1 text-sm">{order}</span>
                  <Button
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      imagingOrders: prev.imagingOrders.filter((_, i) => i !== index)
                    }))}
                    variant="ghost"
                    size="sm"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Button onClick={addImagingOrder} variant="outline" size="sm" className="w-full">
                <Plus className="h-3 w-3 mr-1" />
                Agregar Orden
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Referencias */}
        <Card>
          <CardHeader>
            <CardTitle>Referencias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {formData.referrals.map((referral, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <span className="flex-1 text-sm">{referral}</span>
                  <Button
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      referrals: prev.referrals.filter((_, i) => i !== index)
                    }))}
                    variant="ghost"
                    size="sm"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Button onClick={addReferral} variant="outline" size="sm" className="w-full">
                <Plus className="h-3 w-3 mr-1" />
                Agregar Referencia
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas Urgentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Alertas Urgentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {formData.urgentAlerts.map((alert, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="flex-1 text-red-700">{alert}</span>
                <Button
                  onClick={() => removeUrgentAlert(index)}
                  variant="ghost"
                  size="sm"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <Button onClick={addUrgentAlert} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Alerta Urgente
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
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Notas adicionales, observaciones importantes, etc."
            rows={4}
          />
        </CardContent>
      </Card>
    </div>
  );
} 