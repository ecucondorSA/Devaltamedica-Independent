import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@altamedica/ui';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
  patients: number;
  appointments: number;
}

const mockChartData: ChartData[] = [
  { month: 'Ene', revenue: 150000, expenses: 100000, profit: 50000, patients: 2100, appointments: 750 },
  { month: 'Feb', revenue: 165000, expenses: 105000, profit: 60000, patients: 2250, appointments: 820 },
  { month: 'Mar', revenue: 170000, expenses: 110000, profit: 60000, patients: 2400, appointments: 845 },
  { month: 'Abr', revenue: 180000, expenses: 115000, profit: 65000, patients: 2600, appointments: 880 },
  { month: 'May', revenue: 185000, expenses: 120000, profit: 65000, patients: 2847, appointments: 892 },
];

const departmentData = [
  { name: 'Cardiología', value: 25, color: '#0ea5e9' },
  { name: 'Neurología', value: 20, color: '#3b82f6' },
  { name: 'Pediatría', value: 30, color: '#8b5cf6' },
  { name: 'Emergencias', value: 15, color: '#ef4444' },
  { name: 'Otros', value: 10, color: '#6b7280' },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-ES', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function DashboardCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Ingresos vs Gastos</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" name="Ingresos" strokeWidth={2} />
              <Line type="monotone" dataKey="expenses" stroke="#ef4444" name="Gastos" strokeWidth={2} />
              <Line type="monotone" dataKey="profit" stroke="#3b82f6" name="Beneficio" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Distribución por Departamento</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={departmentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {departmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}