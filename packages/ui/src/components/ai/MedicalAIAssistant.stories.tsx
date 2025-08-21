import type { Meta, StoryObj } from '@storybook/react';
import { MedicalAIAssistant } from './MedicalAIAssistant';
import { within, userEvent, waitFor } from '@storybook/testing-library';
import { expect } from '@storybook/jest';

const meta = {
  title: 'AI/MedicalAIAssistant',
  component: MedicalAIAssistant,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Asistente de IA médica avanzado con capacidades de análisis de síntomas, sugerencias diagnósticas y recomendaciones de tratamiento. Cumple con estándares HIPAA.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: 'select',
      options: ['symptom-analysis', 'diagnostic-support', 'treatment-planning', 'drug-interaction', 'emergency-triage'],
      description: 'Modo de operación del asistente'
    },
    specialty: {
      control: 'select',
      options: ['general_medicine', 'cardiology', 'dermatology', 'endocrinology', 'neurology', 'pediatrics', 'psychiatry'],
      description: 'Especialidad médica para contexto específico'
    },
    userRole: {
      control: 'select',
      options: ['doctor', 'nurse', 'patient', 'medical_student'],
      description: 'Rol del usuario para personalizar respuestas'
    }
  }
} satisfies Meta<typeof MedicalAIAssistant>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SymptomAnalysis: Story = {
  args: {
    mode: 'symptom-analysis',
    specialty: 'general_medicine',
    userRole: 'doctor',
    patientContext: {
      id: 'patient-123',
      age: 45,
      gender: 'female',
      medicalHistory: {
        chronicConditions: ['Hipertensión', 'Diabetes tipo 2'],
        medications: ['Metformina', 'Lisinopril'],
        allergies: ['Penicilina']
      }
    },
    initialPrompt: 'Analizar síntomas de dolor torácico y dificultad respiratoria en paciente de 45 años'
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test initial state
    const chatInput = canvas.getByPlaceholderText(/describe los síntomas/i);
    await expect(chatInput).toBeInTheDocument();
    
    // Test symptom input
    await userEvent.type(chatInput, 'Dolor torácico opresivo, dificultad para respirar, sudoración');
    const analyzeButton = canvas.getByRole('button', { name: /analizar síntomas/i });
    await userEvent.click(analyzeButton);
    
    // Verify analysis starts
    await waitFor(() => {
      expect(canvas.getByText(/analizando síntomas/i)).toBeInTheDocument();
    });
  }
};

export const EmergencyTriage: Story = {
  args: {
    mode: 'emergency-triage',
    specialty: 'general_medicine',
    userRole: 'nurse',
    emergencyLevel: 'high',
    patientContext: {
      id: 'emergency-456',
      age: 67,
      gender: 'male',
      vitalSigns: {
        bloodPressure: '180/110',
        heartRate: 95,
        temperature: 37.8,
        oxygenSaturation: 92
      }
    },
    urgentSymptoms: ['Dolor torácico severo', 'Dificultad respiratoria', 'Sudoración profusa']
  },
  decorators: [(Story) => (
    <div className="bg-red-50 min-h-screen p-4">
      <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-4">
        <h2 className="text-red-800 font-bold">🚨 MODO EMERGENCIA ACTIVADO</h2>
      </div>
      <Story />
    </div>
  )]
};

export const DrugInteractionChecker: Story = {
  args: {
    mode: 'drug-interaction',
    specialty: 'general_medicine',
    userRole: 'doctor',
    medications: [
      { name: 'Warfarina', dose: '5mg', frequency: 'diario' },
      { name: 'Aspirina', dose: '81mg', frequency: 'diario' },
      { name: 'Omeprazol', dose: '20mg', frequency: 'diario' }
    ],
    patientContext: {
      id: 'patient-789',
      age: 72,
      weight: 68,
      kidneyFunction: 'reducida'
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test interaction checking
    const checkButton = canvas.getByRole('button', { name: /verificar interacciones/i });
    await userEvent.click(checkButton);
    
    // Verify results display
    await waitFor(() => {
      expect(canvas.getByText(/interacciones detectadas/i)).toBeInTheDocument();
    });
  }
};

export const PediatricConsultation: Story = {
  args: {
    mode: 'diagnostic-support',
    specialty: 'pediatrics',
    userRole: 'doctor',
    patientContext: {
      id: 'child-101',
      age: 5,
      gender: 'male',
      weight: 18, // kg
      growthPercentile: {
        height: 50,
        weight: 40
      },
      vaccinations: ['MMR', 'DTaP', 'Polio', 'Hib'],
      parentPresent: true,
      guardianName: 'María González'
    },
    pediatricMode: true,
    childFriendlyInterface: true
  },
  decorators: [(Story) => (
    <div className="bg-blue-50 min-h-screen">
      <Story />
    </div>
  )]
};

export const CardiologySpecialist: Story = {
  args: {
    mode: 'diagnostic-support',
    specialty: 'cardiology',
    userRole: 'doctor',
    patientContext: {
      id: 'cardiac-202',
      age: 58,
      gender: 'male',
      medicalHistory: {
        chronicConditions: ['Hipertensión', 'Dislipidemia'],
        previousProcedures: ['Angioplastia 2019'],
        familyHistory: ['Infarto paterno a los 55 años']
      },
      currentMedications: ['Atorvastatina', 'Clopidogrel', 'Metoprolol'],
      recentTests: [
        {
          test: 'ECG',
          date: '2024-08-10',
          result: 'Ritmo sinusal normal, Q patológicas en derivaciones inferiores'
        },
        {
          test: 'Troponinas',
          date: '2024-08-10',
          result: '0.05 ng/mL (normal <0.04)'
        }
      ]
    },
    specialistTools: ['ecg-interpreter', 'risk-calculator', 'guideline-assistant']
  }
};

export const TreatmentPlanning: Story = {
  args: {
    mode: 'treatment-planning',
    specialty: 'endocrinology',
    userRole: 'doctor',
    diagnosis: 'Diabetes mellitus tipo 2 descompensada',
    patientContext: {
      id: 'diabetes-303',
      age: 52,
      gender: 'female',
      bmi: 32.1,
      hba1c: 9.2,
      currentMedications: ['Metformina 1000mg c/12h'],
      complications: ['Retinopatía diabética leve', 'Neuropatía periférica'],
      socialFactors: {
        adherence: 'moderada',
        exercise: 'sedentaria',
        diet: 'irregular'
      }
    },
    treatmentGoals: {
      hba1c: '<7%',
      weight: 'reducir 10%',
      bloodPressure: '<130/80'
    }
  }
};

export const MedicalStudent: Story = {
  args: {
    mode: 'diagnostic-support',
    specialty: 'general_medicine',
    userRole: 'medical_student',
    educationalMode: true,
    showExplanations: true,
    includeReferences: true,
    patientContext: {
      id: 'case-study-404',
      age: 28,
      gender: 'female',
      chiefComplaint: 'Fatiga y pérdida de peso'
    },
    learningObjectives: [
      'Diagnóstico diferencial de fatiga',
      'Interpretación de pruebas tiroideas',
      'Manejo de hipertiroidismo'
    ]
  },
  decorators: [(Story) => (
    <div className="bg-green-50 min-h-screen">
      <div className="bg-green-100 border-l-4 border-green-500 p-4 mb-4">
        <h2 className="text-green-800 font-bold">🎓 MODO EDUCATIVO ACTIVADO</h2>
        <p className="text-green-700">Incluye explicaciones detalladas y referencias académicas</p>
      </div>
      <Story />
    </div>
  )]
};

export const PatientEducation: Story = {
  args: {
    mode: 'patient-education',
    userRole: 'patient',
    language: 'es',
    readingLevel: 'intermediate',
    patientContext: {
      id: 'patient-505',
      age: 35,
      condition: 'Hipertensión arterial',
      newDiagnosis: true
    },
    educationTopics: [
      'Qué es la hipertensión',
      'Cambios en el estilo de vida',
      'Importancia de la medicación',
      'Monitoreo en casa'
    ],
    useSimpleLanguage: true,
    includeVisualAids: true
  }
};

export const MultiLanguage: Story = {
  args: {
    ...SymptomAnalysis.args,
    language: 'en',
    supportedLanguages: ['es', 'en', 'fr', 'pt'],
    autoTranslate: true
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test language switcher
    const languageButton = canvas.getByRole('button', { name: /language/i });
    await userEvent.click(languageButton);
    
    const spanishOption = canvas.getByText('Español');
    await userEvent.click(spanishOption);
    
    // Verify interface language changed
    await waitFor(() => {
      expect(canvas.getByPlaceholderText(/describe los síntomas/i)).toBeInTheDocument();
    });
  }
};

export const VoiceEnabled: Story = {
  args: {
    ...SymptomAnalysis.args,
    voiceEnabled: true,
    speechRecognition: true,
    textToSpeech: true
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test voice controls
    const voiceButton = canvas.getByRole('button', { name: /activar voz/i });
    await expect(voiceButton).toBeInTheDocument();
    
    await userEvent.click(voiceButton);
    
    // Verify voice mode activated
    await waitFor(() => {
      expect(canvas.getByText(/escuchando/i)).toBeInTheDocument();
    });
  }
};

export const HIPAACompliant: Story = {
  args: {
    ...SymptomAnalysis.args,
    hipaaMode: true,
    auditLogging: true,
    dataEncryption: true,
    privacyNotice: 'Esta conversación está protegida bajo HIPAA y será auditada.',
    allowDataStorage: false
  },
  decorators: [(Story) => (
    <div>
      <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
        <h3 className="text-yellow-800 font-bold">🔒 MODO HIPAA ACTIVADO</h3>
        <p className="text-yellow-700 text-sm">
          Todas las interacciones son encriptadas y auditadas según normativas HIPAA.
        </p>
      </div>
      <Story />
    </div>
  )]
};

export const Loading: Story = {
  args: {
    ...SymptomAnalysis.args,
    isLoading: true,
    loadingMessage: 'Cargando modelo de IA médica...'
  }
};

export const Error: Story = {
  args: {
    ...SymptomAnalysis.args,
    error: {
      type: 'network',
      message: 'Error de conexión con el servidor de IA',
      retryable: true
    }
  }
};

export const OfflineMode: Story = {
  args: {
    ...SymptomAnalysis.args,
    offlineMode: true,
    offlineCapabilities: ['symptom-triage', 'basic-guidelines', 'emergency-protocols'],
    limitedFunctionality: true
  },
  decorators: [(Story) => (
    <div>
      <div className="bg-gray-100 border-l-4 border-gray-500 p-4 mb-4">
        <h3 className="text-gray-800 font-bold">📱 MODO OFFLINE</h3>
        <p className="text-gray-700 text-sm">
          Funcionalidad limitada sin conexión a internet.
        </p>
      </div>
      <Story />
    </div>
  )]
};

export const AccessibilityFeatures: Story = {
  args: {
    ...SymptomAnalysis.args,
    highContrast: true,
    largeText: true,
    keyboardNavigation: true,
    screenReaderOptimized: true,
    voiceEnabled: true
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test keyboard navigation
    const firstButton = canvas.getAllByRole('button')[0];
    firstButton.focus();
    await expect(firstButton).toHaveFocus();
    
    // Test high contrast mode
    const container = canvas.getByTestId('ai-assistant-container');
    await expect(container).toHaveClass('high-contrast');
    
    // Test screen reader labels
    const chatInput = canvas.getByRole('textbox');
    await expect(chatInput).toHaveAttribute('aria-label');
  }
};

// Complex workflow story
export const CompleteWorkflow: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Flujo Completo de Consulta con IA</h2>
        <div className="flex justify-center space-x-4 mb-6">
          <div className="bg-blue-100 px-3 py-1 rounded">1. Triaje</div>
          <div className="bg-yellow-100 px-3 py-1 rounded">2. Análisis</div>
          <div className="bg-green-100 px-3 py-1 rounded">3. Diagnóstico</div>
          <div className="bg-purple-100 px-3 py-1 rounded">4. Tratamiento</div>
        </div>
      </div>
      
      <MedicalAIAssistant
        mode="emergency-triage"
        specialty="general_medicine"
        userRole="nurse"
        patientContext={{
          id: 'workflow-patient',
          age: 45,
          gender: 'male'
        }}
        workflowStep={1}
        totalSteps={4}
      />
    </div>
  )
};