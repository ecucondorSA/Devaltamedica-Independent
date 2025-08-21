import type { Meta, StoryObj } from '@storybook/react';
import { HealthMetricCard } from './HealthMetricCard';
import { within, userEvent } from '@storybook/testing-library';
import { expect } from '@storybook/jest';

const meta = {
  title: 'Medical/HealthMetricCard',
  component: HealthMetricCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Tarjeta de métrica de salud que muestra indicadores vitales, tendencias y alertas médicas. Incluye visualizaciones de datos y análisis de IA.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    metricType: {
      control: 'select',
      options: ['blood_pressure', 'heart_rate', 'weight', 'glucose', 'temperature', 'oxygen_saturation', 'steps', 'sleep', 'mood'],
      description: 'Tipo de métrica de salud'
    },
    status: {
      control: 'select',
      options: ['normal', 'warning', 'critical', 'improving', 'declining'],
      description: 'Estado de la métrica'
    },
    timeRange: {
      control: 'select',
      options: ['24h', '7d', '30d', '90d', '1y'],
      description: 'Rango de tiempo para visualización'
    }
  }
} satisfies Meta<typeof HealthMetricCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Base metric data
const baseMetric = {
  id: 'metric-1',
  title: 'Presión Arterial',
  value: '120/80',
  unit: 'mmHg',
  lastUpdated: new Date('2024-08-10T08:30:00'),
  trend: 'stable' as const
};

export const BloodPressureNormal: Story = {
  args: {
    ...baseMetric,
    metricType: 'blood_pressure',
    status: 'normal',
    currentValue: { systolic: 120, diastolic: 80 },
    normalRange: { min: { systolic: 90, diastolic: 60 }, max: { systolic: 130, diastolic: 85 } },
    historicalData: [
      { date: '2024-08-01', systolic: 118, diastolic: 78 },
      { date: '2024-08-02', systolic: 122, diastolic: 82 },
      { date: '2024-08-03', systolic: 120, diastolic: 80 },
      { date: '2024-08-04', systolic: 125, diastolic: 85 },
      { date: '2024-08-05', systolic: 119, diastolic: 79 }
    ]
  }
};

export const BloodPressureHigh: Story = {
  args: {
    ...baseMetric,
    metricType: 'blood_pressure',
    status: 'warning',
    value: '150/95',
    currentValue: { systolic: 150, diastolic: 95 },
    normalRange: { min: { systolic: 90, diastolic: 60 }, max: { systolic: 130, diastolic: 85 } },
    alert: {
      type: 'warning',
      message: 'Presión arterial elevada. Consulte con su médico.',
      severity: 'medium'
    },
    recommendations: [
      'Reducir el consumo de sal',
      'Aumentar actividad física',
      'Monitorear diariamente'
    ]
  }
};

export const BloodPressureCritical: Story = {
  args: {
    ...baseMetric,
    metricType: 'blood_pressure',
    status: 'critical',
    value: '180/110',
    currentValue: { systolic: 180, diastolic: 110 },
    normalRange: { min: { systolic: 90, diastolic: 60 }, max: { systolic: 130, diastolic: 85 } },
    alert: {
      type: 'critical',
      message: '¡Crisis hipertensiva! Busque atención médica inmediata.',
      severity: 'high',
      requiresAction: true
    },
    emergencyActions: [
      'Llamar al 911',
      'Ir a emergencias',
      'No tomar medicamentos adicionales sin supervisión'
    ]
  }
};

export const HeartRateNormal: Story = {
  args: {
    id: 'heart-rate-1',
    title: 'Frecuencia Cardíaca',
    metricType: 'heart_rate',
    value: '72',
    unit: 'bpm',
    status: 'normal',
    currentValue: 72,
    normalRange: { min: 60, max: 100 },
    trend: 'stable',
    historicalData: [
      { date: '2024-08-10T06:00', value: 68, context: 'reposo' },
      { date: '2024-08-10T12:00', value: 85, context: 'después de caminar' },
      { date: '2024-08-10T18:00', value: 72, context: 'reposo' }
    ],
    insights: [
      'Frecuencia cardíaca en reposo excelente',
      'Variabilidad normal durante el día'
    ]
  }
};

export const WeightTrending: Story = {
  args: {
    id: 'weight-1',
    title: 'Peso Corporal',
    metricType: 'weight',
    value: '68.5',
    unit: 'kg',
    status: 'improving',
    currentValue: 68.5,
    targetValue: 65,
    trend: 'declining',
    change: { value: -2.3, period: '30d', percentage: -3.2 },
    historicalData: [
      { date: '2024-07-10', value: 70.8 },
      { date: '2024-07-17', value: 70.2 },
      { date: '2024-07-24', value: 69.5 },
      { date: '2024-07-31', value: 68.9 },
      { date: '2024-08-07', value: 68.5 }
    ],
    goals: {
      target: 65,
      timeframe: '3 meses',
      progress: 76 // percentage
    }
  }
};

export const GlucosePreDiabetic: Story = {
  args: {
    id: 'glucose-1',
    title: 'Glucosa en Sangre',
    metricType: 'glucose',
    value: '110',
    unit: 'mg/dL',
    status: 'warning',
    currentValue: 110,
    normalRange: { min: 70, max: 100 },
    measurementType: 'fasting',
    trend: 'rising',
    alert: {
      type: 'warning',
      message: 'Niveles de glucosa elevados - Riesgo de prediabetes',
      severity: 'medium'
    },
    historicalData: [
      { date: '2024-08-01', value: 95, type: 'fasting' },
      { date: '2024-08-03', value: 102, type: 'fasting' },
      { date: '2024-08-05', value: 108, type: 'fasting' },
      { date: '2024-08-07', value: 110, type: 'fasting' }
    ],
    recommendations: [
      'Reducir carbohidratos simples',
      'Aumentar fibra en la dieta',
      'Ejercicio regular post-comidas',
      'Consultar endocrinólogo'
    ]
  }
};

export const TemperatureFever: Story = {
  args: {
    id: 'temp-1',
    title: 'Temperatura Corporal',
    metricType: 'temperature',
    value: '38.2',
    unit: '°C',
    status: 'warning',
    currentValue: 38.2,
    normalRange: { min: 36.1, max: 37.2 },
    trend: 'rising',
    alert: {
      type: 'warning',
      message: 'Fiebre detectada. Monitorear síntomas.',
      severity: 'medium'
    },
    symptoms: ['Dolor de cabeza', 'Fatiga', 'Escalofríos'],
    recommendations: [
      'Mantenerse hidratado',
      'Descansar',
      'Paracetamol si es necesario',
      'Consultar médico si persiste >3 días'
    ]
  }
};

export const OxygenSaturationLow: Story = {
  args: {
    id: 'o2-1',
    title: 'Saturación de Oxígeno',
    metricType: 'oxygen_saturation',
    value: '92',
    unit: '%',
    status: 'critical',
    currentValue: 92,
    normalRange: { min: 95, max: 100 },
    trend: 'declining',
    alert: {
      type: 'critical',
      message: '¡Saturación de oxígeno baja! Busque atención médica.',
      severity: 'high',
      requiresAction: true
    },
    emergencyActions: [
      'Llamar emergencias inmediatamente',
      'Sentarse erguido',
      'Respirar lenta y profundamente'
    ]
  }
};

export const StepsGoal: Story = {
  args: {
    id: 'steps-1',
    title: 'Pasos Diarios',
    metricType: 'steps',
    value: '8,547',
    unit: 'pasos',
    status: 'improving',
    currentValue: 8547,
    targetValue: 10000,
    trend: 'rising',
    goals: {
      target: 10000,
      progress: 85.47,
      streak: 12 // días consecutivos
    },
    historicalData: [
      { date: '2024-08-01', value: 6200 },
      { date: '2024-08-02', value: 7800 },
      { date: '2024-08-03', value: 9200 },
      { date: '2024-08-04', value: 8100 },
      { date: '2024-08-05', value: 8547 }
    ],
    achievements: [
      'Meta semanal alcanzada',
      '12 días consecutivos activos'
    ]
  }
};

export const SleepQuality: Story = {
  args: {
    id: 'sleep-1',
    title: 'Calidad del Sueño',
    metricType: 'sleep',
    value: '7h 23m',
    unit: 'horas',
    status: 'normal',
    currentValue: 7.38,
    targetValue: 8,
    sleepData: {
      bedtime: '23:15',
      wakeTime: '06:38',
      deepSleep: 1.5,
      remSleep: 1.8,
      lightSleep: 4.03,
      awakeTime: 0.05,
      sleepEfficiency: 94
    },
    sleepScore: 82,
    insights: [
      'Duración de sueño adecuada',
      'Excelente eficiencia del sueño',
      'Considere acostarse 30 min antes'
    ]
  }
};

export const MoodTracking: Story = {
  args: {
    id: 'mood-1',
    title: 'Estado de Ánimo',
    metricType: 'mood',
    value: '7/10',
    unit: 'puntos',
    status: 'normal',
    currentValue: 7,
    moodData: {
      energy: 6,
      stress: 4,
      anxiety: 3,
      happiness: 7,
      motivation: 6
    },
    moodFactors: [
      'Buen día de trabajo',
      'Ejercicio matutino',
      'Llamada con familia'
    ],
    recommendations: [
      'Continuar rutina de ejercicio',
      'Practicar meditación',
      'Mantener contacto social'
    ]
  }
};

export const WithChart: Story = {
  args: {
    ...BloodPressureNormal.args,
    showChart: true,
    chartType: 'line',
    timeRange: '7d'
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Verify chart is rendered
    const chart = canvas.getByTestId('health-metric-chart');
    await expect(chart).toBeInTheDocument();
    
    // Test time range selector
    const timeRangeButton = canvas.getByText('7d');
    await userEvent.click(timeRangeButton);
  }
};

export const Loading: Story = {
  args: {
    ...baseMetric,
    metricType: 'blood_pressure',
    isLoading: true
  }
};

export const NoData: Story = {
  args: {
    ...baseMetric,
    metricType: 'blood_pressure',
    status: 'normal',
    value: '--',
    historicalData: [],
    noDataMessage: 'No hay datos disponibles. Conecte su dispositivo de monitoreo.'
  }
};

export const Interactive: Story = {
  args: {
    ...WeightTrending.args,
    interactive: true,
    actions: [
      { label: 'Añadir medición', action: 'add' },
      { label: 'Ver historial', action: 'history' },
      { label: 'Configurar meta', action: 'goal' }
    ]
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test interactive elements
    const addButton = canvas.getByText('Añadir medición');
    await expect(addButton).toBeInTheDocument();
    await userEvent.click(addButton);
  }
};

// Medical specialty specific stories
export const CardiacMonitoring: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <HealthMetricCard
        {...BloodPressureNormal.args}
        specialty="cardiology"
      />
      <HealthMetricCard
        {...HeartRateNormal.args}
        specialty="cardiology"
      />
      <HealthMetricCard
        id="ecg-1"
        title="ECG"
        metricType="ecg"
        value="Ritmo sinusal normal"
        status="normal"
        specialty="cardiology"
        lastEcg={{
          rhythm: 'sinus',
          rate: 72,
          interpretation: 'Normal'
        }}
      />
    </div>
  )
};

export const DiabetesManagement: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <HealthMetricCard
        {...GlucosePreDiabetic.args}
        specialty="endocrinology"
      />
      <HealthMetricCard
        id="hba1c-1"
        title="HbA1c"
        metricType="hba1c"
        value="6.2"
        unit="%"
        status="warning"
        currentValue={6.2}
        normalRange={{ min: 4, max: 5.6 }}
        specialty="endocrinology"
        alert={{
          type: 'warning',
          message: 'HbA1c elevada - Riesgo de diabetes',
          severity: 'medium'
        }}
      />
    </div>
  )
};

export const AccessibilityTest: Story = {
  args: {
    ...BloodPressureCritical.args,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test ARIA labels and roles
    const card = canvas.getByRole('region');
    await expect(card).toHaveAttribute('aria-label');
    
    // Test critical alert accessibility
    const alert = canvas.getByRole('alert');
    await expect(alert).toBeInTheDocument();
    
    // Test keyboard navigation
    const actionButton = canvas.getByRole('button', { name: /emergencia/i });
    actionButton.focus();
    await expect(actionButton).toHaveFocus();
  }
};