// TODO: Definir estos tipos en @altamedica/types
// Stubs temporales para permitir el build
import { logger } from './logger.service';

interface Medication {
  id: string;
  genericName: string;
  brandName?: string;
  manufacturer?: string;
  dosageForm?: string;
  strength?: string;
  activeIngredients?: string[];
  contraindications?: string[];
  sideEffects?: string[];
  category?: string;
  requiresPrescription?: boolean;
  [key: string]: any;
}

interface MedicationSearch {
  [key: string]: any;
}

interface MedicationSchema {
  [key: string]: any;
}

interface DosageForm {
  [key: string]: any;
}

/**
 * Medication Catalog Service
 * Provides medication search and management functionality
 * Includes seed data for common medications in Argentina
 */

// Common medications in Argentina (seed data)
// Tipo temporal para los datos con propiedades adicionales
interface ExtendedMedication extends Partial<Medication> {
  id: string;
  genericName: string;
  brandName?: string;
  activeIngredients?: string[];
  controlledSubstance?: boolean;
  anmatRegistration?: string;
}

const SEED_MEDICATIONS: ExtendedMedication[] = [
  // Analgesics
  {
    id: 'med_001',
    genericName: 'Paracetamol',
    brandName: 'Tafirol',
    manufacturer: 'Roemmers',
    dosageForm: 'tablet',
    strength: '500mg',
    activeIngredients: ['Paracetamol'],
    contraindications: ['Severe hepatic impairment', 'Hypersensitivity to paracetamol'],
    sideEffects: ['Nausea', 'Rash', 'Hepatotoxicity (overdose)'],
    category: 'analgesic',
    requiresPrescription: false,
    controlledSubstance: false,
    anmatRegistration: 'ANMAT-12345',
  },
  {
    id: 'med_002',
    genericName: 'Ibuprofeno',
    brandName: 'Actron',
    manufacturer: 'Bayer',
    dosageForm: 'tablet',
    strength: '400mg',
    activeIngredients: ['Ibuprofen'],
    contraindications: [
      'Active peptic ulcer',
      'Severe renal impairment',
      'Third trimester pregnancy',
    ],
    sideEffects: ['Gastric irritation', 'Headache', 'Dizziness'],
    category: 'analgesic',
    requiresPrescription: false,
    controlledSubstance: false,
    anmatRegistration: 'ANMAT-12346',
  },

  // Antibiotics
  {
    id: 'med_003',
    genericName: 'Amoxicilina',
    brandName: 'Amoxidal',
    manufacturer: 'Roemmers',
    dosageForm: 'capsule',
    strength: '500mg',
    activeIngredients: ['Amoxicillin'],
    contraindications: ['Penicillin allergy', 'Infectious mononucleosis'],
    sideEffects: ['Diarrhea', 'Nausea', 'Rash'],
    category: 'antibiotic',
    requiresPrescription: true,
    controlledSubstance: false,
    anmatRegistration: 'ANMAT-12347',
  },
  {
    id: 'med_004',
    genericName: 'Azitromicina',
    brandName: 'Zithromax',
    manufacturer: 'Pfizer',
    dosageForm: 'tablet',
    strength: '500mg',
    activeIngredients: ['Azithromycin'],
    contraindications: ['Hypersensitivity to macrolides', 'Severe hepatic impairment'],
    sideEffects: ['Diarrhea', 'Abdominal pain', 'Nausea'],
    category: 'antibiotic',
    requiresPrescription: true,
    controlledSubstance: false,
    anmatRegistration: 'ANMAT-12348',
  },

  // Cardiovascular
  {
    id: 'med_005',
    genericName: 'Enalapril',
    brandName: 'Renitec',
    manufacturer: 'MSD',
    dosageForm: 'tablet',
    strength: '10mg',
    activeIngredients: ['Enalapril maleate'],
    contraindications: ['Pregnancy', 'Angioedema history', 'Bilateral renal artery stenosis'],
    sideEffects: ['Dry cough', 'Hypotension', 'Hyperkalemia'],
    category: 'antihypertensive',
    requiresPrescription: true,
    controlledSubstance: false,
    anmatRegistration: 'ANMAT-12349',
  },
  {
    id: 'med_006',
    genericName: 'Atenolol',
    brandName: 'Tenormin',
    manufacturer: 'AstraZeneca',
    dosageForm: 'tablet',
    strength: '50mg',
    activeIngredients: ['Atenolol'],
    contraindications: ['Bradycardia', 'Heart block', 'Cardiogenic shock'],
    sideEffects: ['Fatigue', 'Cold extremities', 'Bradycardia'],
    category: 'antihypertensive',
    requiresPrescription: true,
    controlledSubstance: false,
    anmatRegistration: 'ANMAT-12350',
  },

  // Diabetes
  {
    id: 'med_007',
    genericName: 'Metformina',
    brandName: 'Glucophage',
    manufacturer: 'Merck',
    dosageForm: 'tablet',
    strength: '850mg',
    activeIngredients: ['Metformin hydrochloride'],
    contraindications: ['Renal impairment', 'Metabolic acidosis', 'Severe hepatic impairment'],
    sideEffects: ['Nausea', 'Diarrhea', 'Metallic taste'],
    category: 'antidiabetic',
    requiresPrescription: true,
    controlledSubstance: false,
    anmatRegistration: 'ANMAT-12351',
  },

  // Gastrointestinal
  {
    id: 'med_008',
    genericName: 'Omeprazol',
    brandName: 'Losec',
    manufacturer: 'AstraZeneca',
    dosageForm: 'capsule',
    strength: '20mg',
    activeIngredients: ['Omeprazole'],
    contraindications: ['Hypersensitivity to benzimidazoles'],
    sideEffects: ['Headache', 'Diarrhea', 'Abdominal pain'],
    category: 'proton_pump_inhibitor',
    requiresPrescription: true,
    controlledSubstance: false,
    anmatRegistration: 'ANMAT-12352',
  },
  {
    id: 'med_009',
    genericName: 'Ranitidina',
    brandName: 'Taural',
    manufacturer: 'Roemmers',
    dosageForm: 'tablet',
    strength: '150mg',
    activeIngredients: ['Ranitidine'],
    contraindications: ['Hypersensitivity to ranitidine'],
    sideEffects: ['Headache', 'Dizziness', 'Constipation'],
    category: 'other',
    requiresPrescription: false,
    controlledSubstance: false,
    anmatRegistration: 'ANMAT-12353',
  },

  // Respiratory
  {
    id: 'med_010',
    genericName: 'Salbutamol',
    brandName: 'Ventolin',
    manufacturer: 'GSK',
    dosageForm: 'inhaler',
    strength: '100mcg',
    activeIngredients: ['Salbutamol sulfate'],
    contraindications: ['Hypersensitivity to salbutamol'],
    sideEffects: ['Tremor', 'Tachycardia', 'Headache'],
    category: 'bronchodilator',
    requiresPrescription: true,
    controlledSubstance: false,
    anmatRegistration: 'ANMAT-12354',
  },
  {
    id: 'med_011',
    genericName: 'Loratadina',
    brandName: 'Clarityne',
    manufacturer: 'Bayer',
    dosageForm: 'tablet',
    strength: '10mg',
    activeIngredients: ['Loratadine'],
    contraindications: ['Hypersensitivity to loratadine'],
    sideEffects: ['Drowsiness', 'Headache', 'Dry mouth'],
    category: 'antihistamine',
    requiresPrescription: false,
    controlledSubstance: false,
    anmatRegistration: 'ANMAT-12355',
  },

  // Psychiatric
  {
    id: 'med_012',
    genericName: 'Alprazolam',
    brandName: 'Xanax',
    manufacturer: 'Pfizer',
    dosageForm: 'tablet',
    strength: '0.5mg',
    activeIngredients: ['Alprazolam'],
    contraindications: ['Narrow-angle glaucoma', 'Severe respiratory insufficiency'],
    sideEffects: ['Drowsiness', 'Dizziness', 'Memory impairment'],
    category: 'anxiolytic',
    requiresPrescription: true,
    controlledSubstance: true,
    anmatRegistration: 'ANMAT-12356',
  },
  {
    id: 'med_013',
    genericName: 'Sertralina',
    brandName: 'Zoloft',
    manufacturer: 'Pfizer',
    dosageForm: 'tablet',
    strength: '50mg',
    activeIngredients: ['Sertraline hydrochloride'],
    contraindications: ['MAO inhibitor use', 'Pimozide use'],
    sideEffects: ['Nausea', 'Insomnia', 'Sexual dysfunction'],
    category: 'antidepressant',
    requiresPrescription: true,
    controlledSubstance: false,
    anmatRegistration: 'ANMAT-12357',
  },

  // Hormonal
  {
    id: 'med_014',
    genericName: 'Levotiroxina',
    brandName: 'T4 Montpellier',
    manufacturer: 'Montpellier',
    dosageForm: 'tablet',
    strength: '100mcg',
    activeIngredients: ['Levothyroxine sodium'],
    contraindications: ['Untreated adrenal insufficiency', 'Acute myocardial infarction'],
    sideEffects: ['Palpitations', 'Weight loss', 'Insomnia'],
    category: 'other',
    requiresPrescription: true,
    controlledSubstance: false,
    anmatRegistration: 'ANMAT-12358',
  },

  // Vitamins
  {
    id: 'med_015',
    genericName: 'Vitamina D3',
    brandName: 'Calcitam D',
    manufacturer: 'Roemmers',
    dosageForm: 'drops',
    strength: '800 UI/ml',
    activeIngredients: ['Cholecalciferol'],
    contraindications: ['Hypercalcemia', 'Hypervitaminosis D'],
    sideEffects: ['Constipation', 'Nausea', 'Weakness'],
    category: 'vitamin',
    requiresPrescription: false,
    controlledSubstance: false,
    anmatRegistration: 'ANMAT-12359',
  },
];

class MedicationCatalogService {
  private medications: Map<string, Medication> = new Map();
  private initialized = false;

  /**
   * Initialize the medication catalog with seed data
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Load seed medications
    SEED_MEDICATIONS.forEach((extMed) => {
      // Mapear ExtendedMedication a Medication
      const med: Medication = {
        id: extMed.id,
        name: extMed.brandName || extMed.genericName,
        genericName: extMed.genericName,
        manufacturer: extMed.manufacturer || '',
        dosageForm: (extMed.dosageForm || 'tablet') as any, // Cast temporal con default
        strength: extMed.strength || '',
        category: extMed.category || 'other',
        requiresPrescription: extMed.requiresPrescription || false,
        controlled: extMed.controlledSubstance || false,
        contraindications: extMed.contraindications,
        sideEffects: extMed.sideEffects,
        active: extMed.active !== undefined ? extMed.active : true,
      };
      this.medications.set(med.id, med);
    });

    this.initialized = true;
    logger.info('[MedicationCatalog] Initialized with', this.medications.size, 'medications');
  }

  /**
   * Search medications with pagination
   */
  async searchMedications(search: MedicationSearch): Promise<{
    medications: Medication[];
    total: number;
    hasMore: boolean;
  }> {
    await this.initialize();

    const { query, category, dosageForm, limit = 10, offset = 0 } = search;

    // Filter medications
    let results = Array.from(this.medications.values()).filter((med) => {
      // Search in generic name or commercial name
      const matchesQuery =
        !query ||
        query
          .toLowerCase()
          .split(' ')
          .every(
            (term: string) =>
              med.genericName.toLowerCase().includes(term) || med.name.toLowerCase().includes(term),
          );

      // Filter by category if provided
      const matchesCategory = !category || med.category === category;

      // Filter by dosage form if provided
      const matchesDosageForm = !dosageForm || med.dosageForm === dosageForm;

      return matchesQuery && matchesCategory && matchesDosageForm;
    });

    // Sort by relevance (exact match first)
    results.sort((a, b) => {
      const queryLower = query?.toLowerCase() || '';
      const aExact =
        a.genericName.toLowerCase() === queryLower || a.name.toLowerCase() === queryLower;
      const bExact =
        b.genericName.toLowerCase() === queryLower || b.name.toLowerCase() === queryLower;

      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return a.genericName.localeCompare(b.genericName);
    });

    const total = results.length;
    const paginatedResults = results.slice(offset, offset + limit);

    return {
      medications: paginatedResults,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get medication by ID
   */
  async getMedicationById(id: string): Promise<Medication | null> {
    await this.initialize();
    return this.medications.get(id) || null;
  }

  /**
   * Get medication by generic name
   */
  async getMedicationByName(genericName: string): Promise<Medication | null> {
    await this.initialize();

    const medication = Array.from(this.medications.values()).find(
      (med) => med.genericName.toLowerCase() === genericName.toLowerCase(),
    );

    return medication || null;
  }

  /**
   * Get all medication categories
   */
  async getCategories(): Promise<string[]> {
    await this.initialize();

    const categories = new Set<string>();
    this.medications.forEach((med) => {
      if (med.category) categories.add(med.category);
    });

    return Array.from(categories).sort();
  }

  /**
   * Add a new medication (admin only)
   */
  async addMedication(medication: Omit<Medication, 'id'>): Promise<Medication> {
    await this.initialize();

    const id = `med_${Date.now().toString(36)}`;
    const newMedication: Medication = {
      ...medication,
      id,
      genericName: medication.genericName || 'Unknown',
    };

    // Validate with schema (stub for now)
    const validated = newMedication;
    this.medications.set(validated.id, validated);

    return validated;
  }

  /**
   * Update medication (admin only)
   */
  async updateMedication(id: string, updates: Partial<Medication>): Promise<Medication | null> {
    await this.initialize();

    const existing = this.medications.get(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updates,
      id, // Preserve ID
    };

    const validated = updated;
    this.medications.set(id, validated);

    return validated;
  }

  /**
   * Check drug interactions (simplified version)
   */
  async checkInteractions(drugIds: string[]): Promise<{
    hasInteractions: boolean;
    interactions: Array<{
      drug1: string;
      drug2: string;
      severity: 'mild' | 'moderate' | 'severe';
      description: string;
    }>;
  }> {
    await this.initialize();

    // This is a simplified version. In production, this would query a drug interaction database
    const interactions: any[] = [];

    // Example interaction check
    if (drugIds.includes('med_003') && drugIds.includes('med_014')) {
      interactions.push({
        drug1: 'Amoxicilina',
        drug2: 'Levotiroxina',
        severity: 'mild',
        description:
          'Amoxicillin may reduce levothyroxine absorption. Separate administration by 4 hours.',
      });
    }

    return {
      hasInteractions: interactions.length > 0,
      interactions,
    };
  }

  /**
   * Get controlled substances (requires special handling)
   */
  async getControlledSubstances(): Promise<Medication[]> {
    await this.initialize();

    return Array.from(this.medications.values()).filter((med) => med.controlled);
  }
}

// Export singleton instance
export const medicationCatalogService = new MedicationCatalogService();

// Export for testing
export { MedicationCatalogService };
