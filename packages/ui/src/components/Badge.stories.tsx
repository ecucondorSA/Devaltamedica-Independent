import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';

const meta = {
  title: 'Components/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline', 'success', 'warning', 'info', 'emergency'],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Badge',
  },
};

export const Variants: Story = {
  render: () => (
    <div className="flex gap-2 flex-wrap">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="info">Info</Badge>
      <Badge variant="emergency">Emergency</Badge>
    </div>
  ),
};

export const MedicalStatuses: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 flex-wrap">
        <Badge variant="success">Recovered</Badge>
        <Badge variant="warning">In Treatment</Badge>
        <Badge variant="emergency">Critical</Badge>
        <Badge variant="info">Scheduled</Badge>
      </div>
    </div>
  ),
};

export const AppointmentStatuses: Story = {
  render: () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Appointment Statuses</h3>
      <div className="flex gap-2 flex-wrap">
        <Badge variant="success">Confirmed</Badge>
        <Badge variant="warning">Pending</Badge>
        <Badge variant="destructive">Cancelled</Badge>
        <Badge variant="info">Rescheduled</Badge>
        <Badge variant="secondary">Completed</Badge>
      </div>
    </div>
  ),
};

export const DoctorAvailability: Story = {
  render: () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Doctor Availability</h3>
      <div className="flex gap-2 flex-wrap">
        <Badge variant="success">Available</Badge>
        <Badge variant="warning">Busy</Badge>
        <Badge variant="destructive">Off Duty</Badge>
        <Badge variant="info">On Call</Badge>
        <Badge variant="emergency">Emergency Only</Badge>
      </div>
    </div>
  ),
};