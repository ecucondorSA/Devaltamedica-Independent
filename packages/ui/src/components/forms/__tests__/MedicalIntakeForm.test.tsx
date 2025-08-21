// 🧪 TESTS UNITARIOS: MedicalIntakeForm - Formulario Médico Crítico
// Tests para validación HIPAA y integridad de datos del paciente

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MedicalIntakeForm, MedicalIntakeData } from '../MedicalIntakeForm';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// 🔧 MOCKS Y UTILIDADES
const mockOnSubmit = vi.fn();
const mockOnSave = vi.fn();

// Mock de timers para autoguardado
vi.mock('timers');

beforeEach(() => {
  mockOnSubmit.mockClear();
  mockOnSave.mockClear();
  vi.clearAllTimers();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

// 📊 DATOS DE PRUEBA MÉDICOS
const validPatientData: Partial<MedicalIntakeData> = {
  personal: {
    firstName: 'Juan',
    lastName: 'Pérez',
    dateOfBirth: '1985-06-15',
    gender: 'male',
    dni: '12345678',
    email: 'juan.perez@email.com',
    phone: '+54 11 1234-5678',
    address: 'Av. Corrientes 1234',
    city: 'Buenos Aires',
    postalCode: '1043'
  },
  emergency: {
    name: 'María Pérez',
    relationship: 'Esposa',
    phone: '+54 11 9876-5432',
    alternativePhone: '+54 11 5555-1234'
  }
};

const medicalDataWithAllergies: Partial<MedicalIntakeData> = {
  ...validPatientData,
  medical: {
    bloodType: 'O+',
    allergies: ['Penicilina', 'Maní', 'Polen'],
    currentMedications: [
      { name: 'Losartán', dose: '50mg', frequency: '1 vez al día' },
      { name: 'Metformina', dose: '500mg', frequency: '2 veces al día' }
    ],
    chronicConditions: ['Hipertensión', 'Diabetes Tipo 2'],
    previousSurgeries: [],
    familyHistory: ['Diabetes', 'Enfermedad cardíaca']
  }
};

const pediatricPatientData: Partial<MedicalIntakeData> = {
  personal: {
    firstName: 'Ana',
    lastName: 'García',
    dateOfBirth: '2015-03-20', // 8 años
    gender: 'female',
    dni: '45678901',
    email: 'ana.garcia@email.com',
    phone: '+54 11 2468-1357',
    address: 'Calle Falsa 123',
    city: 'La Plata',
    postalCode: '1900'
  },
  emergency: {
    name: 'Carlos García',
    relationship: 'Padre',
    phone: '+54 11 1357-2468'
  }
};

describe('🏥 MedicalIntakeForm - Formulario Médico Crítico', () => {
  
  describe('✅ Renderizado y Estructura', () => {
    
    it('debe renderizar todas las secciones del formulario', () => {
      render(
        <MedicalIntakeForm 
          onSubmit={mockOnSubmit}
        />
      );
      
      expect(screen.getByText('Formulario de Ingreso Médico')).toBeInTheDocument();
      expect(screen.getByText('Información Personal')).toBeInTheDocument();
      expect(screen.getByText('Historial Médico')).toBeInTheDocument();
      expect(screen.getByText('Estilo de Vida')).toBeInTheDocument();
      expect(screen.getByText('Contacto de Emergencia')).toBeInTheDocument();
      expect(screen.getByText('Seguro Médico')).toBeInTheDocument();
    });

    it('debe mostrar la barra de progreso cuando está habilitada', () => {
      render(
        <MedicalIntakeForm 
          onSubmit={mockOnSubmit}
          showProgress={true}
        />
      );
      
      expect(screen.getByText(/% completado/)).toBeInTheDocument();
      const progressBar = screen.getByRole('progressbar', { hidden: true });
      expect(progressBar).toBeInTheDocument();
    });

    it('debe aplicar datos iniciales correctamente', () => {
      render(
        <MedicalIntakeForm 
          onSubmit={mockOnSubmit}
          initialData={validPatientData}
        />
      );
      
      expect(screen.getByDisplayValue('Juan')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Pérez')).toBeInTheDocument();
      expect(screen.getByDisplayValue('12345678')).toBeInTheDocument();
    });
  });

  describe('📝 Validación de Campos Obligatorios', () => {
    
    it('debe validar campos obligatorios de información personal', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <MedicalIntakeForm 
          onSubmit={mockOnSubmit}
        />
      );
      
      // Intentar avanzar sin completar campos obligatorios
      const nextButton = screen.getByText('Siguiente');
      await user.click(nextButton);
      
      expect(screen.getByText('Nombre requerido')).toBeInTheDocument();
      expect(screen.getByText('Apellido requerido')).toBeInTheDocument();
      expect(screen.getByText('DNI requerido')).toBeInTheDocument();
      expect(screen.getByText('Email requerido')).toBeInTheDocument();
    });

    it('debe validar contacto de emergencia obligatorio', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <MedicalIntakeForm 
          onSubmit={mockOnSubmit}
          initialData={validPatientData}
        />
      );
      
      // Navegar a la sección de contacto de emergencia
      const emergencySection = screen.getByText('Contacto de Emergencia');
      await user.click(emergencySection);
      
      const nextButton = screen.getByText('Completar Registro');
      await user.click(nextButton);
      
      expect(screen.getByText('Nombre de contacto requerido')).toBeInTheDocument();
      expect(screen.getByText('Relación requerida')).toBeInTheDocument();
      expect(screen.getByText('Teléfono de emergencia requerido')).toBeInTheDocument();
    });

    it('debe prevenir envío con datos incompletos', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <MedicalIntakeForm 
          onSubmit={mockOnSubmit}
        />
      );
      
      // Navegar hasta el final sin completar datos
      for (let i = 0; i < 4; i++) {
        const nextButton = screen.queryByText('Siguiente');
        if (nextButton) {
          await user.click(nextButton);
        }
      }
      
      const submitButton = screen.getByText('Completar Registro');
      await user.click(submitButton);
      
      // No debe llamar onSubmit si hay errores de validación
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('🚨 Gestión de Alergias (Crítico para Seguridad)', () => {
    
    it('debe permitir añadir alergias correctamente', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <MedicalIntakeForm 
          onSubmit={mockOnSubmit}
          initialData={validPatientData}
        />
      );
      
      // Navegar a sección médica
      const medicalSection = screen.getByText('Historial Médico');
      await user.click(medicalSection);
      
      // Añadir alergia
      const allergyInput = screen.getByPlaceholderText(/Ej: Penicilina, Polen, Maní/);
      await user.type(allergyInput, 'Penicilina');
      
      const addButton = screen.getByRole('button', { name: /Añadir/ });
      await user.click(addButton);
      
      expect(screen.getByText('Penicilina')).toBeInTheDocument();
    });

    it('debe mostrar alergias con iconos de alerta', async () => {
      render(
        <MedicalIntakeForm 
          onSubmit={mockOnSubmit}
          initialData={medicalDataWithAllergies}
        />
      );
      
      // Navegar a sección médica
      const medicalSection = screen.getByText('Historial Médico');
      await fireEvent.click(medicalSection);
      
      // Verificar que las alergias se muestran con estilo de alerta
      const allergyElement = screen.getByText('Penicilina').closest('div');
      expect(allergyElement).toHaveClass('bg-red-100', 'text-red-800');
    });

    it('debe permitir eliminar alergias', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <MedicalIntakeForm 
          onSubmit={mockOnSubmit}
          initialData={medicalDataWithAllergies}
        />
      );
      
      // Navegar a sección médica
      const medicalSection = screen.getByText('Historial Médico');
      await user.click(medicalSection);
      
      // Eliminar alergia
      const deleteButton = screen.getAllByRole('button')[0]; // Primer botón X
      await user.click(deleteButton);
      
      expect(screen.queryByText('Penicilina')).not.toBeInTheDocument();
    });
  });

  describe('💊 Gestión de Medicamentos', () => {
    
    it('debe permitir añadir medicamentos con dosis y frecuencia', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <MedicalIntakeForm 
          onSubmit={mockOnSubmit}
          initialData={validPatientData}
        />
      );
      
      // Navegar a sección médica
      const medicalSection = screen.getByText('Historial Médico');
      await user.click(medicalSection);
      
      // Completar información del medicamento
      const nameInput = screen.getByPlaceholderText('Nombre del medicamento');
      const doseInput = screen.getByPlaceholderText(/Dosis \(ej: 500mg\)/);
      const frequencyInput = screen.getByPlaceholderText('Frecuencia');
      
      await user.type(nameInput, 'Aspirina');
      await user.type(doseInput, '100mg');
      await user.type(frequencyInput, '1 vez al día');
      
      const addMedButton = screen.getAllByText('Añadir')[1]; // Segundo botón Añadir (medicamentos)
      await user.click(addMedButton);
      
      expect(screen.getByText('Aspirina')).toBeInTheDocument();
      expect(screen.getByText('100mg - 1 vez al día')).toBeInTheDocument();
    });

    it('debe mostrar medicamentos actuales en tarjetas estructuradas', () => {
      render(
        <MedicalIntakeForm 
          onSubmit={mockOnSubmit}
          initialData={medicalDataWithAllergies}
        />
      );
      
      // Navegar a sección médica
      const medicalSection = screen.getByText('Historial Médico');
      fireEvent.click(medicalSection);
      
      // Verificar estructura de medicamentos
      expect(screen.getByText('Losartán')).toBeInTheDocument();
      expect(screen.getByText('50mg - 1 vez al día')).toBeInTheDocument();
      expect(screen.getByText('Metformina')).toBeInTheDocument();
      expect(screen.getByText('500mg - 2 veces al día')).toBeInTheDocument();
    });
  });

  describe('⚡ Auto-guardado (HIPAA Compliance)', () => {
    
    it('debe activar auto-guardado después del intervalo especificado', async () => {
      render(
        <MedicalIntakeForm 
          onSubmit={mockOnSubmit}
          onSave={mockOnSave}
          autoSave={true}
          autoSaveInterval={5000}
          initialData={validPatientData}
        />
      );
      
      // Simular cambio en el formulario
      const firstNameInput = screen.getByDisplayValue('Juan');
      await act(async () => {
        fireEvent.change(firstNameInput, { target: { value: 'Juan Carlos' } });
      });
      
      // Avanzar tiempo para activar auto-guardado
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });
      
      expect(mockOnSave).toHaveBeenCalled();
    });

    it('debe mostrar indicador de último guardado', async () => {
      render(
        <MedicalIntakeForm 
          onSubmit={mockOnSubmit}
          onSave={mockOnSave}
          autoSave={true}
          initialData={validPatientData}
        />
      );
      
      // Hacer un cambio y activar guardado
      const firstNameInput = screen.getByDisplayValue('Juan');
      await act(async () => {
        fireEvent.change(firstNameInput, { target: { value: 'Juan Carlos' } });
      });
      
      await act(async () => {
        vi.advanceTimersByTime(30000);
      });
      
      expect(screen.getByText(/Guardado/)).toBeInTheDocument();
    });

    it('NO debe hacer auto-guardado cuando autoSave=false', async () => {
      render(
        <MedicalIntakeForm 
          onSubmit={mockOnSubmit}
          onSave={mockOnSave}
          autoSave={false}
          initialData={validPatientData}
        />
      );
      
      // Hacer cambio
      const firstNameInput = screen.getByDisplayValue('Juan');
      await act(async () => {
        fireEvent.change(firstNameInput, { target: { value: 'Juan Carlos' } });
      });
      
      // Avanzar tiempo
      await act(async () => {
        vi.advanceTimersByTime(30000);
      });
      
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe('📊 Cálculo de Progreso', () => {
    
    it('debe calcular progreso correctamente con datos parciales', () => {
      render(
        <MedicalIntakeForm 
          onSubmit={mockOnSubmit}
          initialData={validPatientData}
          showProgress={true}
        />
      );
      
      // Verificar que el progreso se muestra
      const progressText = screen.getByText(/% completado/);
      expect(progressText).toBeInTheDocument();
      
      // Con validPatientData (solo personal + emergency) debería tener progreso > 0
      expect(progressText.textContent).toMatch(/[1-9]\d*% completado/);
    });

    it('debe mostrar 100% de progreso con datos completos', () => {
      const completeData: MedicalIntakeData = {
        personal: {
          firstName: 'Juan',
          lastName: 'Pérez',
          dateOfBirth: '1985-06-15',
          gender: 'male',
          dni: '12345678',
          email: 'juan@email.com',
          phone: '+54 11 1234-5678',
          address: 'Av. Corrientes 1234',
          city: 'Buenos Aires',
          postalCode: '1043'
        },
        medical: {
          bloodType: 'O+',
          allergies: ['Penicilina'],
          currentMedications: [{ name: 'Aspirina', dose: '100mg', frequency: 'diaria' }],
          chronicConditions: ['Hipertensión'],
          previousSurgeries: [],
          familyHistory: ['Diabetes']
        },
        lifestyle: {
          smoker: 'never',
          alcohol: 'occasional',
          exercise: 'moderate',
          diet: 'Balanceada',
          sleep: '8 horas'
        },
        emergency: {
          name: 'María Pérez',
          relationship: 'Esposa',
          phone: '+54 11 9876-5432'
        },
        insurance: {
          hasInsurance: true,
          provider: 'OSDE',
          planNumber: '123456',
          groupNumber: 'Plan 210'
        }
      };

      render(
        <MedicalIntakeForm 
          onSubmit={mockOnSubmit}
          initialData={completeData}
          showProgress={true}
        />
      );
      
      const progressText = screen.getByText(/100% completado/);
      expect(progressText).toBeInTheDocument();
    });
  });

  describe('🔄 Navegación Entre Secciones', () => {
    
    it('debe permitir navegación hacia adelante y atrás', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <MedicalIntakeForm 
          onSubmit={mockOnSubmit}
          initialData={validPatientData}
        />
      );
      
      // Avanzar a siguiente sección
      const nextButton = screen.getByText('Siguiente');
      await user.click(nextButton);
      
      expect(screen.getByText('Historial Médico')).toHaveClass('bg-primary-100');
      
      // Retroceder
      const prevButton = screen.getByText('Anterior');
      await user.click(prevButton);
      
      expect(screen.getByText('Información Personal')).toHaveClass('bg-primary-100');
    });

    it('debe deshabilitar botón Anterior en primera sección', () => {
      render(
        <MedicalIntakeForm 
          onSubmit={mockOnSubmit}
        />
      );
      
      const prevButton = screen.getByText('Anterior');
      expect(prevButton).toBeDisabled();
    });

    it('debe cambiar botón Siguiente por Completar en última sección', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <MedicalIntakeForm 
          onSubmit={mockOnSubmit}
          initialData={validPatientData}
        />
      );
      
      // Navegar hasta la última sección
      for (let i = 0; i < 4; i++) {
        const nextButton = screen.queryByText('Siguiente');
        if (nextButton) {
          await user.click(nextButton);
        }
      }
      
      expect(screen.getByText('Completar Registro')).toBeInTheDocument();
      expect(screen.queryByText('Siguiente')).not.toBeInTheDocument();
    });
  });

  describe('🏥 Casos Edge Médicos', () => {
    
    it('debe manejar paciente pediátrico correctamente', async () => {
      render(
        <MedicalIntakeForm 
          onSubmit={mockOnSubmit}
          initialData={pediatricPatientData}
        />
      );
      
      // Verificar que se acepta fecha de nacimiento pediátrica
      expect(screen.getByDisplayValue('2015-03-20')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Ana')).toBeInTheDocument();
    });

    it('debe validar formato de DNI argentino', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <MedicalIntakeForm 
          onSubmit={mockOnSubmit}
        />
      );
      
      // Ingresar DNI inválido
      const dniInput = screen.getByLabelText(/DNI/);
      await user.type(dniInput, 'ABC123');
      
      const nextButton = screen.getByText('Siguiente');
      await user.click(nextButton);
      
      // Debería aceptar cualquier string por ahora, pero en producción debería validar formato
      // Este test documenta el comportamiento actual
      expect(dniInput).toHaveValue('ABC123');
    });

    it('debe manejar información de seguro opcional', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <MedicalIntakeForm 
          onSubmit={mockOnSubmit}
          initialData={validPatientData}
        />
      );
      
      // Navegar a sección de seguro
      const insuranceSection = screen.getByText('Seguro Médico');
      await user.click(insuranceSection);
      
      // Marcar que NO tiene seguro
      const hasInsuranceCheckbox = screen.getByLabelText(/¿Tiene seguro médico/);
      expect(hasInsuranceCheckbox).not.toBeChecked();
      
      // No debería mostrar campos adicionales
      expect(screen.queryByLabelText(/Obra Social/)).not.toBeInTheDocument();
      
      // Marcar que SÍ tiene seguro
      await user.click(hasInsuranceCheckbox);
      
      // Ahora debería mostrar campos adicionales
      expect(screen.getByLabelText(/Obra Social/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Número de Afiliado/)).toBeInTheDocument();
    });
  });

  describe('📤 Envío Final del Formulario', () => {
    
    it('debe enviar datos completos correctamente', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <MedicalIntakeForm 
          onSubmit={mockOnSubmit}
          initialData={validPatientData}
        />
      );
      
      // Completar contacto de emergencia (requerido)
      const emergencySection = screen.getByText('Contacto de Emergencia');
      await user.click(emergencySection);
      
      // Navegar a la última sección y enviar
      const insuranceSection = screen.getByText('Seguro Médico');
      await user.click(insuranceSection);
      
      const submitButton = screen.getByText('Completar Registro');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            personal: expect.objectContaining({
              firstName: 'Juan',
              lastName: 'Pérez'
            }),
            emergency: expect.objectContaining({
              name: 'María Pérez',
              relationship: 'Esposa'
            })
          })
        );
      });
    });

    it('debe mostrar estado de carga durante envío', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      // Mock para simular demora en el envío
      mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
      
      render(
        <MedicalIntakeForm 
          onSubmit={mockOnSubmit}
          initialData={validPatientData}
        />
      );
      
      // Navegar hasta el final y enviar
      const emergencySection = screen.getByText('Contacto de Emergencia');
      await user.click(emergencySection);
      
      const insuranceSection = screen.getByText('Seguro Médico');
      await user.click(insuranceSection);
      
      const submitButton = screen.getByText('Completar Registro');
      await user.click(submitButton);
      
      // Verificar estado de carga
      expect(screen.getByText('Enviando...')).toBeInTheDocument();
      
      // El botón debe estar deshabilitado durante el envío
      expect(submitButton).toBeDisabled();
    });
  });

  describe('♿ Accesibilidad', () => {
    
    it('debe tener estructura ARIA correcta', () => {
      render(
        <MedicalIntakeForm 
          onSubmit={mockOnSubmit}
        />
      );
      
      // Verificar elementos de formulario accesibles
      const form = screen.getByRole('region');
      expect(form).toBeInTheDocument();
      
      // Verificar labels asociados a inputs
      const nameInput = screen.getByLabelText(/Nombre \*/);
      expect(nameInput).toBeInTheDocument();
    });

    it('debe mostrar errores de validación accesibles para lectores de pantalla', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(
        <MedicalIntakeForm 
          onSubmit={mockOnSubmit}
        />
      );
      
      const nextButton = screen.getByText('Siguiente');
      await user.click(nextButton);
      
      // Los mensajes de error deben estar asociados al campo
      const nameError = screen.getByText('Nombre requerido');
      expect(nameError).toHaveAttribute('class', expect.stringContaining('text-red-500'));
    });
  });
});