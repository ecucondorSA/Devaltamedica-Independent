
import type { Meta, StoryObj } from '@storybook/react';
import { Alert, AlertTitle, AlertDescription } from './alert';

const meta: Meta<typeof Alert> = {
  title: 'UI/Alert',
  component: Alert,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Default: Story = {
  render: (args) => (
    <Alert {...args}>
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        You can add components to your app using the cli.
      </AlertDescription>
    </Alert>
  ),
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
  },
  render: (args) => (
    <Alert {...args}>
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        Your session has expired. Please log in again.
      </AlertDescription>
    </Alert>
  ),
};

export const Success: Story = {
    args: {
      variant: 'success',
    },
    render: (args) => (
      <Alert {...args}>
        <AlertTitle>Success</AlertTitle>
        <AlertDescription>
          Your profile has been updated successfully.
        </AlertDescription>
      </Alert>
    ),
  };

  export const Warning: Story = {
    args: {
      variant: 'warning',
    },
    render: (args) => (
      <Alert {...args}>
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>
          Your subscription is about to expire.
        </AlertDescription>
      </Alert>
    ),
  };
