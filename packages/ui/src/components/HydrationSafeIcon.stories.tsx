import type { Meta, StoryObj } from '@storybook/react';
import { HydrationSafeIcon } from './HydrationSafeIcon';
import { Home } from 'lucide-react';

const meta = {
  title: 'Components/HydrationSafeIcon',
  component: HydrationSafeIcon,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    icon: {
      control: 'select',
      options: ['Home', 'User', 'Settings'], // Ejemplo de iconos
      mapping: {
        Home: Home,
        // Añadir más mapeos si es necesario
      },
    },
    className: { control: 'text' },
  },
} satisfies Meta<typeof HydrationSafeIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    icon: Home,
    className: 'w-6 h-6 text-blue-500',
  },
};

export const LargeRed: Story = {
  args: {
    icon: Home,
    className: 'w-12 h-12 text-red-500',
  },
};
