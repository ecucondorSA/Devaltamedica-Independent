# @altamedica/medical

> Medical domain package for the AltaMedica platform

This package provides a comprehensive set of types, utilities, components, and hooks for building medical applications.

## Installation

```bash
pnpm add @altamedica/medical
```

## Features

- 🏥 **Complete TypeScript types** for medical domain (Patient, Doctor, Appointment, MedicalRecord)
- 🧮 **Medical calculations** (BMI, ideal weight, heart rate zones, blood pressure classification)
- 📅 **Date utilities** specialized for medical contexts
- ✅ **Validation functions** for all medical data types
- 🎨 **React components** for displaying medical information
- 🪝 **React hooks** for fetching and managing medical data
- 🔥 **Firebase configuration** for medical collections

## Usage

### Types

```typescript
import { Patient, Doctor, Appointment, MedicalRecord } from '@altamedica/medical';

const patient: Patient = {
  id: '123',
  name: 'John Doe',
  email: 'john@example.com',
  birthDate: new Date('1990-01-01'),
  conditions: ['Hypertension', 'Diabetes Type 2']
};
```

### Components

```tsx
import { PatientCard, DoctorCard, AppointmentCard } from '@altamedica/medical';

function MyComponent() {
  return (
    <>
      <PatientCard patient={patient} onClick={() => console.log('clicked')} />
      <DoctorCard doctor={doctor} showAvailability />
      <AppointmentCard appointment={appointment} patientName="John Doe" />
    </>
  );
}
```

### Hooks

```typescript
import { useMedicalData, useHealthMetrics } from '@altamedica/medical';

function MyComponent() {
  const { fetchPatients, fetchDoctors, loading } = useMedicalData();
  const { metrics, analysis, updateMetric } = useHealthMetrics();
  
  // Fetch data
  const patients = await fetchPatients({ search: 'John' });
  
  // Update health metrics
  updateMetric('weight', 75);
  updateMetric('height', 180);
  
  // Access BMI analysis
  console.log(analysis.bmi); // { value: 23.1, category: 'Normal weight', color: 'text-green-600' }
}
```

### Utilities

```typescript
import { 
  calculateBMI, 
  calculateAge, 
  formatMedicalDate,
  validatePatientData 
} from '@altamedica/medical';

// Calculate BMI
const bmi = calculateBMI(75, 180); // weight in kg, height in cm

// Calculate age
const age = calculateAge(new Date('1990-01-01'));

// Format dates
const formatted = formatMedicalDate(new Date());

// Validate data
const { isValid, errors } = validatePatientData({
  name: 'John',
  email: 'invalid-email'
});
```

### Constants

```typescript
import { 
  MEDICAL_SPECIALIZATIONS,
  APPOINTMENT_DURATIONS,
  VITAL_RANGES,
  LAB_TEST_TYPES 
} from '@altamedica/medical';

// Use predefined medical constants
const specialization = MEDICAL_SPECIALIZATIONS[0]; // 'General Practice'
const duration = APPOINTMENT_DURATIONS.standard; // 30 minutes
const normalHeartRate = VITAL_RANGES.heartRate; // { min: 60, max: 100, unit: 'bpm' }
```

## API Reference

### Types

- `Patient`, `PatientCreate`, `PatientUpdate`
- `Doctor`, `DoctorCreate`, `DoctorUpdate`
- `Appointment`, `AppointmentCreate`, `AppointmentUpdate`
- `MedicalRecord`, `MedicalRecordCreate`, `MedicalRecordUpdate`

### Components

- `PatientCard` - Display patient information
- `DoctorCard` - Display doctor information with specialization
- `AppointmentCard` - Display appointment details with status

### Hooks

- `useMedicalData()` - Fetch medical data from API
- `useHealthMetrics()` - Track and analyze health metrics

### Utilities

#### Date Utils
- `formatMedicalDate()` - Format date for medical records
- `formatShortDate()` - Short date format for lists
- `calculateAge()` - Calculate age from birth date
- `isPastAppointment()` - Check if appointment is in the past
- `getTimeUntilAppointment()` - Get human-readable time until appointment

#### Health Calculations
- `calculateBMI()` - Calculate Body Mass Index
- `calculateIdealWeight()` - Calculate ideal weight range
- `calculateHeartRateZones()` - Calculate heart rate zones by age
- `classifyBloodPressure()` - Classify blood pressure readings

#### Validation
- `validatePatientData()` - Validate patient information
- `validateDoctorData()` - Validate doctor information
- `validateAppointmentData()` - Validate appointment data
- `validateMedicalRecordData()` - Validate medical records

## Development

```bash
# Install dependencies
pnpm install

# Build package
pnpm build

# Run tests
pnpm test

# Type check
pnpm type-check
```

## License

Private - AltaMedica Platform