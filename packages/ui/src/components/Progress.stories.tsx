import type { Meta, StoryObj } from '@storybook/react';
import { Progress } from './Progress';

const meta: Meta<typeof Progress> = {
  title: 'Components/Progress',
  component: Progress,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Un componente de progreso accesible y customizable para mostrar el avance de tareas, formularios médicos, o cualquier proceso.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Valor actual del progreso',
    },
    max: {
      control: { type: 'number' },
      description: 'Valor máximo del progreso',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Tamaño de la barra de progreso',
    },
    variant: {
      control: { type: 'select' },
      options: ['default', 'success', 'warning', 'danger'],
      description: 'Variante de color del progreso',
    },
    showLabel: {
      control: { type: 'boolean' },
      description: 'Mostrar etiqueta con porcentaje y valores',
    },
    label: {
      control: { type: 'text' },
      description: 'Etiqueta personalizada para el progreso',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Historia básica
export const Default: Story = {
  args: {
    value: 60,
    max: 100,
  },
};

// Con etiqueta
export const WithLabel: Story = {
  args: {
    value: 45,
    max: 100,
    showLabel: true,
  },
};

// Con etiqueta personalizada
export const WithCustomLabel: Story = {
  args: {
    value: 75,
    max: 100,
    label: 'Completando evaluación médica...',
    showLabel: true,
  },
};

// Diferentes tamaños
export const Sizes: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-2">Small</h3>
        <Progress value={30} size="sm" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Medium (Default)</h3>
        <Progress value={60} size="md" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Large</h3>
        <Progress value={90} size="lg" />
      </div>
    </div>
  ),
};

// Diferentes variantes
export const Variants: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-2">Default</h3>
        <Progress value={50} variant="default" showLabel />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Success</h3>
        <Progress value={100} variant="success" showLabel />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Warning</h3>
        <Progress value={75} variant="warning" showLabel />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Danger</h3>
        <Progress value={25} variant="danger" showLabel />
      </div>
    </div>
  ),
};

// Casos médicos específicos
export const MedicalUseCases: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-2">Diagnóstico en Progreso</h3>
        <Progress 
          value={4} 
          max={10} 
          variant="default" 
          label="4 de 10 preguntas completadas"
          showLabel
        />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Examen Médico Completado</h3>
        <Progress 
          value={100} 
          variant="success" 
          label="Evaluación completa"
          showLabel
        />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Nivel de Riesgo</h3>
        <Progress 
          value={85} 
          variant="warning" 
          label="Riesgo moderado-alto"
          showLabel
        />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Carga de Resultados</h3>
        <Progress 
          value={65} 
          variant="default" 
          label="Procesando análisis de laboratorio..."
        />
      </div>
    </div>
  ),
};

// Progress animado (simulado)
export const Animated: Story = {
  render: () => {
    const [progress, setProgress] = React.useState(0);

    React.useEffect(() => {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            return 0;
          }
          return prev + 1;
        });
      }, 100);

      return () => clearInterval(interval);
    }, []);

    return (
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Progreso Animado</h3>
        <Progress 
          value={progress} 
          variant="default" 
          showLabel 
          label="Subiendo archivo médico..."
        />
      </div>
    );
  },
};

// Estados de progreso médico típicos
export const MedicalProgressStates: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Estados de Evaluación Médica</h3>
        
        <div className="space-y-3">
          <div>
            <Progress 
              value={0} 
              variant="default" 
              label="Iniciando evaluación..." 
            />
          </div>
          
          <div>
            <Progress 
              value={25} 
              variant="default" 
              label="Recopilando síntomas..." 
              showLabel
            />
          </div>
          
          <div>
            <Progress 
              value={50} 
              variant="default" 
              label="Analizando patrones..." 
              showLabel
            />
          </div>
          
          <div>
            <Progress 
              value={75} 
              variant="warning" 
              label="Verificando diagnósticos..." 
              showLabel
            />
          </div>
          
          <div>
            <Progress 
              value={100} 
              variant="success" 
              label="Evaluación completada" 
              showLabel
            />
          </div>
        </div>
      </div>
    </div>
  ),
};