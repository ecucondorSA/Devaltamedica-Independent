
import type { Meta, StoryObj } from '@storybook/react';
import { MetricCard } from './MetricCard';
import { expect } from '@storybook/jest';
import { within, userEvent } from '@storybook/testing-library';

const meta = {
  title: 'Dashboard/MetricCard',
  component: MetricCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A card component for displaying a single metric, typically used in dashboards.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text', description: 'The main title of the metric card.' },
    value: { control: 'text', description: 'The primary value of the metric.' },
    description: { control: 'text', description: 'A short description or context for the metric.' },
    subtitle: { control: 'text', description: 'A smaller subtitle under the main title.' },
    icon: { control: false, description: 'An optional icon to display in the card header.' },
    status: {
      control: 'select',
      options: ['normal', 'success', 'warning', 'critical'],
      description: 'The status of the metric, affects the styling.'
    },
    realTimeUpdate: { control: 'boolean', description: 'Indicates if the metric updates in real-time.' },
  },
} satisfies Meta<typeof MetricCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Total Patients',
    value: '1,250',
    description: 'All active patients in the system.',
  },
};

export const WithTrend: Story = {
  args: {
    title: 'Monthly Active Users',
    value: '15,000',
    description: 'Users who logged in the last 30 days.',
    trend: {
      value: 5.2,
      isPositive: true,
      label: 'from last month',
    },
  },
};

export const NegativeTrend: Story = {
    args: {
      title: 'Avg. Response Time',
      value: '350ms',
      description: 'API response time p95.',
      trend: {
        value: 12,
        isPositive: false,
        label: 'slower than last week',
      },
    },
  };

export const WithIcon: Story = {
  args: {
    title: 'Appointments Today',
    value: '72',
    description: 'Scheduled and completed appointments.',
    icon: <span>📅</span>,
  },
};

export const MedicalContext: Story = {
    args: {
      title: 'Live Consultations',
      value: '28',
      description: 'Ongoing telemedicine sessions.',
      icon: <span>📹</span>,
      medicalContext: {
        isEmergency: false,
        hipaaCompliant: true,
        lastUpdated: new Date(),
      },
      realTimeUpdate: true,
    },
  };

export const CriticalStatus: Story = {
    args: {
      title: 'System Errors',
      value: '5',
      description: 'Critical errors in the last hour.',
      icon: <span>🔥</span>,
      status: 'critical',
      trend: {
        value: 25,
        isPositive: false, // in this context, an increase is negative
        label: 'increase from last hour',
      },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const card = canvas.getByRole('article');
        await expect(card).toHaveClass('border-red-500');
    }
};

export const SuccessStatus: Story = {
    args: {
      title: 'Uptime',
      value: '99.99%',
      description: 'System uptime over the last 24 hours.',
      icon: <span>✅</span>,
      status: 'success',
    },
};
