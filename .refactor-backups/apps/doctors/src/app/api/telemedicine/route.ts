import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@altamedica/shared/services/logger.service';
// Datos simulados de sesiones de telemedicina
const telemedicineSessions = [
  {
    id: '1',
    patientId: '1',
    patientName: 'María González',
    doctorId: 'doc1',
    doctorName: 'Dr. Carlos López',
    status: 'waiting',
    startTime: '2024-02-01T10:00:00Z',
    endTime: null,
    duration: null,
    type: 'video',
    notes: 'Control de hipertensión',
    symptoms: ['Dolor de cabeza', 'Fatiga'],
    diagnosis: null,
    prescription: null,
    followUpDate: null
  },
  {
    id: '2',
    patientId: '2',
    patientName: 'Juan Pérez',
    doctorId: 'doc1',
    doctorName: 'Dr. Carlos López',
    status: 'active',
    startTime: '2024-02-01T09:30:00Z',
    endTime: null,
    duration: 25,
    type: 'video',
    notes: 'Consulta de seguimiento diabetes',
    symptoms: ['Sed excesiva', 'Micción frecuente'],
    diagnosis: 'Diabetes tipo 2 controlada',
    prescription: ['Metformina 500mg', 'Glucómetro'],
    followUpDate: '2024-03-01'
  },
  {
    id: '3',
    patientId: '3',
    patientName: 'Ana Martínez',
    doctorId: 'doc1',
    doctorName: 'Dr. Carlos López',
    status: 'ended',
    startTime: '2024-02-01T08:00:00Z',
    endTime: '2024-02-01T08:30:00Z',
    duration: 30,
    type: 'video',
    notes: 'Revisión de medicación',
    symptoms: ['Náuseas leves'],
    diagnosis: 'Efectos secundarios de medicación',
    prescription: ['Cambio de dosis', 'Antiácido'],
    followUpDate: '2024-02-15'
  },
  {
    id: '4',
    patientId: '4',
    patientName: 'Luis Rodríguez',
    doctorId: 'doc1',
    doctorName: 'Dr. Carlos López',
    status: 'waiting',
    startTime: '2024-02-01T11:00:00Z',
    endTime: null,
    duration: null,
    type: 'audio',
    notes: 'Consulta sobre dolor de espalda',
    symptoms: ['Dolor lumbar', 'Rigidez matutina'],
    diagnosis: null,
    prescription: null,
    followUpDate: null
  },
  {
    id: '5',
    patientId: '5',
    patientName: 'Carmen Sánchez',
    doctorId: 'doc1',
    doctorName: 'Dr. Carlos López',
    status: 'cancelled',
    startTime: '2024-02-01T12:00:00Z',
    endTime: null,
    duration: null,
    type: 'video',
    notes: 'Cancelada por el paciente',
    symptoms: ['Fiebre', 'Tos'],
    diagnosis: null,
    prescription: null,
    followUpDate: null
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const doctorId = searchParams.get('doctorId') || '';
    const patientId = searchParams.get('patientId') || '';
    const type = searchParams.get('type') || '';

    // Filtrar sesiones según los parámetros
    const filteredSessions = [...telemedicineSessions];

    let filtered = filteredSessions;
    
    if (status) {
      filtered = filtered.filter(session =>
        session.status === status
      );
    }

    if (doctorId) {
      filtered = filtered.filter(session =>
        session.doctorId === doctorId
      );
    }

    if (patientId) {
      filtered = filtered.filter(session =>
        session.patientId === patientId
      );
    }

    if (type) {
      filtered = filtered.filter(session =>
        session.type === type
      );
    }

    // Ordenar por fecha de inicio (más recientes primero)
    filtered.sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

    return NextResponse.json({
      success: true,
      data: filtered,
      total: filtered.length,
      filters: {
        status,
        doctorId,
        patientId,
        type
      }
    });

  } catch (error) {
    // Log error for debugging
    if (process.env.NODE_ENV === 'development') {
      logger.error('Error obteniendo sesiones de telemedicina:', error);
    }
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        data: telemedicineSessions // Fallback a datos simulados
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Crear nueva sesión de telemedicina
    const { patientId, patientName, doctorId, doctorName, type, notes, symptoms } = body;

    if (!patientId || !patientName || !doctorId || !doctorName) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    const newSession = {
      id: `session_${Date.now()}`,
      patientId,
      patientName,
      doctorId,
      doctorName,
      status: 'waiting',
      startTime: new Date().toISOString(),
      endTime: null,
      duration: null,
      type: type || 'video',
      notes: notes || '',
      symptoms: symptoms || [],
      diagnosis: null,
      prescription: null,
      followUpDate: null
    };

    // Add to sessions array (simulated DB operation)
    (telemedicineSessions as any[]).push(newSession);

    return NextResponse.json({
      success: true,
      message: 'Sesión de telemedicina creada exitosamente',
      data: newSession
    });

  } catch (error) {
    // Log error for debugging
    if (process.env.NODE_ENV === 'development') {
      logger.error('Error creando sesión de telemedicina:', error);
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
    
    // Actualizar sesión de telemedicina
    const { sessionId, status, endTime, duration, diagnosis, prescription, followUpDate } = body;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'ID de sesión requerido' },
        { status: 400 }
      );
    }

    const sessionIndex = telemedicineSessions.findIndex(session => session.id === sessionId);
    
    if (sessionIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Sesión no encontrada' },
        { status: 404 }
      );
    }

    // Actualizar campos proporcionados
    if (status) telemedicineSessions[sessionIndex].status = status;
    if (endTime) telemedicineSessions[sessionIndex].endTime = endTime;
    if (duration) telemedicineSessions[sessionIndex].duration = duration;
    if (diagnosis) telemedicineSessions[sessionIndex].diagnosis = diagnosis;
    if (prescription) telemedicineSessions[sessionIndex].prescription = prescription;
    if (followUpDate) telemedicineSessions[sessionIndex].followUpDate = followUpDate;

    return NextResponse.json({
      success: true,
      message: 'Sesión actualizada exitosamente',
      data: telemedicineSessions[sessionIndex]
    });

  } catch (error) {
    // Log error for debugging
    if (process.env.NODE_ENV === 'development') {
      logger.error('Error actualizando sesión de telemedicina:', error);
    }
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 