import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createMocks } from 'node-mocks-http';
import { GET, POST, PUT, DELETE } from '../app/api/appointments/route';
import { prisma } from '../../../lib/.claude';

// Mock de Prisma
jest.mock('../../../lib/prisma', () => ({
  prisma: {
    appointment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    patient: {
      findUnique: jest.fn(),
    },
    doctor: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock de autenticación
jest.mock('../../../lib/auth', () => ({
  verifyToken: jest.fn(() => ({ userId: '1', role: 'patient' })),
}));

describe('Appointments API', () => {
  const mockAppointment = {
    id: '1',
    patientId: 'P001',
    doctorId: 'D001',
    date: '2024-01-15',
    time: '10:00',
    status: 'confirmed',
    type: 'in-person',
    symptoms: 'Dolor en el pecho',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPatient = {
    id: 'P001',
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan.perez@example.com',
  };

  const mockDoctor = {
    id: 'D001',
    firstName: 'Dr. María',
    lastName: 'García',
    specialty: 'Cardiología',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/appointments', () => {
    it('should return appointments for authenticated user', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer valid-token',
        },
        query: {
          userId: '1',
        },
      });

      jest.mocked(prisma.appointment.findMany).mockResolvedValue([mockAppointment]);
      jest.mocked(prisma.patient.findUnique).mockResolvedValue(mockPatient);
      jest.mocked(prisma.doctor.findUnique).mockResolvedValue(mockDoctor);

      await GET(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.appointments).toHaveLength(1);
      expect(data.appointments[0]).toMatchObject({
        id: mockAppointment.id,
        date: mockAppointment.date,
        time: mockAppointment.time,
        status: mockAppointment.status,
        type: mockAppointment.type,
      });
    });

    it('should return filtered appointments by status', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer valid-token',
        },
        query: {
          userId: '1',
          status: 'confirmed',
        },
      });

      jest.mocked(prisma.appointment.findMany).mockResolvedValue([mockAppointment]);

      await GET(req, res);

      expect(prisma.appointment.findMany).toHaveBeenCalledWith({
        where: {
          patientId: '1',
          status: 'confirmed',
        },
        include: {
          patient: true,
          doctor: true,
        },
        orderBy: {
          date: 'asc',
        },
      });
    });

    it('should return filtered appointments by date range', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer valid-token',
        },
        query: {
          userId: '1',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
      });

      jest.mocked(prisma.appointment.findMany).mockResolvedValue([mockAppointment]);

      await GET(req, res);

      expect(prisma.appointment.findMany).toHaveBeenCalledWith({
        where: {
          patientId: '1',
          date: {
            gte: '2024-01-01',
            lte: '2024-01-31',
          },
        },
        include: {
          patient: true,
          doctor: true,
        },
        orderBy: {
          date: 'asc',
        },
      });
    });

    it('should return 401 for unauthorized request', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        headers: {},
      });

      await GET(req, res);

      expect(res._getStatusCode()).toBe(401);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('No autorizado');
    });

    it('should return 500 for database error', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer valid-token',
        },
        query: {
          userId: '1',
        },
      });

      jest.mocked(prisma.appointment.findMany).mockRejectedValue(new Error('Database error'));

      await GET(req, res);

      expect(res._getStatusCode()).toBe(500);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Error interno del servidor');
    });
  });

  describe('POST /api/appointments', () => {
    it('should create new appointment', async () => {
      const newAppointment = {
        patientId: 'P001',
        doctorId: 'D001',
        date: '2024-01-20',
        time: '14:30',
        type: 'in-person',
        symptoms: 'Control rutinario',
      };

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: newAppointment,
      });

      jest.mocked(prisma.appointment.create).mockResolvedValue({
        ...mockAppointment,
        ...newAppointment,
        id: '2',
      });

      await POST(req, res);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data.appointment).toMatchObject(newAppointment);
    });

    it('should validate required fields', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: {
          patientId: 'P001',
          // Missing required fields
        },
      });

      await POST(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Campos requeridos faltantes');
    });

    it('should validate date format', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: {
          patientId: 'P001',
          doctorId: 'D001',
          date: 'invalid-date',
          time: '14:30',
          type: 'in-person',
        },
      });

      await POST(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Formato de fecha inválido');
    });

    it('should validate time format', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: {
          patientId: 'P001',
          doctorId: 'D001',
          date: '2024-01-20',
          time: 'invalid-time',
          type: 'in-person',
        },
      });

      await POST(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Formato de hora inválido');
    });

    it('should check for appointment conflicts', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: {
          patientId: 'P001',
          doctorId: 'D001',
          date: '2024-01-15',
          time: '10:00',
          type: 'in-person',
        },
      });

      jest.mocked(prisma.appointment.findMany).mockResolvedValue([mockAppointment]);

      await POST(req, res);

      expect(res._getStatusCode()).toBe(409);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Conflicto de horario');
    });
  });

  describe('PUT /api/appointments/[id]', () => {
    it('should update appointment', async () => {
      const updateData = {
        date: '2024-01-25',
        time: '15:00',
        symptoms: 'Síntomas actualizados',
      };

      const { req, res } = createMocks({
        method: 'PUT',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: updateData,
      });

      jest.mocked(prisma.appointment.findUnique).mockResolvedValue(mockAppointment);
      jest.mocked(prisma.appointment.update).mockResolvedValue({
        ...mockAppointment,
        ...updateData,
      });

      await PUT(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.appointment).toMatchObject(updateData);
    });

    it('should return 404 for non-existent appointment', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: { date: '2024-01-25' },
      });

      jest.mocked(prisma.appointment.findUnique).mockResolvedValue(null);

      await PUT(req, res);

      expect(res._getStatusCode()).toBe(404);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Cita no encontrada');
    });

    it('should validate appointment ownership', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: { date: '2024-01-25' },
      });

      jest.mocked(prisma.appointment.findUnique).mockResolvedValue({
        ...mockAppointment,
        patientId: 'P002', // Different patient
      });

      await PUT(req, res);

      expect(res._getStatusCode()).toBe(403);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('No autorizado para modificar esta cita');
    });
  });

  describe('DELETE /api/appointments/[id]', () => {
    it('should cancel appointment', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      jest.mocked(prisma.appointment.findUnique).mockResolvedValue(mockAppointment);
      jest.mocked(prisma.appointment.update).mockResolvedValue({
        ...mockAppointment,
        status: 'cancelled',
      });

      await DELETE(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.message).toBe('Cita cancelada exitosamente');
    });

    it('should return 404 for non-existent appointment', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      jest.mocked(prisma.appointment.findUnique).mockResolvedValue(null);

      await DELETE(req, res);

      expect(res._getStatusCode()).toBe(404);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Cita no encontrada');
    });

    it('should not allow cancellation of past appointments', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      jest.mocked(prisma.appointment.findUnique).mockResolvedValue({
        ...mockAppointment,
        date: '2023-01-15', // Past date
      });

      await DELETE(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('No se puede cancelar una cita pasada');
    });

    it('should not allow cancellation of already cancelled appointments', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      jest.mocked(prisma.appointment.findUnique).mockResolvedValue({
        ...mockAppointment,
        status: 'cancelled',
      });

      await DELETE(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('La cita ya está cancelada');
    });
  });

  describe('Validation', () => {
    it('should validate appointment type', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: {
          patientId: 'P001',
          doctorId: 'D001',
          date: '2024-01-20',
          time: '14:30',
          type: 'invalid-type',
        },
      });

      await POST(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Tipo de cita inválido');
    });

    it('should validate appointment status', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: {
          status: 'invalid-status',
        },
      });

      jest.mocked(prisma.appointment.findUnique).mockResolvedValue(mockAppointment);

      await PUT(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Estado de cita inválido');
    });
  });
}); 