
import type { Meta, StoryObj } from '@storybook/react';
import { Calendar } from '../calendar';

const meta: Meta<typeof Calendar> = {
  title: 'UI/Calendar',
  component: Calendar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Calendar>;

export const Default: Story = {
  render: (args) => (
    <Calendar {...args}>
      <div>This is a placeholder for the calendar.</div>
    </Calendar>
  ),
};
