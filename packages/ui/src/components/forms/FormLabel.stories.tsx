
import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { FormLabel } from './FormLabel';

const meta: Meta<typeof FormLabel> = {
  title: 'Forms/FormLabel',
  component: FormLabel,
  argTypes: {
    children: {
      control: 'text',
    },
    htmlFor: {
      control: 'text',
    },
    required: {
      control: 'boolean',
    },
    medicalValidation: {
      control: {
        type: 'select',
        options: ['patient-id', 'medical-record', 'prescription', 'diagnosis', 'standard'],
      },
    },
    helpText: {
      control: 'text',
    },
    size: {
      control: {
        type: 'radio',
        options: ['sm', 'md', 'lg'],
      },
    },
    state: {
      control: {
        type: 'select',
        options: ['normal', 'error', 'success', 'warning'],
      },
    },
  },
  args: {
    children: 'Nombre del Paciente',
    htmlFor: 'patient-name',
    required: false,
    medicalValidation: 'standard',
    helpText: 'Ingrese el nombre completo del paciente.',
    size: 'md',
    state: 'normal',
  },
};

export default meta;

type Story = StoryObj<typeof FormLabel>;

export const Default: Story = {
  render: (args) => <FormLabel {...args} />,
};

export const Required: Story = {
  args: {
    required: true,
  },
};

export const MedicalValidation: Story = {
  render: () => (
    <div className="space-y-4">
      <FormLabel htmlFor="patient-id" medicalValidation="patient-id">Patient ID</FormLabel>
      <FormLabel htmlFor="medical-record" medicalValidation="medical-record">Medical Record</FormLabel>
      <FormLabel htmlFor="prescription" medicalValidation="prescription">Prescription</FormLabel>
      <FormLabel htmlFor="diagnosis" medicalValidation="diagnosis">Diagnosis</FormLabel>
    </div>
  ),
};

export const WithHelpText: Story = {
  args: {
    helpText: 'This is a helpful message.',
  },
};

export const States: Story = {
  render: () => (
    <div className="space-y-4">
      <FormLabel htmlFor="normal-state" state="normal">Normal State</FormLabel>
      <FormLabel htmlFor="error-state" state="error">Error State</FormLabel>
      <FormLabel htmlFor="success-state" state="success">Success State</FormLabel>
      <FormLabel htmlFor="warning-state" state="warning">Warning State</FormLabel>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <FormLabel htmlFor="sm-size" size="sm">Small Label</FormLabel>
      <FormLabel htmlFor="md-size" size="md">Medium Label</FormLabel>
      <FormLabel htmlFor="lg-size" size="lg">Large Label</FormLabel>
    </div>
  ),
};
