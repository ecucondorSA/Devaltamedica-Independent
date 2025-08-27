
import type { Meta, StoryObj } from '@storybook/react';
import { EmergencyButton } from './EmergencyButton';
import { userEvent, within } from '@storybook/testing-library';
import { expect } from '@storybook/jest';

const meta = {
  title: 'Emergency/EmergencyButton',
  component: EmergencyButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A button to activate an emergency protocol, with a confirmation dialog.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'The size of the button.'
    },
    variant: {
      control: 'select',
      options: ['default', 'floating'],
      description: 'The variant of the button.'
    },
    disabled: { control: 'boolean', description: 'Whether the button is disabled.' },
    showPulse: { control: 'boolean', description: 'Whether to show a pulse animation on the button.' },
  },
} satisfies Meta<typeof EmergencyButton>;

export default meta;
type Story = StoryObj<typeof meta>;

const onEmergencyActivate = async (type, notes) => {
  alert(`Emergency activated: ${type.label} - ${notes}`);
};

export const Default: Story = {
  args: {
    onEmergencyActivate,
  },
};

export const Floating: Story = {
  args: {
    onEmergencyActivate,
    variant: 'floating',
  },
};

export const Disabled: Story = {
  args: {
    onEmergencyActivate,
    disabled: true,
  },
};

export const ActivateCriticalEmergency: Story = {
  args: {
    onEmergencyActivate,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const emergencyButton = canvas.getByTestId('emergency-consultations');
    await userEvent.click(emergencyButton);

    const dialog = within(document.body);
    const criticalOption = await dialog.findByText('Paro Cardíaco');
    await userEvent.click(criticalOption);

    const activateButton = await dialog.findByText('Activar Emergencia');
    await userEvent.click(activateButton);

    const countdown = await dialog.findByText('3');
    await expect(countdown).toBeInTheDocument();
  },
};

export const ActivateNonCriticalEmergency: Story = {
    args: {
      onEmergencyActivate,
    },
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      const emergencyButton = canvas.getByTestId('emergency-consultations');
      await userEvent.click(emergencyButton);
  
      const dialog = within(document.body);
      const nonCriticalOption = await dialog.findByText('Otra Emergencia');
      await userEvent.click(nonCriticalOption);
  
      const activateButton = await dialog.findByText('Activar Emergencia');
      await userEvent.click(activateButton);
    },
  };
