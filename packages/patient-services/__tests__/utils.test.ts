import type { Patient, PatientProfile } from '../src/patients.service';
import { calculateAge, filterPatients, formatPatientName, formatPhone, getPatientInitials, getPatientStatusInfo, groupPatientsByLastName, validateEmail, validatePhone } from '../src/utils';

describe('patient utilities', () => {
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date('2025-08-11T00:00:00Z'));
  });
  afterAll(() => jest.useRealTimers());

  it('calculateAge retorna edades determinísticas', () => {
    expect(calculateAge('2000-08-11')).toBe(25); // justo cumpleaños
    expect(calculateAge('2000-08-12')).toBe(24); // un día antes del cumpleaños
  });

  it('validateEmail y validatePhone', () => {
    expect(validateEmail('a@b.com')).toBe(true);
    expect(validateEmail('bad')).toBe(false);
    expect(validatePhone('+57 300 123 4567')).toBe(true);
    expect(validatePhone('xxx')).toBe(false);
  });

  it('formatPhone aplica formatos conocidos', () => {
    expect(formatPhone('+57 3001234567')).toBe('+57 300 123 4567');
    expect(formatPhone('3001234567')).toBe('300 123 4567');
    expect(formatPhone('123')).toBe('123');
  });

  it('formatPatientName usa name o personalInfo', () => {
    const p1: Patient = { id: '1', name: 'John Doe', email: 'j@e.com', age: 30, lastVisit: '2025-01-01', status: 'active', createdAt: '', updatedAt: '' };
    const p2: PatientProfile = {
      id: '2',
      personalInfo: { firstName: 'Jane', lastName: 'Roe', dateOfBirth: '1990-01-01', gender: 'female', phone: '', email: '' },
      medicalInfo: { bloodType: 'O+', allergies: [], chronicConditions: [], currentMedications: [], emergencyContact: { name: 'X', phone: 'Y', relationship: 'Z' } },
      preferences: { language: 'es', communicationPreferences: { email: true, sms: false, phone: true }, privacySettings: { shareDataForResearch: false, allowMarketingCommunications: false } },
    };
    expect(formatPatientName(p1)).toBe('John Doe');
    expect(formatPatientName(p2)).toBe('Jane Roe');
  });

  it('getPatientInitials retorna iniciales', () => {
    const p: Patient = { id: '1', name: 'John Doe', email: 'j@e.com', age: 30, lastVisit: '2025-01-01', status: 'active', createdAt: '', updatedAt: '' };
    expect(getPatientInitials(p)).toBe('JD');
  });

  it('getPatientStatusInfo mapea estilos', () => {
    expect(getPatientStatusInfo('active').label).toBe('Activo');
    expect(getPatientStatusInfo('inactive').label).toBe('Inactivo');
    expect(getPatientStatusInfo('suspended').label).toBe('Suspendido');
  });

  it('filterPatients filtra por nombre, email o phone', () => {
    const list: Patient[] = [
      { id: '1', name: 'John Doe', email: 'john@example.com', phone: '3001234567', age: 30, lastVisit: '2025-01-01', status: 'active', createdAt: '', updatedAt: '' },
      { id: '2', name: 'Jane Roe', email: 'jane@example.com', phone: '3009999999', age: 28, lastVisit: '2025-01-01', status: 'inactive', createdAt: '', updatedAt: '' },
    ];
    expect(filterPatients(list, 'john')).toHaveLength(1);
    expect(filterPatients(list, 'example.com')).toHaveLength(2);
    expect(filterPatients(list, '3009')).toHaveLength(1);
    expect(filterPatients(list, '   ')).toHaveLength(2);
  });

  it('groupPatientsByLastName agrupa por inicial del apellido', () => {
    const list: Patient[] = [
      { id: '1', name: 'John Doe', email: 'john@example.com', age: 30, lastVisit: '2025-01-01', status: 'active', createdAt: '', updatedAt: '' },
      { id: '2', name: 'Jane Dane', email: 'jane@example.com', age: 28, lastVisit: '2025-01-01', status: 'inactive', createdAt: '', updatedAt: '' },
      { id: '3', name: 'Alice Brown', email: 'a@example.com', age: 35, lastVisit: '2025-01-01', status: 'active', createdAt: '', updatedAt: '' },
    ];
    const groups = groupPatientsByLastName(list);
    expect(Object.keys(groups)).toEqual(expect.arrayContaining(['D', 'B']));
    expect(groups['D']).toHaveLength(2);
    expect(groups['B']).toHaveLength(1);
  });
});
