/**
 * Unit Tests for PatientService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PatientService } from '../patient';
import type { Patient, MedicalRecord, Appointment, LabResult } from '@altamedica/interfaces';

describe('PatientService', () => {
  let mockPatient: Patient;
  let mockMedicalRecords: MedicalRecord[];
  let mockAppointments: Appointment[];
  let mockLabResults: LabResult[];

  beforeEach(() => {
    mockPatient = {
      id: 'patient-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      dateOfBirth: '1980-01-15',
      gender: 'male',
      phone: '+1234567890',
      address: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zip: '90210',
        country: 'USA'
      },
      medications: [
        { name: 'Aspirin', dosage: '100mg', frequency: 'daily' },
        { name: 'Metformin', dosage: '500mg', frequency: 'twice daily' }
      ],
      allergies: ['Penicillin', 'Peanuts'],
      insuranceInfo: {
        provider: 'HealthCare Inc',
        policyNumber: 'POL123456',
        groupNumber: 'GRP789'
      }
    } as Patient;

    mockMedicalRecords = [
      {
        id: 'record-1',
        patientId: 'patient-123',
        visitDate: new Date().toISOString(),
        chiefComplaint: 'Regular checkup',
        diagnosis: [
          { code: 'E11.9', description: 'Type 2 diabetes', type: 'primary' },
          { code: 'I10', description: 'Hypertension', type: 'secondary' }
        ],
        vitalSigns: {
          bloodPressure: { systolic: 130, diastolic: 85 },
          heartRate: 72,
          temperature: 98.6,
          respiratoryRate: 16,
          oxygenSaturation: 98,
          bmi: 28.5
        },
        treatment: [],
        medications: [],
        notes: 'Patient stable'
      } as MedicalRecord,
      {
        id: 'record-2',
        patientId: 'patient-123',
        visitDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        chiefComplaint: 'admission for pneumonia',
        diagnosis: [
          { code: 'J18.9', description: 'Pneumonia', type: 'primary' }
        ],
        vitalSigns: {
          bloodPressure: { systolic: 140, diastolic: 90 },
          heartRate: 88,
          temperature: 101.2,
          respiratoryRate: 22,
          oxygenSaturation: 94,
          bmi: 28.5
        }
      } as MedicalRecord
    ];

    mockAppointments = [
      {
        id: 'apt-1',
        patientId: 'patient-123',
        doctorId: 'doctor-456',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        time: '10:00',
        type: 'follow-up',
        status: 'scheduled',
        duration: 30
      } as Appointment
    ];

    mockLabResults = [
      {
        id: 'lab-1',
        patientId: 'patient-123',
        testName: 'Complete Blood Count',
        testDate: new Date().toISOString(),
        results: [
          { name: 'WBC', value: '7.5', unit: 'K/uL', range: '4.5-11.0', flag: 'normal' },
          { name: 'RBC', value: '4.8', unit: 'M/uL', range: '4.2-5.4', flag: 'normal' },
          { name: 'Hemoglobin', value: '14.2', unit: 'g/dL', range: '12.0-16.0', flag: 'normal' }
        ]
      } as LabResult
    ];
  });

  describe('calculateRiskScore', () => {
    it('should calculate low risk score for young healthy patient', () => {
      const youngPatient = { ...mockPatient, dateOfBirth: '2000-01-15', medications: [] };
      const healthyRecords: MedicalRecord[] = [];
      
      const result = PatientService.calculateRiskScore(youngPatient, healthyRecords);
      
      expect(result.score).toBeLessThan(20);
      expect(result.level).toBe('low');
      expect(result.factors).toHaveLength(0);
    });

    it('should increase risk score for elderly patients', () => {
      const elderlyPatient = { ...mockPatient, dateOfBirth: '1950-01-15' };
      
      const result = PatientService.calculateRiskScore(elderlyPatient, []);
      
      expect(result.score).toBeGreaterThanOrEqual(20);
      expect(result.factors).toContainEqual(
        expect.objectContaining({ factor: 'age' })
      );
    });

    it('should increase risk score for chronic conditions', () => {
      const result = PatientService.calculateRiskScore(mockPatient, mockMedicalRecords);
      
      expect(result.factors).toContainEqual(
        expect.objectContaining({ factor: 'chronic_conditions' })
      );
      expect(result.score).toBeGreaterThan(0);
    });

    it('should detect recent hospitalizations', () => {
      const result = PatientService.calculateRiskScore(mockPatient, mockMedicalRecords);
      
      expect(result.factors).toContainEqual(
        expect.objectContaining({ 
          factor: 'hospitalizations',
          value: 1
        })
      );
    });

    it('should flag polypharmacy risk', () => {
      const patientWithManyMeds = {
        ...mockPatient,
        medications: Array(6).fill({ name: 'Med', dosage: '100mg' })
      };
      
      const result = PatientService.calculateRiskScore(patientWithManyMeds, []);
      
      expect(result.factors).toContainEqual(
        expect.objectContaining({ 
          factor: 'polypharmacy',
          value: 6
        })
      );
    });

    it('should consider BMI in risk calculation', () => {
      const result = PatientService.calculateRiskScore(mockPatient, mockMedicalRecords);
      
      // BMI of 28.5 is not in risk range (>30 or <18.5)
      expect(result.factors).not.toContainEqual(
        expect.objectContaining({ factor: 'bmi' })
      );
      
      // Test with high BMI
      const recordsWithHighBMI = [{
        ...mockMedicalRecords[0],
        vitalSigns: { ...mockMedicalRecords[0].vitalSigns, bmi: 35 }
      }];
      
      const highBMIResult = PatientService.calculateRiskScore(mockPatient, recordsWithHighBMI);
      expect(highBMIResult.factors).toContainEqual(
        expect.objectContaining({ factor: 'bmi', value: 35 })
      );
    });

    it('should cap risk score at 100', () => {
      const veryHighRiskPatient = {
        ...mockPatient,
        dateOfBirth: '1940-01-15',
        medications: Array(10).fill({ name: 'Med', dosage: '100mg' })
      };
      
      const manyHospitalizations = Array(5).fill({
        ...mockMedicalRecords[1],
        visitDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      });
      
      const result = PatientService.calculateRiskScore(veryHighRiskPatient, manyHospitalizations);
      
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.level).toBe('critical');
    });

    it('should generate appropriate recommendations', () => {
      const elderlyPatient = { ...mockPatient, dateOfBirth: '1950-01-15' };
      const result = PatientService.calculateRiskScore(elderlyPatient, mockMedicalRecords);
      
      expect(result.recommendations).toContain('Schedule regular health checkups every 3 months');
      expect(result.recommendations).toContain('Maintain regular medication compliance');
    });
  });

  describe('checkTreatmentEligibility', () => {
    const mockTreatment = {
      id: 'treatment-1',
      name: 'Beta Blocker Therapy',
      minAge: 18,
      maxAge: 80,
      contraindications: ['Aspirin'],
      allergens: ['Sulfa'],
      requiredConditions: ['I10'], // Hypertension
      excludedConditions: ['J44'] // COPD
    };

    it('should approve eligible patient for treatment', () => {
      const result = PatientService.checkTreatmentEligibility(
        mockPatient,
        mockTreatment,
        mockMedicalRecords
      );
      
      expect(result.eligible).toBe(true);
      expect(result.contraindications).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should reject patient below minimum age', () => {
      const youngPatient = { ...mockPatient, dateOfBirth: '2010-01-15' };
      
      const result = PatientService.checkTreatmentEligibility(
        youngPatient,
        mockTreatment,
        mockMedicalRecords
      );
      
      expect(result.eligible).toBe(false);
      expect(result.contraindications).toContainEqual(
        expect.stringContaining('below minimum required')
      );
    });

    it('should detect drug interactions', () => {
      const treatmentWithInteractions = {
        ...mockTreatment,
        contraindications: ['Metformin']
      };
      
      const result = PatientService.checkTreatmentEligibility(
        mockPatient,
        treatmentWithInteractions,
        mockMedicalRecords
      );
      
      expect(result.eligible).toBe(false);
      expect(result.contraindications).toHaveLength(1);
    });

    it('should detect allergy conflicts', () => {
      const treatmentWithAllergen = {
        ...mockTreatment,
        allergens: ['Penicillin']
      };
      
      const result = PatientService.checkTreatmentEligibility(
        mockPatient,
        treatmentWithAllergen,
        mockMedicalRecords
      );
      
      expect(result.eligible).toBe(false);
      expect(result.contraindications).toContainEqual(
        expect.stringContaining('Patient allergic to: Penicillin')
      );
    });

    it('should check for required conditions', () => {
      const treatmentRequiringCondition = {
        ...mockTreatment,
        requiredConditions: ['E10'] // Type 1 diabetes (patient has E11 - Type 2)
      };
      
      const result = PatientService.checkTreatmentEligibility(
        mockPatient,
        treatmentRequiringCondition,
        mockMedicalRecords
      );
      
      expect(result.eligible).toBe(false);
      expect(result.contraindications).toContainEqual(
        expect.stringContaining('Missing required conditions')
      );
    });

    it('should warn about excluded conditions', () => {
      const treatmentWithExclusions = {
        ...mockTreatment,
        excludedConditions: ['E11.9'] // Type 2 diabetes
      };
      
      const result = PatientService.checkTreatmentEligibility(
        mockPatient,
        treatmentWithExclusions,
        mockMedicalRecords
      );
      
      expect(result.warnings).toContainEqual(
        expect.stringContaining('conditions that may affect treatment')
      );
    });

    it('should suggest alternatives when not eligible', () => {
      const youngPatient = { ...mockPatient, dateOfBirth: '2010-01-15' };
      
      const result = PatientService.checkTreatmentEligibility(
        youngPatient,
        mockTreatment,
        mockMedicalRecords
      );
      
      expect(result.eligible).toBe(false);
      expect(result.alternativeTreatments).toHaveLength(1);
      expect(result.alternativeTreatments[0]).toContain('alternative options');
    });
  });

  describe('generateHealthSummary', () => {
    it('should generate complete health summary', () => {
      const summary = PatientService.generateHealthSummary(
        mockPatient,
        mockMedicalRecords,
        mockAppointments,
        mockLabResults
      );
      
      expect(summary.patientInfo.name).toBe('John Doe');
      expect(summary.patientInfo.age).toBeGreaterThan(40);
      expect(summary.patientInfo.gender).toBe('male');
      expect(summary.currentMedications).toHaveLength(2);
      expect(summary.allergies).toContain('Penicillin');
      expect(summary.upcomingAppointments).toHaveLength(1);
      expect(summary.recentLabResults).toHaveLength(1);
      expect(summary.riskScore).toBeDefined();
      expect(summary.lastUpdated).toBeInstanceOf(Date);
    });

    it('should extract active conditions from recent records', () => {
      const summary = PatientService.generateHealthSummary(
        mockPatient,
        mockMedicalRecords,
        mockAppointments,
        mockLabResults
      );
      
      expect(summary.currentConditions).toContain('Type 2 diabetes');
      expect(summary.currentConditions).toContain('Pneumonia');
    });

    it('should include latest vital signs', () => {
      const summary = PatientService.generateHealthSummary(
        mockPatient,
        mockMedicalRecords,
        mockAppointments,
        mockLabResults
      );
      
      expect(summary.recentVitals).toBeDefined();
      expect(summary.recentVitals?.bmi).toBe(28.5);
      expect(summary.recentVitals?.bloodPressure.systolic).toBe(130);
    });

    it('should generate preventive care reminders based on age', () => {
      const summary = PatientService.generateHealthSummary(
        mockPatient,
        mockMedicalRecords,
        mockAppointments,
        mockLabResults
      );
      
      expect(summary.preventiveCareReminders).toContain('Annual flu vaccination');
      expect(summary.preventiveCareReminders).toContain('Dental checkup every 6 months');
      
      // For patient over 40
      expect(summary.preventiveCareReminders).toContain('Annual mammogram recommended');
    });

    it('should summarize lab results with abnormal values', () => {
      const labWithAbnormal = {
        ...mockLabResults[0],
        results: [
          ...mockLabResults[0].results,
          { name: 'Glucose', value: '180', unit: 'mg/dL', range: '70-110', flag: 'high' }
        ]
      };
      
      const summary = PatientService.generateHealthSummary(
        mockPatient,
        mockMedicalRecords,
        mockAppointments,
        [labWithAbnormal]
      );
      
      expect(summary.recentLabResults[0].abnormalValues).toHaveLength(1);
      expect(summary.recentLabResults[0].abnormalValues[0].name).toBe('Glucose');
    });
  });
});