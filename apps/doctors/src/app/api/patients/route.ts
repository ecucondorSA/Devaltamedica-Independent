import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@altamedica/shared/services/logger.service';
// Datos simulados de pacientes
const patients = [
  {
    id: '1',
    name: 'María González',
    age: 45,
    gender: 'female',
    primaryDiagnosis: 'Hipertensión',
    comorbidities: ['Diabetes', 'Obesidad'],
    lastVisit: '2024-01-15',
    nextAppointment: '2024-02-01',
    healthScore: 75,
    riskLevel: 'medium',
    insuranceProvider: 'Seguros Médicos SA',
    contactNumber: '+34 600 123 456',
    email: 'maria.gonzalez@email.com',
    address: 'Calle Mayor 123, Madrid',
    emergencyContact: '+34 600 654 321',
    medications: ['Enalapril', 'Metformina'],
    allergies: ['Penicilina'],
    bloodType: 'A+',
    height: 165,
    weight: 70,
    bmi: 25.7
  },
  {
    id: '2',
    name: 'Juan Pérez',
    age: 62,
    gender: 'male',
    primaryDiagnosis: 'Diabetes tipo 2',
    comorbidities: ['Hipertensión', 'Dislipidemia'],
    lastVisit: '2024-01-20',
    nextAppointment: '2024-02-15',
    healthScore: 68,
    riskLevel: 'high',
    insuranceProvider: 'Sanitas',
    contactNumber: '+34 600 234 567',
    email: 'juan.perez@email.com',
    address: 'Avenida de la Paz 45, Barcelona',
    emergencyContact: '+34 600 765 432',
    medications: ['Metformina', 'Amlodipino', 'Atorvastatina'],
    allergies: ['Sulfamidas'],
    bloodType: 'O+',
    height: 175,
    weight: 85,
    bmi: 27.8
  },
  {
    id: '3',
    name: 'Ana Martínez',
    age: 28,
    gender: 'female',
    primaryDiagnosis: 'Asma',
    comorbidities: ['Rinitis alérgica'],
    lastVisit: '2024-01-10',
    nextAppointment: '2024-02-20',
    healthScore: 82,
    riskLevel: 'low',
    insuranceProvider: 'DKV',
    contactNumber: '+34 600 345 678',
    email: 'ana.martinez@email.com',
    address: 'Plaza España 7, Valencia',
    emergencyContact: '+34 600 876 543',
    medications: ['Salbutamol', 'Budesonida'],
    allergies: ['Polvo', 'Ácaros'],
    bloodType: 'B+',
    height: 160,
    weight: 55,
    bmi: 21.5
  },
  {
    id: '4',
    name: 'Luis Rodríguez',
    age: 55,
    gender: 'male',
    primaryDiagnosis: 'Artritis reumatoide',
    comorbidities: ['Osteoporosis'],
    lastVisit: '2024-01-25',
    nextAppointment: '2024-02-10',
    healthScore: 71,
    riskLevel: 'medium',
    insuranceProvider: 'Adeslas',
    contactNumber: '+34 600 456 789',
    email: 'luis.rodriguez@email.com',
    address: 'Calle Real 89, Sevilla',
    emergencyContact: '+34 600 987 654',
    medications: ['Methotrexate', 'Calcio', 'Vitamina D'],
    allergies: ['Antiinflamatorios'],
    bloodType: 'AB+',
    height: 170,
    weight: 75,
    bmi: 26.0
  },
  {
    id: '5',
    name: 'Carmen Sánchez',
    age: 38,
    gender: 'female',
    primaryDiagnosis: 'Migraña',
    comorbidities: ['Ansiedad'],
    lastVisit: '2024-01-30',
    nextAppointment: '2024-02-25',
    healthScore: 78,
    riskLevel: 'low',
    insuranceProvider: 'Mapfre',
    contactNumber: '+34 600 567 890',
    email: 'carmen.sanchez@email.com',
    address: 'Gran Vía 156, Bilbao',
    emergencyContact: '+34 600 098 765',
    medications: ['Sumatriptán', 'Paracetamol'],
    allergies: ['Codeína'],
    bloodType: 'A-',
    height: 162,
    weight: 58,
    bmi: 22.1
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const riskLevel = searchParams.get('riskLevel') || '';
    const ageRange = searchParams.get('ageRange') || '';
    const gender = searchParams.get('gender') || '';

    // Filtrar pacientes según los parámetros
    let filteredPatients = patients;

    if (search) {
      filteredPatients = filteredPatients.filter(patient =>
        patient.name.toLowerCase().includes(search.toLowerCase()) ||
        patient.primaryDiagnosis.toLowerCase().includes(search.toLowerCase()) ||
        patient.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (riskLevel) {
      filteredPatients = filteredPatients.filter(patient =>
        patient.riskLevel === riskLevel
      );
    }

    if (ageRange) {
      const [minAge, maxAge] = ageRange.split('-').map(Number);
      filteredPatients = filteredPatients.filter(patient =>
        patient.age >= minAge && patient.age <= maxAge
      );
    }

    if (gender) {
      filteredPatients = filteredPatients.filter(patient =>
        patient.gender === gender
      );
    }

    // Ordenar por nombre
    filteredPatients.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      success: true,
      data: filteredPatients,
      total: filteredPatients.length,
      filters: {
        search,
        riskLevel,
        ageRange,
        gender
      }
    });

  } catch (error) {
    logger.error('Error obteniendo pacientes:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        data: patients // Fallback a datos simulados
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Crear nuevo paciente
    const { 
      name, 
      age, 
      gender, 
      primaryDiagnosis, 
      comorbidities, 
      contactNumber, 
      email, 
      address,
      emergencyContact,
      medications,
      allergies,
      bloodType,
      height,
      weight
    } = body;

    if (!name || !age || !gender || !contactNumber || !email) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    // Calcular BMI
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);

    // Determinar nivel de riesgo basado en BMI y edad
    let riskLevel = 'low';
    if (bmi > 30 || age > 65) {
      riskLevel = 'high';
    } else if (bmi > 25 || age > 50) {
      riskLevel = 'medium';
    }

    // Calcular health score (simplificado)
    let healthScore = 100;
    if (bmi > 30) healthScore -= 20;
    if (age > 60) healthScore -= 15;
    if (comorbidities && comorbidities.length > 2) healthScore -= 10;

    const newPatient = {
      id: `patient_${Date.now()}`,
      name,
      age,
      gender,
      primaryDiagnosis: primaryDiagnosis || 'Sin diagnóstico',
      comorbidities: comorbidities || [],
      lastVisit: null,
      nextAppointment: null,
      healthScore: Math.max(healthScore, 0),
      riskLevel,
      insuranceProvider: 'Por determinar',
      contactNumber,
      email,
      address: address || '',
      emergencyContact: emergencyContact || '',
      medications: medications || [],
      allergies: allergies || [],
      bloodType: bloodType || 'No especificado',
      height,
      weight,
      bmi: Math.round(bmi * 10) / 10
    };

    // En un entorno real, aquí se guardaría en la base de datos
    // patients.push(newPatient);

    return NextResponse.json({
      success: true,
      message: 'Paciente creado exitosamente',
      data: newPatient
    });

  } catch (error) {
    logger.error('Error creando paciente:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 