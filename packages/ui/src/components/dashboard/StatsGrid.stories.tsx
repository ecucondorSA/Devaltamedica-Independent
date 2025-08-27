
import type { Meta, StoryObj } from '@storybook/react';
import { StatsGrid } from './StatsGrid';

const meta = {
  title: 'Dashboard/StatsGrid',
  component: StatsGrid,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A responsive grid for displaying multiple MetricCard components.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    columns: {
      control: 'select',
      options: [2, 3, 4],
      description: 'The number of columns in the grid.'
    },
  },
} satisfies Meta<typeof StatsGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseStats = [
  {
    title: 'Total Revenue',
    value: '$45,231.89',
    description: '+20.1% from last month',
    icon: <span>💵</span>,
  },
  {
    title: 'Subscriptions',
    value: '+2350',
    description: '+180.1% from last month',
    icon: <span>👥</span>,
  },
  {
    title: 'Sales',
    value: '+12,234',
    description: '+19% from last month',
    icon: <span>💳</span>,
  },
  {
    title: 'Active Now',
    value: '+573',
    description: '+201 since last hour',
    icon: <span>⚡️</span>,
  },
];

export const Default: Story = {
  args: {
    stats: baseStats,
  },
};

export const ThreeColumns: Story = {
  args: {
    stats: baseStats.slice(0, 3),
    columns: 3,
  },
};

export const TwoColumns: Story = {
  args: {
    stats: baseStats.slice(0, 2),
    columns: 2,
  },
};

export const WithMixedStatus: Story = {
  args: {
    stats: [
      {
        title: 'Appointments',
        value: '2,345',
        status: 'success',
        description: 'All appointments completed successfully.',
        icon: <span>✅</span>,
      },
      {
        title: 'Pending Lab Results',
        value: '45',
        status: 'warning',
        description: 'Results waiting for more than 24 hours.',
        icon: <span>⚠️</span>,
      },
      {
        title: 'Critical Alerts',
        value: '3',
        status: 'critical',
        description: 'Immediate attention required.',
        icon: <span>🔥</span>,
      },
      {
        title: 'Server Uptime',
        value: '99.9%',
        status: 'normal',
        description: 'Uptime over the last 7 days.',
        icon: <span>🖥️</span>,
      },
    ],
  },
};
