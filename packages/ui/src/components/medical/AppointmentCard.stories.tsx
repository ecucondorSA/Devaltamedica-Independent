import type { Meta, StoryObj } from '@storybook/react';
import { AppointmentCard } from './AppointmentCard';
import { within, userEvent } from '@storybook/testing-library';
import { expect } from '@storybook/jest';

const meta = {
  title: 'Medical/AppointmentCard',
  component: AppointmentCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Tarjeta de cita médica que muestra información del paciente, doctor y estado de la cita. Optimizada para flujos de telemedicina.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['scheduled', 'in-progress', 'completed', 'cancelled', 'no-show'],
      description: 'Estado actual de la cita médica'
    },
    priority: {
      control: 'select',
      options: ['low', 'normal', 'high', 'urgent'],
      description: 'Prioridad de la cita médica'
    },
    appointmentType: {
      control: 'select',
      options: ['in-person', 'telemedicine', 'phone', 'follow-up'],
      description: 'Tipo de consulta médica'
    }
  }
} satisfies Meta<typeof AppointmentCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Base appointment data
const baseAppointment = {
  id: '12345',
  patientName: 'María García Rodríguez',
  patientAge: 34,
  doctorName: 'Dr. Juan Carlos López',
  doctorSpecialty: 'Cardiología',
  date: new Date('2024-08-10T14:30:00'),
  duration: 30,
  reason: 'Consulta de control cardiológico'
};

export const Scheduled: Story = {
  args: {
    ...baseAppointment,
    status: 'scheduled',
    priority: 'normal',
    appointmentType: 'telemedicine'
  }
};

export const InProgress: Story = {
  args: {
    ...baseAppointment,
    status: 'in-progress',
    priority: 'normal',
    appointmentType: 'telemedicine',
    startedAt: new Date('2024-08-10T14:30:00')
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const videoButton = canvas.getByTestId('start-video-call');
    await expect(videoButton).toBeInTheDocument();
    await expect(canvas.getByText('En progreso')).toBeVisible();
  }
};

export const Urgent: Story = {
  args: {
    ...baseAppointment,
    status: 'scheduled',
    priority: 'urgent',
    appointmentType: 'telemedicine',
    reason: 'Dolor torácico agudo - evaluación urgente'
  }
};

export const Emergency: Story = {
  args: {
    ...baseAppointment,
    status: 'scheduled',
    priority: 'urgent',
    appointmentType: 'telemedicine',
    reason: 'Emergencia - Dificultad respiratoria severa',
    isEmergency: true,
    emergencyLevel: 'high'
  }
};

export const Completed: Story = {
  args: {
    ...baseAppointment,
    status: 'completed',
    priority: 'normal',
    appointmentType: 'telemedicine',
    completedAt: new Date('2024-08-10T15:00:00'),
    diagnosis: 'Control cardiológico normal',
    prescriptions: ['Atenolol 50mg', 'Aspirina 100mg']
  }
};

export const Cancelled: Story = {
  args: {
    ...baseAppointment,
    status: 'cancelled',
    priority: 'normal',
    appointmentType: 'in-person',
    cancelledAt: new Date('2024-08-10T12:00:00'),
    cancellationReason: 'Reagendada por paciente'
  }
};

export const NoShow: Story = {
  args: {
    ...baseAppointment,
    status: 'no-show',
    priority: 'normal',
    appointmentType: 'telemedicine',
    expectedAt: new Date('2024-08-10T14:30:00')
  }
};

export const FollowUp: Story = {
  args: {
    ...baseAppointment,
    status: 'scheduled',
    priority: 'normal',
    appointmentType: 'follow-up',
    reason: 'Seguimiento post-cirugía cardiaca',
    isFollowUp: true,
    originalAppointmentId: '12344',
    followUpType: 'post-surgery'
  }
};

export const PediatricConsultation: Story = {
  args: {
    ...baseAppointment,
    patientName: 'Sofia Martínez (menor)',
    patientAge: 8,
    guardianName: 'Ana Martínez',
    doctorName: 'Dra. Carmen Ruiz',
    doctorSpecialty: 'Pediatría',
    reason: 'Control de crecimiento y desarrollo',
    status: 'scheduled',
    priority: 'normal',
    appointmentType: 'in-person',
    isPediatric: true
  }
};

export const GroupTherapy: Story = {
  args: {
    ...baseAppointment,
    doctorName: 'Dr. Miguel Santos',
    doctorSpecialty: 'Psicología',
    reason: 'Terapia grupal - Manejo de ansiedad',
    status: 'scheduled',
    priority: 'normal',
    appointmentType: 'telemedicine',
    isGroup: true,
    maxParticipants: 8,
    currentParticipants: 5
  }
};

export const WithActions: Story = {
  args: {
    ...baseAppointment,
    status: 'scheduled',
    priority: 'normal',
    appointmentType: 'telemedicine',
    showActions: true
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test action buttons are present
    await expect(canvas.getByTestId('reschedule-button')).toBeInTheDocument();
    await expect(canvas.getByTestId('cancel-button')).toBeInTheDocument();
    await expect(canvas.getByTestId('video-call-button')).toBeInTheDocument();
    
    // Test interaction
    const rescheduleButton = canvas.getByTestId('reschedule-button');
    await userEvent.click(rescheduleButton);
    // Add expectations for modal or navigation
  }
};

export const Loading: Story = {
  args: {
    ...baseAppointment,
    isLoading: true,
    status: 'scheduled',
    priority: 'normal',
    appointmentType: 'telemedicine'
  }
};

export const WithMedicalRecords: Story = {
  args: {
    ...baseAppointment,
    status: 'completed',
    priority: 'normal',
    appointmentType: 'telemedicine',
    medicalRecords: {
      vitalSigns: {
        bloodPressure: '120/80',
        heartRate: 72,
        temperature: 36.5,
        weight: 68,
        height: 165
      },
      symptoms: ['Fatiga leve', 'Palpitaciones ocasionales'],
      diagnosis: 'Hipertensión controlada',
      treatment: 'Continuar medicación actual'
    }
  }
};

export const Responsive: Story = {
  args: {
    ...baseAppointment,
    status: 'scheduled',
    priority: 'normal',
    appointmentType: 'telemedicine'
  },
  parameters: {
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '667px'
          }
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px'
          }
        }
      }
    }
  }
};

export const AccessibilityTest: Story = {
  args: {
    ...baseAppointment,
    status: 'scheduled',
    priority: 'urgent',
    appointmentType: 'telemedicine'
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test ARIA labels
    const card = canvas.getByRole('article');
    await expect(card).toHaveAttribute('aria-label');
    
    // Test keyboard navigation
    const actionButton = canvas.getByRole('button', { name: /iniciar videollamada/i });
    actionButton.focus();
    await expect(actionButton).toHaveFocus();
    
    // Test color contrast for urgent priority
    const urgentBadge = canvas.getByText(/urgente/i);
    await expect(urgentBadge).toBeVisible();
  }
};

// Stories for different medical specialties
export const CardioConsultation: Story = {
  args: {
    ...baseAppointment,
    doctorSpecialty: 'Cardiología',
    reason: 'Evaluación post-infarto',
    priority: 'high',
    medicalAlerts: ['Historial de infarto', 'Alergias a aspirina']
  }
};

export const DermatologyConsultation: Story = {
  args: {
    ...baseAppointment,
    doctorName: 'Dra. Elena Vázquez',
    doctorSpecialty: 'Dermatología',
    reason: 'Revisión de lunar sospechoso',
    appointmentType: 'in-person',
    requiresImages: true,
    imageCount: 3
  }
};

export const PsychiatryConsultation: Story = {
  args: {
    ...baseAppointment,
    doctorName: 'Dr. Roberto Jiménez',
    doctorSpecialty: 'Psiquiatría',
    reason: 'Seguimiento trastorno de ansiedad',
    appointmentType: 'telemedicine',
    duration: 60,
    isConfidential: true,
    requiresPrivateRoom: true
  }
};

// Bulk operations story
export const BulkOperations: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        <button className="px-4 py-2 bg-blue-500 text-white rounded">Seleccionar todo</button>
        <button className="px-4 py-2 bg-yellow-500 text-white rounded">Reagendar seleccionadas</button>
        <button className="px-4 py-2 bg-red-500 text-white rounded">Cancelar seleccionadas</button>
      </div>
      {[
        { ...baseAppointment, id: '1', patientName: 'Paciente 1' },
        { ...baseAppointment, id: '2', patientName: 'Paciente 2', priority: 'high' },
        { ...baseAppointment, id: '3', patientName: 'Paciente 3', status: 'completed' }
      ].map(appointment => (
        <AppointmentCard
          key={appointment.id}
          {...appointment}
          selectable={true}
          showBulkActions={true}
        />
      ))}
    </div>
  )
};