'use client';

import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@altamedica/ui';
import { Download, FileText } from 'lucide-react';

interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: 'Pagado' | 'Pendiente' | 'Vencido';
}

interface InvoicesTableProps {
  invoices: Invoice[];
}

export function InvoicesTable({ invoices }: InvoicesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Factura ID</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead>Monto</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell>{invoice.id}</TableCell>
            <TableCell>{invoice.date}</TableCell>
            <TableCell>{invoice.amount}</TableCell>
            <TableCell>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  invoice.status === 'Pagado'
                    ? 'bg-green-100 text-green-800'
                    : invoice.status === 'Pendiente'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {invoice.status}
              </span>
            </TableCell>
            <TableCell>
              <Button variant="outline" size="sm" className="mr-2">
                <FileText className="h-4 w-4 mr-2" />
                Ver
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Descargar
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
