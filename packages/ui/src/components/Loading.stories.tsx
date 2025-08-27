import type { Meta, StoryObj } from '@storybook/react';
import {
  Loading,
  MedicalLoading,
  PatientLoading,
  AppointmentLoading,
  PrescriptionLoading,
  LabResultLoading,
} from './Loading';

const meta = {
  title: 'Components/Loading',
  component: Loading,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
    },
    variant: {
      control: 'select',
      options: ['spinner', 'dots', 'pulse', 'bars', 'medical'],
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'white', 'gray'],
    },
    text: { control: 'text' },
    fullScreen: { control: 'boolean' },
    overlay: { control: 'boolean' },
  },
} satisfies Meta<typeof Loading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultSpinner: Story = {
  args: {
    size: 'md',
    variant: 'spinner',
    color: 'primary',
    text: 'Cargando...',
  },
};

export const DotsVariant: Story = {
  args: {
    size: 'md',
    variant: 'dots',
    color: 'primary',
    text: 'Procesando...',
  },
};

export const PulseVariant: Story = {
  args: {
    size: 'md',
    variant: 'pulse',
    color: 'primary',
    text: 'Conectando...',
  },
};

export const BarsVariant: Story = {
  args: {
    size: 'md',
    variant: 'bars',
    color: 'primary',
    text: 'Analizando...',
  },
};

export const MedicalVariant: Story = {
  args: {
    size: 'md',
    variant: 'medical',
    color: 'primary',
    text: 'Preparando consulta...',
  },
};

export const FullScreenLoading: Story = {
  args: {
    fullScreen: true,
    text: 'Cargando aplicación completa...',
  },
  parameters: {
    layout: 'fullscreen',
  },
};

export const OverlayLoading: Story = {
  args: {
    overlay: true,
    text: 'Actualizando datos...',
  },
  render: (args) => (
    <div className="relative w-64 h-32 border rounded-lg flex items-center justify-center">
      Contenido de fondo
      <Loading {...args} />
    </div>
  ),
};

export const MedicalSpecificLoading: Story = {
  render: () => <MedicalLoading />,
};

export const PatientSpecificLoading: Story = {
  render: () => <PatientLoading />,
};

export const AppointmentSpecificLoading: Story = {
  render: () => <AppointmentLoading />,
};

export const PrescriptionSpecificLoading: Story = {
  render: () => <PrescriptionLoading />,
};

export const LabResultSpecificLoading: Story = {
  render: () => <LabResultLoading />,
};
