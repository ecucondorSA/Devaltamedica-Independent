'use client';

import useAuth from '@altamedica/auth';
import {
  CreatePrescription,
  CreatePrescriptionSchema,
  DrugRoute,
  Medication,
} from '@altamedica/types';
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@altamedica/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle, FileText, Loader2, Pill, Plus, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { logger } from '@altamedica/shared';
/**
 * Prescription Form Component
 * Allows doctors to create digital prescriptions
 * Compliant with Argentina digital prescription requirements
 */

interface PrescriptionFormProps {
  patientId: string;
  patientName: string;
  patientDni?: string;
  patientAge?: number;
  onSuccess?: (prescription: any) => void;
  onCancel?: () => void;
}

export function PrescriptionForm({
  patientId,
  patientName,
  patientDni,
  patientAge,
  onSuccess,
  onCancel,
}: PrescriptionFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [searchingMedications, setSearchingMedications] = useState(false);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<CreatePrescription>({
    resolver: zodResolver(CreatePrescriptionSchema),
    defaultValues: {
      patientId,
      patientName,
      patientDni,
      patientAge,
      doctorLicense: (user as any)?.licenseNumber || '',
      doctorSpecialty: (user as any)?.specialty || '',
      route: 'oral',
      refills: 0,
      issuedAt: new Date() as any,
    },
  });

  const drugSearch = watch('drug');

  // Search medications when drug name changes
  useEffect(() => {
    const searchMedications = async () => {
      if (!drugSearch || drugSearch.length < 2) {
        setMedications([]);
        return;
      }

      setSearchingMedications(true);
      try {
        const response = await fetch(
          `/api/v1/medications?query=${encodeURIComponent(drugSearch)}&limit=5`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          },
        );

        if (response.ok) {
          const data = await response.json();
          setMedications(data.data.medications || []);
        }
      } catch (error) {
        logger.error('Error searching medications:', String(error));
      } finally {
        setSearchingMedications(false);
      }
    };

    const debounce = setTimeout(searchMedications, 300);
    return () => clearTimeout(debounce);
  }, [drugSearch]);

  // Handle medication selection
  const selectMedication = (medication: Medication) => {
    setSelectedMedication(medication);
    setValue('drug', medication.genericName);
    setValue('medicationId', medication.id);
    setValue('dosage', medication.strength);
    setMedications([]);
  };

  // Submit prescription
  const onSubmit = async (data: CreatePrescription) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const response = await fetch('/api/v1/prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmitSuccess(true);
        reset();
        if (onSuccess) {
          onSuccess(result.data);
        }
      } else {
        setSubmitError(result.error || 'Error al crear la prescripción');
      }
    } catch (error) {
      logger.error('Error submitting prescription:', String(error));
      setSubmitError('Error de conexión. Por favor, intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const drugRoutes: DrugRoute[] = [
    'oral',
    'sublingual',
    'topical',
    'inhalation',
    'intramuscular',
    'intravenous',
    'subcutaneous',
    'nasal',
    'ophthalmic',
    'otic',
  ];

  const frequencyOptions = [
    'Una vez al día',
    'Dos veces al día',
    'Tres veces al día',
    'Cuatro veces al día',
    'Cada 4 horas',
    'Cada 6 horas',
    'Cada 8 horas',
    'Cada 12 horas',
    'Según necesidad',
    'Antes de las comidas',
    'Después de las comidas',
    'Al acostarse',
  ];

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Nueva Prescripción Médica
        </CardTitle>
        <CardDescription>
          Complete el formulario para emitir una prescripción digital
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Patient Information */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Información del Paciente
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Paciente</Label>
                <Input value={patientName} disabled className="bg-white" />
              </div>
              {patientDni && (
                <div>
                  <Label>DNI</Label>
                  <Input value={patientDni} disabled className="bg-white" />
                </div>
              )}
            </div>
          </div>

          {/* Medication Search */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Pill className="h-4 w-4" />
              Medicamento
            </h3>

            <div className="relative">
              <Label htmlFor="drug">Nombre del medicamento *</Label>
              <div className="relative">
                <Input
                  id="drug"
                  {...register('drug')}
                  placeholder="Buscar medicamento..."
                  className={errors.drug ? 'border-red-500' : ''}
                />
                {searchingMedications && (
                  <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin" />
                )}
              </div>
              {errors.drug && <p className="text-sm text-red-500 mt-1">{errors.drug.message}</p>}

              {/* Medication suggestions */}
              {medications.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
                  {medications.map((med) => (
                    <button
                      key={med.id}
                      type="button"
                      onClick={() => selectMedication(med)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b last:border-b-0"
                    >
                      <div className="font-medium">{med.genericName}</div>
                      <div className="text-sm text-gray-600">
                        {(med as any).brandName} - {med.strength} - {med.dosageForm}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected medication details */}
            {selectedMedication && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{selectedMedication.genericName}</strong> ({(selectedMedication as any).brandName})
                  -{selectedMedication.strength} - {selectedMedication.manufacturer}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dosage">Dosis *</Label>
                <Input
                  id="dosage"
                  {...register('dosage')}
                  placeholder="Ej: 500mg"
                  className={errors.dosage ? 'border-red-500' : ''}
                />
                {errors.dosage && (
                  <p className="text-sm text-red-500 mt-1">{errors.dosage.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="route">Vía de administración *</Label>
                <Select
                  value={watch('route')}
                  onValueChange={(value) => setValue('route', value as any)}
                >
                  <SelectTrigger className={errors.route ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Seleccionar vía" />
                  </SelectTrigger>
                  <SelectContent>
                    {drugRoutes.map((route) => (
                      <SelectItem key={route} value={route}>
                        {route.charAt(0).toUpperCase() + route.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.route && (
                  <p className="text-sm text-red-500 mt-1">{errors.route.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="frequency">Frecuencia *</Label>
                <Select
                  value={watch('frequency')}
                  onValueChange={(value) => setValue('frequency', value)}
                >
                  <SelectTrigger className={errors.frequency ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Seleccionar frecuencia" />
                  </SelectTrigger>
                  <SelectContent>
                    {frequencyOptions.map((freq) => (
                      <SelectItem key={freq} value={freq}>
                        {freq}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.frequency && (
                  <p className="text-sm text-red-500 mt-1">{errors.frequency.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="duration">Duración del tratamiento</Label>
                <Input id="duration" {...register('duration')} placeholder="Ej: 7 días" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Cantidad a dispensar *</Label>
                <Input
                  id="quantity"
                  type="number"
                  {...register('quantity', { valueAsNumber: true })}
                  placeholder="Ej: 30"
                  className={errors.quantity ? 'border-red-500' : ''}
                />
                {errors.quantity && (
                  <p className="text-sm text-red-500 mt-1">{errors.quantity.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="refills">Repeticiones permitidas</Label>
                <Input
                  id="refills"
                  type="number"
                  {...register('refills', { valueAsNumber: true })}
                  placeholder="0"
                  min="0"
                  max="5"
                />
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-4">
            <h3 className="font-medium">Instrucciones</h3>

            <div>
              <Label htmlFor="patientInstructions">Instrucciones para el paciente</Label>
              <Textarea
                id="patientInstructions"
                {...register('patientInstructions')}
                placeholder="Instrucciones específicas para el paciente..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="pharmacyNotes">Notas para la farmacia</Label>
              <Textarea
                id="pharmacyNotes"
                {...register('pharmacyNotes')}
                placeholder="Notas o instrucciones para el farmacéutico..."
                rows={2}
              />
            </div>
          </div>

          {/* Clinical Information */}
          <div className="space-y-4">
            <h3 className="font-medium">Información Clínica</h3>

            <div>
              <Label htmlFor="diagnosis">Diagnóstico</Label>
              <Input
                id="diagnosis"
                {...register('diagnosis')}
                placeholder="Diagnóstico o condición..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="icd10Code">Código CIE-10</Label>
                <Input id="icd10Code" {...register('icd10Code')} placeholder="Ej: J06.9" />
              </div>

              <div>
                <Label htmlFor="obraSocial">Obra Social</Label>
                <Input
                  id="obraSocial"
                  {...register('obraSocial')}
                  placeholder="Nombre de la obra social"
                />
              </div>
            </div>
          </div>

          {/* Error message */}
          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          {/* Success message */}
          {submitSuccess && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Prescripción creada exitosamente
              </AlertDescription>
            </Alert>
          )}

          {/* Form actions */}
          <div className="flex justify-end gap-3">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                Cancelar
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting} className="min-w-[150px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Emitiendo...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Emitir Prescripción
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
