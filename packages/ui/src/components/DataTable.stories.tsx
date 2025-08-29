
import type { Meta, StoryObj } from '@storybook/react';
import { DataTable } from '../data-table';
import { columns } from './data-table/columns';
import { payments } from './data-table/data';

const meta: Meta<typeof DataTable> = {
    title: 'UI/DataTable',
    component: DataTable,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DataTable>;

export const Default: Story = {
    render: (args) => (
        <DataTable {...args} />
    ),
    args: {
        columns: columns,
        data: payments,
    },
};
