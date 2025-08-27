
import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { StatusBadge, StatusType } from './StatusBadge';

const meta: Meta<typeof StatusBadge> = {
  title: 'Medical/StatusBadge',
  component: StatusBadge,
  argTypes: {
    status: {
      control: {
        type: 'select',
        options: [
          'confirmed', 'scheduled', 'completed', 'cancelled', 'active', 'inactive', 'pending',
          'approved', 'rejected', 'success', 'warning', 'error', 'info', 'in_progress',
          'no_show', 'rescheduled', 'critical', 'stable', 'improving', 'emergency'
        ],
      },
    },
    size: {
      control: {
        type: 'radio',
        options: ['sm', 'md', 'lg'],
      },
    },
    showIcon: {
      control: 'boolean',
    },
    animate: {
      control: 'boolean',
    },
  },
  args: {
    status: 'confirmed',
    size: 'md',
    showIcon: true,
    animate: false,
  },
};

export default meta;

type Story = StoryObj<typeof StatusBadge>;

export const Default: Story = {
  render: (args) => <StatusBadge {...args} />,
};

export const AllStatuses: Story = {
  render: () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        'confirmed', 'scheduled', 'completed', 'cancelled', 'active', 'inactive', 'pending',
        'approved', 'rejected', 'success', 'warning', 'error', 'info', 'in_progress',
        'no_show', 'rescheduled', 'critical', 'stable', 'improving', 'emergency'
      ].map((status) => (
        <StatusBadge key={status} status={status as StatusType} />
      ))}
    </div>
  ),
};

export const WithoutIcon: Story = {
  args: {
    showIcon: false,
  },
};

export const Animated: Story = {
  args: {
    status: 'critical',
    animate: true,
  },
};

export const CustomText: Story = {
  args: {
    status: 'info',
    text: 'Custom Information',
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center space-x-4">
      <StatusBadge status="stable" size="sm" />
      <StatusBadge status="stable" size="md" />
      <StatusBadge status="stable" size="lg" />
    </div>
  ),
};
