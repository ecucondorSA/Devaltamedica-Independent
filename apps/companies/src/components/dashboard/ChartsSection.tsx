import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@altamedica/ui';

// Placeholder para futura implementación con Chart.js
export function ChartsSection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Ingresos vs Gastos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500 mb-2">Gráfico de líneas</p>
              <p className="text-xs text-gray-400">Implementación con Chart.js pendiente</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Distribución por Departamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500 mb-2">Gráfico de torta</p>
              <p className="text-xs text-gray-400">Implementación con Chart.js pendiente</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Ejemplo de implementación futura con Chart.js (comentado)
/*
import { Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export function ChartsSection({ chartData, departmentData }) {
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  const lineData = {
    labels: chartData.map(d => d.month),
    datasets: [
      {
        label: 'Ingresos',
        data: chartData.map(d => d.revenue),
        borderColor: '#10b981',
        backgroundColor: '#10b98133',
      },
      {
        label: 'Gastos',
        data: chartData.map(d => d.expenses),
        borderColor: '#ef4444',
        backgroundColor: '#ef444433',
      },
    ],
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Ingresos vs Gastos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Line options={lineOptions} data={lineData} />
          </div>
        </CardContent>
      </Card>
      // ... resto del componente
    </div>
  );
}
*/