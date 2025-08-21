import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link', 'medical', 'emergency'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon', 'xs'],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Button',
  },
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4 flex-wrap">
        <Button variant="default">Default</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>
      <div className="flex gap-4 flex-wrap">
        <Button variant="medical">Medical</Button>
        <Button variant="emergency">Emergency</Button>
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex gap-4 items-center">
      <Button size="xs">Extra Small</Button>
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">🏥</Button>
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button disabled>
        <span className="animate-spin mr-2">⏳</span>
        Loading...
      </Button>
      <Button variant="medical" disabled>
        <span className="animate-spin mr-2">⏳</span>
        Saving Patient Data...
      </Button>
    </div>
  ),
};

export const MedicalUseCases: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Appointment Actions</h3>
        <div className="flex gap-2">
          <Button variant="medical">Schedule Appointment</Button>
          <Button variant="secondary">Reschedule</Button>
          <Button variant="destructive">Cancel</Button>
        </div>
      </div>
      <div className="p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Emergency Actions</h3>
        <div className="flex gap-2">
          <Button variant="emergency">Call Emergency</Button>
          <Button variant="emergency" size="lg">🚨 Emergency Alert</Button>
        </div>
      </div>
    </div>
  ),
};