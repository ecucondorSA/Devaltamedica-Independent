'use client';

import {
    AppointmentStatus,
    AppointmentType,
    createAppointmentSchema,
    Priority,
    type CreateAppointment
} from '@altamedica/types';
import { Badge } from '@altamedica/ui/badge';
import { Button } from '@altamedica/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@altamedica/ui/card';
import { DialogFooter, DialogHeader, DialogTitle } from '@altamedica/ui/dialog';
import { Input } from '@altamedica/ui/input';
import { Label } from '@altamedica/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@altamedica/ui/select';
import { Switch } from '@altamedica/ui/switch';
import { Textarea } from '@altamedica/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { addMinutes, format } from 'date-fns';
import { AlertTriangle, CalendarIcon, Clock, Save, User, Video, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { logger } from '@altamedica/shared/services/logger.service';
interface AppointmentFormProps {
  onSubmit: (data: CreateAppointment) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  defaultValues?: Partial<CreateAppointment>;
  doctors?: Array<{ id: string; name: string; specialty: string }>;
  patients?: Array<{ id: string; name: string; phone?: string; email?: string }>;
  selectedDate?: Date;
  selectedTimeSlot?: { start: Date; end: Date };
}

// Datos de ejemplo para doctores
const defaultDoctors = [
  { id: "d1", name: "Dr. Carlos Martínez", specialty: "Cardiología" },
  { id: "d2", name: "Dra. María López", specialty: "Pediatría" },
  { id: "d3", name: "Dr. Alejandro Rodríguez", specialty: "Neurología" },
  { id: "d4", name: "Dra. Ana Fernández", specialty: "Ginecología" },
];

// Datos de ejemplo para pacientes
const defaultPatients = [
  { id: "p1", name: "Juan Pérez", phone: "+54 11 1234-5678", email: "juan@example.com" },
  { id: "p2", name: "María García", phone: "+54 11 2345-6789", email: "maria@example.com" },
  { id: "p3", name: "Carlos Rodríguez", phone: "+54 11 3456-7890", email: "carlos@example.com" },
];

// Slots de tiempo predefinidos
const timeSlots = [
  { label: "08:00", value: "08:00" },
  { label: "08:30", value: "08:30" },
  { label: "09:00", value: "09:00" },
  { label: "09:30", value: "09:30" },
  { label: "10:00", value: "10:00" },
  { label: "10:30", value: "10:30" },
  { label: "11:00", value: "11:00" },
  { label: "11:30", value: "11:30" },
  { label: "12:00", value: "12:00" },
  { label: "14:00", value: "14:00" },
  { label: "14:30", value: "14:30" },
  { label: "15:00", value: "15:00" },
  { label: "15:30", value: "15:30" },
  { label: "16:00", value: "16:00" },
  { label: "16:30", value: "16:30" },
  { label: "17:00", value: "17:00" },
  { label: "17:30", value: "17:30" },
  { label: "18:00", value: "18:00" },
];

// Duraciones predefinidas
const durations = [
  { label: "15 minutos", value: 15 },
  { label: "30 minutos", value: 30 },
  { label: "45 minutos", value: 45 },
  { label: "1 hora", value: 60 },
  { label: "1.5 horas", value: 90 },
  { label: "2 horas", value: 120 },
];

export default function AppointmentForm({
  onSubmit,
  onCancel,
  isLoading = false,
  defaultValues,
  doctors = defaultDoctors,
  patients = defaultPatients,
  selectedDate,
  selectedTimeSlot
}: AppointmentFormProps) {
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [isVirtual, setIsVirtual] = useState(false);
  const [duration, setDuration] = useState(30);
  const [startTime, setStartTime] = useState('');

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm<CreateAppointment>({
    resolver: zodResolver(createAppointmentSchema),
    defaultValues: {
      title: '',
      description: '',
      status: AppointmentStatus.SCHEDULED,
      type: AppointmentType.CONSULTATION,
      priority: Priority.NORMAL,
      isVirtual: false,
      notifyPatient: true,
      notifyDoctor: true,
      followUpRequired: false,
      companyId: 'company-1', // TODO: obtener de contexto
      createdBy: 'user-1', // TODO: obtener de auth
      ...defaultValues
    }
  });

  const watchIsVirtual = watch('isVirtual');
  const watchType = watch('type');

  // Configurar valores iniciales si hay un slot seleccionado
  useEffect(() => {
    if (selectedTimeSlot) {
      const startTimeStr = format(selectedTimeSlot.start, 'HH:mm');
      setStartTime(startTimeStr);
      setValue('start', selectedTimeSlot.start);
      setValue('end', selectedTimeSlot.end);
    }
  }, [selectedTimeSlot, setValue]);

  // Actualizar fecha de fin cuando cambia la hora de inicio o duración
  useEffect(() => {
    if (startTime && selectedDate) {
      const [hours, minutes] = startTime.split(':').map(Number);
      const startDateTime = new Date(selectedDate);
      startDateTime.setHours(hours, minutes, 0, 0);
      
      const endDateTime = addMinutes(startDateTime, duration);
      
      setValue('start', startDateTime);
      setValue('end', endDateTime);
    }
  }, [startTime, duration, selectedDate, setValue]);

  // Manejar envío del formulario
  const handleFormSubmit = async (data: CreateAppointment) => {
    try {
      // Agregar información del doctor seleccionado
      const doctor = doctors.find(d => d.id === selectedDoctor);
      if (doctor) {
        data.doctor = {
          id: doctor.id,
          name: doctor.name,
          specialty: doctor.specialty,
        };
      }

      // Agregar información del paciente seleccionado
      const patient = patients.find(p => p.id === selectedPatient);
      if (patient) {
        data.patient = {
          id: patient.id,
          name: patient.name,
          phone: patient.phone,
          email: patient.email,
        };
      }

      // Agregar metadatos
      data.createdAt = new Date().toISOString();
      data.updatedAt = new Date().toISOString();

      await onSubmit(data);
    } catch (error) {
      logger.error('Error submitting form:', error);
    }
  };

  const getPatientInfo = (patientId: string) => {
    return patients.find(p => p.id === patientId);
  };

  const getDoctorInfo = (doctorId: string) => {
    return doctors.find(d => d.id === doctorId);
  };

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-blue-600" />
          Programar Nueva Cita
        </DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Información básica */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Básica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título de la cita *</Label>
                <Input
                  id="title"
                  {...register('title')}
                  placeholder="Ej: Consulta cardiológica"
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo de consulta *</Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(AppointmentType).map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Motivo de la consulta, síntomas, etc."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridad</Label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(Priority).map((priority) => (
                          <SelectItem key={priority} value={priority}>
                            <div className="flex items-center gap-2">
                              {priority === Priority.URGENT && <AlertTriangle className="h-4 w-4 text-red-500" />}
                              {priority}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={AppointmentStatus.SCHEDULED}>Programada</SelectItem>
                        <SelectItem value={AppointmentStatus.RESCHEDULED}>Reprogramada</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Participantes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Participantes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="doctor">Doctor *</Label>
                <Select value={selectedDoctor} onValueChange={(value) => {
                  setSelectedDoctor(value);
                  setValue('doctorId', value);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        <div>
                          <p className="font-medium">{doctor.name}</p>
                          <p className="text-sm text-gray-500">{doctor.specialty}</p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedDoctor && (
                  <div className="mt-2">
                    <Badge variant="outline">
                      {getDoctorInfo(selectedDoctor)?.specialty}
                    </Badge>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="patient">Paciente</Label>
                <Select value={selectedPatient} onValueChange={(value) => {
                  setSelectedPatient(value);
                  setValue('patientId', value);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar paciente (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        <div>
                          <p className="font-medium">{patient.name}</p>
                          {patient.phone && <p className="text-sm text-gray-500">{patient.phone}</p>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!selectedPatient && (
                  <div className="space-y-2">
                    <Label htmlFor="patientName">Nombre del paciente</Label>
                    <Input
                      id="patientName"
                      {...register('patientName')}
                      placeholder="Nombre completo del paciente"
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Horario y ubicación */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horario y Ubicación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Fecha *</Label>
                <Input
                  id="date"
                  type="date"
                  defaultValue={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    const date = new Date(e.target.value);
                    if (startTime) {
                      const [hours, minutes] = startTime.split(':').map(Number);
                      date.setHours(hours, minutes, 0, 0);
                      setValue('start', date);
                      setValue('end', addMinutes(date, duration));
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Hora de inicio *</Label>
                <Select value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar hora" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot.value} value={slot.value}>
                        {slot.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duración</Label>
                <Select value={duration.toString()} onValueChange={(value) => setDuration(Number(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {durations.map((dur) => (
                      <SelectItem key={dur.value} value={dur.value.toString()}>
                        {dur.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Modalidad */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Controller
                  name="isVirtual"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        setIsVirtual(checked);
                      }}
                    />
                  )}
                />
                <Label htmlFor="isVirtual" className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Consulta virtual
                </Label>
              </div>

              {watchIsVirtual ? (
                <div className="space-y-2">
                  <Label htmlFor="meetingUrl">URL de la reunión</Label>
                  <Input
                    id="meetingUrl"
                    {...register('meetingUrl')}
                    placeholder="https://meet.google.com/xxx-xxx-xxx"
                    type="url"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Ubicación</Label>
                    <Input
                      id="location"
                      {...register('location')}
                      placeholder="Consultorio, clínica, hospital..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="room">Sala/Consultorio</Label>
                    <Input
                      id="room"
                      {...register('room')}
                      placeholder="Número de sala o consultorio"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Opciones adicionales */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Opciones Adicionales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Controller
                  name="notifyPatient"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
                <Label>Notificar al paciente</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Controller
                  name="notifyDoctor"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
                <Label>Notificar al doctor</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Controller
                  name="followUpRequired"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
                <Label>Requiere seguimiento</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botones de acción */}
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Guardando...' : 'Programar Cita'}
          </Button>
        </DialogFooter>
      </form>
    </div>
  );
}
