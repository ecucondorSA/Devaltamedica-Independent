
import { Payment } from './columns';

export const payments: Payment[] = [
    {
        id: '1',
        amount: 100,
        status: 'success',
        email: 'test@example.com',
    },
    {
        id: '2',
        amount: 200,
        status: 'pending',
        email: 'test2@example.com',
    },
    {
        id: '3',
        amount: 300,
        status: 'failed',
        email: 'test3@example.com',
    },
];
