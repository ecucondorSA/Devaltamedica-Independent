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
      options: [
        'default',
        'destructive',
        'outline',
        'secondary',
        'ghost',
        'link',
        'medical',
        'emergency',
        'argentina',
      ],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon', 'xs', 'xl'],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Default Button',
    variant: 'default',
    size: 'default',
  },
};

export const AllVariants: Story = {
  name: 'All Variants',
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      <Button variant="default">Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <Button variant="medical">Medical</Button>
      <Button variant="emergency">Emergency</Button>
      <Button variant="argentina">Argentina</Button>
    </div>
  ),
};

export const AllSizes: Story = {
  name: 'All Sizes',
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="xs">Extra Small</Button>
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
      <Button size="icon">🏥</Button>
    </div>
  ),
};

export const DisabledStates: Story = {
  name: 'Disabled States',
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      <Button variant="default" disabled>
        Default
      </Button>
      <Button variant="destructive" disabled>
        Destructive
      </Button>
      <Button variant="outline" disabled>
        Outline
      </Button>
      <Button variant="secondary" disabled>
        Secondary
      </Button>
      <Button variant="ghost" disabled>
        Ghost
      </Button>
      <Button variant="link" disabled>
        Link
      </Button>
      <Button variant="medical" disabled>
        Medical
      </Button>
      <Button variant="emergency" disabled>
        Emergency
      </Button>
      <Button variant="argentina" disabled>
        Argentina
      </Button>
    </div>
  ),
};

export const LoadingState: Story = {
  name: 'Loading State',
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button disabled>
        <span className="animate-spin mr-2">⏳</span>
        Processing...
      </Button>
      <Button variant="medical" disabled>
        <span className="animate-spin mr-2">⏳</span>
        Saving Patient Data...
      </Button>
      <Button variant="destructive" size="sm" disabled>
        <span className="animate-spin mr-2">⏳</span>
        Deleting...
      </Button>
    </div>
  ),
};

export const WithIcon: Story = {
  name: 'With Icon',
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button>
        <span className="mr-2">🏥</span>
        Medical Center
      </Button>
      <Button variant="outline">
        <span className="mr-2">📄</span>
        View Report
      </Button>
      <Button variant="secondary" size="lg">
        <span className="mr-2">⚙️</span>
        Settings
      </Button>
    </div>
  ),
};

export const AsChild: Story = {
  name: 'As a Child Component',
  render: () => (
    <Button asChild>
      <a href="#">I am a link</a>
    </Button>
  ),
};

export const MedicalUseCases: Story = {
  name: 'Medical Use Cases',
  render: () => (
    <div className="flex flex-col gap-4 p-4 border rounded-lg bg-white">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-neutral-800">Appointment Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="medical">Schedule Appointment</Button>
          <Button variant="secondary">Reschedule</Button>
          <Button variant="destructive">Cancel</Button>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-4 text-neutral-800">Emergency Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="emergency" size="lg">
            <span className="mr-2 text-xl">🚨</span>
            Emergency Alert
          </Button>
          <Button variant="outline">Contact Support</Button>
        </div>
      </div>
    </div>
  ),
};
