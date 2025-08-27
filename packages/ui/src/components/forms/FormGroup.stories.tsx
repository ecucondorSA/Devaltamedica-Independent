
import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { FormGroup } from './FormGroup';
import { Input } from '../Input';

const meta: Meta<typeof FormGroup> = {
  title: 'Forms/FormGroup',
  component: FormGroup,
  argTypes: {
    label: {
      control: 'text',
    },
    id: {
      control: 'text',
    },
    required: {
      control: 'boolean',
    },
    helpText: {
      control: 'text',
    },
    error: {
      control: 'text',
    },
    errors: {
      control: 'object',
    },
    errorType: {
      control: {
        type: 'select',
        options: ['validation', 'medical', 'system', 'security', 'network'],
      },
    },
    criticalError: {
      control: 'boolean',
    },
    medicalValidation: {
      control: {
        type: 'select',
        options: ['patient-id', 'medical-record', 'prescription', 'diagnosis', 'standard'],
      },
    },
    spacing: {
      control: {
        type: 'radio',
        options: ['compact', 'normal', 'relaxed'],
      },
    },
    layout: {
      control: {
        type: 'radio',
        options: ['vertical', 'horizontal'],
      },
    },
  },
  args: {
    label: 'Patient Name',
    id: 'patient-name',
    required: false,
    helpText: 'Please enter the full name of the patient.',
    error: '',
    errors: [],
    errorType: 'validation',
    criticalError: false,
    medicalValidation: 'standard',
    spacing: 'normal',
    layout: 'vertical',
  },
};

export default meta;

type Story = StoryObj<typeof FormGroup>;

export const Default: Story = {
  render: (args) => (
    <FormGroup {...args}>
      <Input id={args.id} />
    </FormGroup>
  ),
};

export const WithError: Story = {
  args: {
    error: 'This field is required.',
  },
  render: (args) => (
    <FormGroup {...args}>
      <Input id={args.id} />
    </FormGroup>
  ),
};

export const HorizontalLayout: Story = {
  args: {
    layout: 'horizontal',
  },
  render: (args) => (
    <FormGroup {...args}>
      <Input id={args.id} />
    </FormGroup>
  ),
};

export const MedicalValidation: Story = {
  args: {
    medicalValidation: 'patient-id',
  },
  render: (args) => (
    <FormGroup {...args}>
      <Input id={args.id} />
    </FormGroup>
  ),
};
