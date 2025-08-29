
import type { Meta, StoryObj } from '@storybook/react';
import { EmergencyBanner } from './EmergencyBanner';
import { userEvent, within } from '@storybook/testing-library';
import { expect } from '@storybook/jest';

const meta = {
  title: 'Emergency/EmergencyBanner',
  component: EmergencyBanner,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A prominent banner for displaying emergency medical alerts.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['critical', 'urgent', 'warning'],
      description: 'The type of emergency, affects styling and icon.'
    },
    title: { control: 'text', description: 'The title of the emergency alert.' },
    message: { control: 'text', description: 'The message of the emergency alert.' },
    emergencyNumber: { control: 'text', description: 'The emergency number to call.' },
    autoHide: { control: 'boolean', description: 'Whether the banner should hide automatically.' },
    autoHideDelay: { control: 'number', description: 'The delay in milliseconds before auto-hiding.' },
    sound: { control: 'boolean', description: 'Whether to play a sound on critical alerts.' },
  },
} satisfies Meta<typeof EmergencyBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Critical: Story = {
  args: {
    type: 'critical',
    title: 'Critical Medical Emergency',
    message: 'Patient John Doe is experiencing a cardiac arrest. Immediate action required.',
    onDismiss: () => alert('Banner dismissed'),
    onEmergencyCall: () => alert('Calling emergency number'),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const callButton = canvas.getByTestId('emergency-call-button');
    await expect(callButton).toBeInTheDocument();
    await userEvent.click(callButton);
  },
};

export const Urgent: Story = {
  args: {
    type: 'urgent',
    title: 'Urgent Medical Attention Needed',
    message: 'Patient Jane Smith reports severe chest pain.',
    onDismiss: () => alert('Banner dismissed'),
  },
};

export const Warning: Story = {
  args: {
    type: 'warning',
    title: 'System Maintenance',
    message: 'The system will be down for maintenance in 1 hour.',
    onDismiss: () => alert('Banner dismissed'),
  },
};

export const AutoHide: Story = {
  args: {
    type: 'warning',
    title: 'Session Timeout',
    message: 'Your session will expire in 5 minutes due to inactivity.',
    autoHide: true,
    autoHideDelay: 5000,
    onDismiss: () => alert('Banner dismissed'),
  },
};
