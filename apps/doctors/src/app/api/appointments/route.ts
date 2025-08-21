import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@altamedica/shared/services/logger.service';
// Datos simulados de citas
const appointments = [
  {
    id: '1',
    patientName: 'María González',
    patientId: '1',
    doctorName: 'Dr. Carlos López',
    doctorId: 'doc1',
    date: '2024-02-01',
    time: '10:00',
    status: 'scheduled',
    type: 'telemedicine_video',
    specialty: 'Cardiología',
    reason: 'Control de hipertensión',
    duration: 30,
    insuranceCovered: true,
    copay: 20,
    notes: 'Paciente con hipertensión controlada',
    symptoms: ['Dolor de cabeza', 'Fatiga']
  },
  {
    id: '2',
    patientName: 'Juan Pérez',
    patientId: '2',
    doctorName: 'Dr. Carlos López',
    doctorId: 'doc1',
    date: '2024-02-01',
    time: '09:30',
    status: 'in_progress',
    type: 'telemedicine_video',
    specialty: 'Endocrinología',
    reason: 'Consulta de seguimiento diabetes',
    duration: 45,
    insuranceCovered: true,
    copay: 25,
    notes: 'Paciente con diabetes tipo 2',
    symptoms: ['Sed excesiva', 'Micción frecuente']
  },
  {
    id: '3',
    patientName: 'Ana Martínez',
    patientId: '3',
    doctorName: 'Dr. Carlos López',
    doctorId: 'doc1',
    date: '2024-02-01',
    time: '08:00',
    status: 'completed',
    type: 'telemedicine_video',
    specialty: 'Medicina General',
    reason: 'Revisión de medicación',
    duration: 30,
    insuranceCovered: true,
    copay: 15,
    notes: 'Revisión de efectos secundarios',
    symptoms: ['Náuseas leves']
  },
  {
    id: '4',
    patientName: 'Luis Rodríguez',
    patientId: '4',
    doctorName: 'Dr. Carlos López',
    doctorId: 'doc1',
    date: '2024-02-01',
    time: '11:00',
    status: 'scheduled',
    type: 'telemedicine_audio',
    specialty: 'Reumatología',
    reason: 'Consulta sobre dolor de espalda',
    duration: 25,
    insuranceCovered: false,
    copay: 50,
    notes: 'Paciente con artritis reumatoide',
    symptoms: ['Dolor lumbar', 'Rigidez matutina']
  },
  {
    id: '5',
    patientName: 'Carmen Sánchez',
    patientId: '5',
    doctorName: 'Dr. Carlos López',
    doctorId: 'doc1',
    date: '2024-02-01',
    time: '12:00',
    status: 'cancelled',
    type: 'telemedicine_video',
    specialty: 'Neurología',
    reason: 'Consulta por migraña',
    duration: 30,
    insuranceCovered: true,
    copay: 20,
    notes: 'Cancelada por el paciente',
    symptoms: ['Fiebre', 'Tos']
  },
  {
    id: '6',
    patientName: 'Roberto Silva',
    patientId: '6',
    doctorName: 'Dr. Carlos López',
    doctorId: 'doc1',
    date: '2024-02-02',
    time: '14:00',
    status: 'scheduled',
    type: 'in_person',
    specialty: 'Cardiología',
    reason: 'Primera consulta',
    duration: 60,
    insuranceCovered: true,
    copay: 30,
    notes: 'Nuevo paciente',
    symptoms: ['Dolor en el pecho', 'Falta de aire']
  },
  {
    id: '7',
    patientName: 'Isabel Torres',
    patientId: '7',
    doctorName: 'Dr. Carlos López',
    doctorId: 'doc1',
    date: '2024-02-02',
    time: '16:00',
    status: 'scheduled',
    type: 'follow_up',
    specialty: 'Endocrinología',
    reason: 'Seguimiento diabetes',
    duration: 30,
    insuranceCovered: true,
    copay: 20,
    notes: 'Control de glucemia',
    symptoms: []
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const doctorId = searchParams.get('doctorId') || '';
    const patientId = searchParams.get('patientId') || '';
    const type = searchParams.get('type') || '';
    const date = searchParams.get('date') || '';
    const specialty = searchParams.get('specialty') || '';

    // Filtrar citas según los parámetros
    const filteredAppointments = [...appointments];

    let filtered = filteredAppointments;
    
    if (status) {
      filtered = filtered.filter(appointment =>
        appointment.status === status
      );
    }

    if (doctorId) {
      filtered = filtered.filter(appointment =>
        appointment.doctorId === doctorId
      );
    }

    if (patientId) {
      filtered = filtered.filter(appointment =>
        appointment.patientId === patientId
      );
    }

    if (type) {
      filtered = filtered.filter(appointment =>
        appointment.type === type
      );
    }

    if (date) {
      filtered = filtered.filter(appointment =>
        appointment.date === date
      );
    }

    if (specialty) {
      filtered = filtered.filter(appointment =>
        appointment.specialty.toLowerCase() === specialty.toLowerCase()
      );
    }

    // Ordenar por fecha y hora
    filtered.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });

    return NextResponse.json({
      success: true,
      data: filtered,
      total: filtered.length,
      filters: {
        status,
        doctorId,
        patientId,
        type,
        date,
        specialty
      }
    });

  } catch (error) {
    // Log error for debugging
    if (process.env.NODE_ENV === 'development') {
      logger.error('Error obteniendo citas:', error);
    }
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        data: appointments // Fallback a datos simulados
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Crear nueva cita
    const { 
      patientName, 
      patientId, 
      doctorName, 
      doctorId, 
      date, 
      time, 
      type, 
      specialty, 
      reason, 
      duration, 
      insuranceCovered, 
      copay, 
      notes, 
      symptoms 
    } = body;

    if (!patientName || !patientId || !doctorName || !doctorId || !date || !time) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    const newAppointment = {
      id: `appointment_${Date.now()}`,
      patientName,
      patientId,
      doctorName,
      doctorId,
      date,
      time,
      status: 'scheduled',
      type: type || 'telemedicine_video',
      specialty: specialty || 'Medicina General',
      reason: reason || 'Consulta general',
      duration: duration || 30,
      insuranceCovered: insuranceCovered || false,
      copay: copay || 0,
      notes: notes || '',
      symptoms: symptoms || []
    };

    // Add to appointments array (simulated DB operation)
    (appointments as any[]).push(newAppointment);

    return NextResponse.json({
      success: true,
      message: 'Cita creada exitosamente',
      data: newAppointment
    });

  } catch (error) {
    // Log error for debugging
    if (process.env.NODE_ENV === 'development') {
      logger.error('Error creando cita:', error);
    }
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Actualizar cita
    const { 
      appointmentId, 
      status, 
      notes, 
      symptoms, 
      vitalSigns,
      diagnosis,
      prescription 
    } = body;

    if (!appointmentId) {
      return NextResponse.json(
        { success: false, error: 'ID de cita requerido' },
        { status: 400 }
      );
    }

    const appointmentIndex = appointments.findIndex(appointment => appointment.id === appointmentId);
    
    if (appointmentIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Cita no encontrada' },
        { status: 404 }
      );
    }

    // Actualizar campos proporcionados
    if (status) appointments[appointmentIndex].status = status;
    if (notes) appointments[appointmentIndex].notes = notes;
    if (symptoms) appointments[appointmentIndex].symptoms = symptoms;
    if (vitalSigns) appointments[appointmentIndex].vitalSigns = vitalSigns;

    return NextResponse.json({
      success: true,
      message: 'Cita actualizada exitosamente',
      data: appointments[appointmentIndex]
    });

  } catch (error) {
    // Log error for debugging
    if (process.env.NODE_ENV === 'development') {
      logger.error('Error actualizando cita:', error);
    }
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 