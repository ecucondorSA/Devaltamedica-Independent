
import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { FormError } from './FormError';

const meta: Meta<typeof FormError> = {
  title: 'Forms/FormError',
  component: FormError,
  argTypes: {
    message: {
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
    critical: {
      control: 'boolean',
    },
  },
  args: {
    message: 'This is a validation error.',
    errorType: 'validation',
    critical: false,
  },
};

export default meta;

type Story = StoryObj<typeof FormError>;

export const Default: Story = {
  render: (args) => <FormError {...args} />,
};

export const MultipleErrors: Story = {
  args: {
    message: null,
    errors: [
      'The email address is already in use.',
      'The password must be at least 12 characters long.',
      'The password must contain at least one number and one special character.',
    ],
  },
};

export const MedicalError: Story = {
  args: {
    message: 'The patient ID is not valid.',
    errorType: 'medical',
  },
};

export const SystemError: Story = {
  args: {
    message: 'The server could not be reached.',
    errorType: 'system',
  },
};

export const SecurityError: Story = {
  args: {
    message: 'Your session has expired. Please log in again.',
    errorType: 'security',
  },
};

export const NetworkError: Story = {
  args: {
    message: 'Please check your internet connection.',
    errorType: 'network',
  },
};

export const CriticalError: Story = {
  args: {
    message: 'This is a critical error that requires immediate attention.',
    critical: true,
  },
};
