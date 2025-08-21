# Wizard Component Library

A comprehensive, accessible, and medical-optimized multi-step form wizard component library built with React, TypeScript, and the Medical Design System.

## Features

### 🚀 Core Components
- **`<Wizard>`** - Main orchestrator component with state management
- **`<WizardStep>`** - Individual step wrapper component
- **`<ProgressBar>`** - Visual progress indicator with multiple variants
- **`<FormField>`** - Comprehensive form field component with validation
- **`<WizardNavigation>`** - Navigation controls with keyboard support

### ✨ Key Features
- **Automatic validation** with real-time feedback
- **Auto-save functionality** with configurable intervals
- **Dark/Light mode compatibility** with system preference detection
- **Keyboard navigation** support (Arrow keys, Enter, Backspace)
- **Accessibility compliant** (WCAG AA)
- **Design system integration** with tokenized colors and spacing
- **TypeScript support** with comprehensive type definitions
- **Responsive design** with mobile-first approach
- **Persistence support** with localStorage integration

## Installation

```bash
# The components are already included in the project
# Import the CSS tokens in your main CSS file:
@import '../styles/medical-design-tokens.css';
```

## Quick Start

### Basic Wizard

```tsx
import { 
  Wizard, 
  WizardStep, 
  ProgressBar, 
  WizardNavigation, 
  FormField 
} from '@/components/ui/wizard'

const steps = [
  {
    id: 'personal-info',
    name: 'Personal Info',
    title: 'Personal Information',
    description: 'Tell us about yourself',
    component: <PersonalInfoStep />,
    validation: (data) => {
      const errors = []
      if (!data?.name) errors.push('Name is required')
      return errors
    }
  },
  // ... more steps
]

function MyWizard() {
  return (
    <Wizard
      steps={steps}
      autoSave={true}
      onComplete={(data) => console.log('Wizard completed:', data)}
    >
      <ProgressBar variant="default" />
      
      <WizardStep id="personal-info">
        <FormField
          label="Full Name"
          stepId="personal-info"
          fieldId="name"
          type="text"
          required
          validation={{ required: true, minLength: 2 }}
        />
      </WizardStep>
      
      <WizardNavigation />
    </Wizard>
  )
}
```

### Medical Onboarding Wizard (Template)

```tsx
import { MedicalOnboardingWizard } from '@/components/ui/wizard/templates'

function MedicalFlow() {
  return (
    <MedicalOnboardingWizard
      autoSave={true}
      theme="system"
      onComplete={(data) => {
        console.log('Patient data:', data)
      }}
      onPatientDataSubmit={(patientData) => {
        // Handle patient data submission
      }}
      onConsentSubmit={(consentData) => {
        // Handle consent submission
      }}
    />
  )
}
```

## Components Reference

### Wizard

Main container component that manages wizard state and provides context.

```tsx
interface WizardProps {
  steps: WizardStep[]
  initialData?: WizardData
  autoSave?: boolean
  autoSaveInterval?: number
  theme?: 'light' | 'dark' | 'system'
  className?: string
  onStepChange?: (fromStep: WizardStep | null, toStep: WizardStep) => void
  onComplete?: (data: WizardData) => void
  onSave?: (data: WizardData) => void
  children: ReactNode
}
```

### WizardStep

Wrapper component for individual step content.

```tsx
interface WizardStepProps {
  id: string
  children: ReactNode
  className?: string
}
```

### ProgressBar

Visual progress indicator with multiple display variants.

```tsx
interface ProgressBarProps {
  showStepNames?: boolean
  showStepNumbers?: boolean
  variant?: 'default' | 'compact' | 'detailed'
  className?: string
}

// Variants:
// - default: Full progress bar with step indicators
// - compact: Minimal progress bar with percentage
// - detailed: Comprehensive view with step list
```

### FormField

Comprehensive form field component with built-in validation.

```tsx
interface FormFieldProps {
  label: string
  stepId: string
  fieldId: string
  type?: 'text' | 'email' | 'tel' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio'
  validation?: ValidationRule
  required?: boolean
  options?: Array<{ value: string; label: string; disabled?: boolean }>
  // ... more props
}

interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  email?: boolean
  phone?: boolean
  numeric?: boolean
  custom?: (value: any) => boolean | string
}
```

### WizardNavigation

Navigation controls with customizable appearance and behavior.

```tsx
interface WizardNavigationProps {
  variant?: 'default' | 'floating' | 'minimal'
  showStepInfo?: boolean
  nextLabel?: string
  previousLabel?: string
  finishLabel?: string
  allowSkip?: boolean
  customButtons?: React.ReactNode
}
```

## Hooks

### useWizard

Main hook for accessing wizard state and actions.

```tsx
const {
  steps,
  currentStep,
  currentStepIndex,
  data,
  isFirstStep,
  isLastStep,
  isStepValid,
  errors,
  nextStep,
  previousStep,
  updateStepData,
  // ... more properties
} = useWizard()
```

### useWizardForm

Hook for managing form state with validation.

```tsx
const {
  formData,
  errors,
  touched,
  updateField,
  validateForm
} = useWizardForm('step-id', initialData, validationRules)
```

### useWizardPersistence

Hook for localStorage persistence.

```tsx
const {
  saveToStorage,
  loadFromStorage,
  clearStorage
} = useWizardPersistence('wizard-storage-key')
```

### useWizardKeyboard

Hook for keyboard navigation support.

```tsx
// Automatically enables keyboard navigation
useWizardKeyboard()

// Keyboard shortcuts:
// - Arrow Right/Enter: Next step
// - Arrow Left/Backspace: Previous step
```

## Validation

### Built-in Validation Rules

```tsx
const validation = {
  required: true,
  minLength: 3,
  maxLength: 50,
  email: true,
  phone: true,
  numeric: true,
  pattern: /^[A-Za-z]+$/,
  custom: (value) => {
    if (value === 'admin') return 'Username cannot be admin'
    return true
  }
}
```

### Step-level Validation

```tsx
const step = {
  id: 'contact-info',
  // ...
  validation: (data) => {
    const errors = []
    if (!data?.email) errors.push('Email is required')
    if (!data?.phone) errors.push('Phone is required')
    return errors // Return empty array if valid
  }
}
```

## Design System Integration

### Using Design Tokens

```tsx
// CSS classes automatically use design tokens
<div className="medical-card">
  <h3 className="text-h5 text-primary">Card Title</h3>
  <p className="text-body text-secondary">Card content</p>
</div>
```

### Custom Styling

```css
/* Override with CSS variables */
.my-wizard {
  --color-primary-500: #custom-color;
  --border-radius-lg: 12px;
}
```

### Dark Mode

```tsx
// Automatic system preference detection
<Wizard theme="system" />

// Manual theme control
<Wizard theme="dark" />
<Wizard theme="light" />
```

## Templates

### MedicalOnboardingWizard

Pre-built wizard for medical patient onboarding.

```tsx
<MedicalOnboardingWizard
  showProgressBar={true}
  progressBarVariant="detailed"
  onPatientDataSubmit={(data) => {}}
  onMedicalHistorySubmit={(data) => {}}
  onConsentSubmit={(data) => {}}
/>
```

### SurveyWizard

Configurable survey wizard from JSON configuration.

```tsx
const surveyQuestions = [
  {
    id: 'demographics',
    title: 'Demographics',
    questions: [
      {
        id: 'age',
        label: 'Age',
        type: 'number',
        required: true
      }
    ]
  }
]

<SurveyWizard surveyQuestions={surveyQuestions} />
```

## Advanced Usage

### Custom Step Components

```tsx
function CustomStep() {
  const { data, updateStepData, setStepValid } = useWizard()
  
  const handleChange = (newData) => {
    updateStepData('my-step', newData)
    setStepValid('my-step', validateData(newData))
  }
  
  return (
    <div>
      {/* Custom step content */}
    </div>
  )
}
```

### Conditional Steps

```tsx
const steps = [
  {
    id: 'basic-info',
    // ... step config
  },
  {
    id: 'additional-info',
    // ... step config
    // This step will be skipped if condition is not met
    validation: (data, allData) => {
      // Skip if user selected "basic" plan
      if (allData['basic-info']?.plan === 'basic') {
        return [] // Valid (skipped)
      }
      // Validate normally for other plans
      return validateAdditionalInfo(data)
    }
  }
]
```

### Integration with External State Management

```tsx
function WizardWithRedux() {
  const dispatch = useDispatch()
  const wizardData = useSelector(state => state.wizard)
  
  return (
    <Wizard
      initialData={wizardData}
      onSave={(data) => {
        dispatch(saveWizardData(data))
      }}
      onComplete={(data) => {
        dispatch(submitWizard(data))
      }}
    >
      {/* Wizard content */}
    </Wizard>
  )
}
```

## Accessibility

### WCAG Compliance

- ✅ **Keyboard Navigation**: Full keyboard support
- ✅ **Screen Reader**: Proper ARIA labels and roles
- ✅ **Focus Management**: Logical focus flow
- ✅ **Color Contrast**: AA compliant color ratios
- ✅ **Error Handling**: Clear error messages
- ✅ **Form Labels**: Properly associated labels

### ARIA Attributes

```tsx
// Automatically applied
<div 
  role="tabpanel" 
  aria-labelledby="step-title"
  aria-describedby="step-description"
>
```

## Performance

### Optimization Features

- **Lazy Loading**: Steps render only when active
- **Debounced Auto-save**: Configurable debounce intervals
- **Memoized Components**: Optimized re-rendering
- **Virtual Scrolling**: For large step lists (in detailed progress bar)

### Best Practices

```tsx
// Use React.memo for step components
const ExpensiveStep = React.memo(() => {
  // Component logic
})

// Debounce auto-save for better performance
<Wizard autoSaveInterval={5000} />

// Use validation sparingly
const lightValidation = (data) => {
  // Only validate critical fields
  return data?.criticalField ? [] : ['Critical field required']
}
```

## Testing

### Testing Utilities

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Wizard, WizardStep } from '@/components/ui/wizard'

test('wizard navigation', () => {
  render(
    <Wizard steps={mockSteps}>
      <WizardStep id="step-1">Step 1 Content</WizardStep>
      <WizardNavigation />
    </Wizard>
  )
  
  // Test navigation
  fireEvent.click(screen.getByText('Next'))
  expect(screen.getByText('Step 2 Content')).toBeInTheDocument()
})
```

## Migration from Old Anamnesis

### Before (Old Implementation)

```tsx
// Multiple separate components with manual state management
<InteractiveAnamnesisStepper>
  <ConsentStep />
  <PersonalDataStep />
  <SymptomLocationStep />
  {/* Manual progress tracking */}
</InteractiveAnamnesisStepper>
```

### After (New Wizard Library)

```tsx
// Unified wizard with automatic state management
<AnamnesisWizard
  patientAvatarRef={avatarRef}
  onComplete={handleComplete}
/>
```

### Benefits

- ✅ **Unified State Management**: Single source of truth
- ✅ **Automatic Validation**: Built-in validation system
- ✅ **Auto-save**: No data loss on page refresh
- ✅ **Better UX**: Smooth transitions and feedback
- ✅ **Accessibility**: WCAG AA compliant
- ✅ **Type Safety**: Full TypeScript support
- ✅ **Reusability**: Can be used for any multi-step form

## Troubleshooting

### Common Issues

**Q: Validation not triggering**
```tsx
// Ensure validation function returns array of strings
validation: (data) => {
  const errors = []
  if (!data?.field) errors.push('Field is required')
  return errors // Must return array
}
```

**Q: Auto-save not working**
```tsx
// Check onSave callback and autoSave prop
<Wizard 
  autoSave={true}
  autoSaveInterval={3000}
  onSave={(data) => {
    console.log('Saving:', data) // Debug callback
  }}
/>
```

**Q: Dark mode not applying**
```tsx
// Ensure CSS is imported and theme is set
import '@/styles/medical-design-tokens.css'

<Wizard theme="system" /> // or "dark" / "light"
```

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers with ES2020 support

## Contributing

1. Follow the existing code structure
2. Add TypeScript types for new features
3. Include unit tests for new components
4. Update documentation for changes
5. Ensure accessibility compliance
6. Test in multiple browsers

---

*This wizard library is designed for medical applications but can be used for any multi-step form workflow.*
