import type { Meta, StoryObj } from '@storybook/react';
import { Separator } from './Separator';

const meta = {
  title: 'Components/Separator',
  component: Separator,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
    decorative: { control: 'boolean' },
  },
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  args: {
    orientation: 'horizontal',
    className: 'w-64',
  },
};

export const Vertical: Story = {
  args: {
    orientation: 'vertical',
    className: 'h-32',
  },
};

export const WithText: Story = {
  render: (args) => (
    <div className="flex items-center w-96">
      <Separator {...args} />
      <span className="px-4 text-sm text-gray-500">OR</span>
      <Separator {...args} />
    </div>
  ),
  args: {
    orientation: 'horizontal',
  },
};
