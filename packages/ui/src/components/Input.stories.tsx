import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

const meta = {
  title: 'Components/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'date', 'time'],
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Email Address',
    type: 'email',
    placeholder: 'john.doe@example.com',
  },
};

export const WithError: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: 'Enter password',
    error: 'Password must be at least 8 characters',
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Phone Number',
    type: 'tel',
    placeholder: '+1 (555) 000-0000',
    helperText: 'Include country code',
  },
};

export const MedicalForm: Story = {
  render: () => (
    <div className="space-y-4 w-[400px]">
      <Input
        label="Patient Name"
        placeholder="Enter full name"
        helperText="First and last name required"
      />
      <Input
        label="Date of Birth"
        type="date"
      />
      <Input
        label="Medical Record Number"
        placeholder="MRN-XXXXXX"
        helperText="6-digit medical record number"
      />
      <Input
        label="Emergency Contact"
        type="tel"
        placeholder="+1 (555) 000-0000"
      />
    </div>
  ),
};

export const AppointmentForm: Story = {
  render: () => (
    <div className="space-y-4 w-[400px]">
      <Input
        label="Appointment Date"
        type="date"
      />
      <Input
        label="Appointment Time"
        type="time"
      />
      <Input
        label="Reason for Visit"
        placeholder="Brief description of symptoms"
      />
      <Input
        label="Insurance ID"
        placeholder="INS-XXXXXXXXX"
        error="Invalid insurance ID format"
      />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="space-y-4 w-[400px]">
      <Input
        placeholder="Normal input"
      />
      <Input
        placeholder="Disabled input"
        disabled
      />
      <Input
        placeholder="Input with error"
        error="This field is required"
      />
      <Input
        placeholder="Read-only input"
        value="Read-only value"
        readOnly
      />
    </div>
  ),
};