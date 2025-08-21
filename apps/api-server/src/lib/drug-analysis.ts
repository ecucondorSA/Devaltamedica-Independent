/**
 * 🧬 Drug Interaction Analysis Logic
 * Lógica de análisis de interacciones medicamentosas
 */
import { drugInteractions, severityLevels } from './drug-database';

export interface DrugInteractionResult {
  patientId: string;
  analysisDate: string;
  medications: any[];
  interactions: any[];
  contraindications: string[];
  recommendations: string[];
  riskLevel: 'low' | 'moderate' | 'high';
  monitoringRequired: string[];
}

export function analyzeDrugInteractions(data: any): DrugInteractionResult {
  const { patientId, medications, newMedication, patientInfo } = data;
  
  const allMedications = [...medications];
  if (newMedication) {
    allMedications.push(newMedication);
  }

  const interactions: any[] = [];
  const contraindications: string[] = [];
  const monitoringRequired: string[] = [];
  let highestRisk = 'low' as 'low' | 'moderate' | 'high';

  // Analizar interacciones entre medicamentos
  for (let i = 0; i < allMedications.length; i++) {
    for (let j = i + 1; j < allMedications.length; j++) {
      const med1 = allMedications[i].name.toLowerCase();
      const med2 = allMedications[j].name.toLowerCase();
      
      const interaction = findInteraction(med1, med2);
      if (interaction) {
        interactions.push({
          medication1: allMedications[i].name,
          medication2: allMedications[j].name,
          severity: interaction.severity,
          mechanism: interaction.mechanism,
          description: severityLevels[interaction.severity as keyof typeof severityLevels].description,
          action: severityLevels[interaction.severity as keyof typeof severityLevels].action
        });

        if (interaction.severity === 'high' && highestRisk !== 'high') {
          highestRisk = 'high';
        } else if (interaction.severity === 'moderate' && highestRisk === 'low') {
          highestRisk = 'moderate';
        }
      }
    }    // Verificar contraindicaciones
    const medName = allMedications[i].name.toLowerCase();
    const drugData = drugInteractions[medName as keyof typeof drugInteractions];
    if (drugData) {
      // Agregar contraindicaciones basadas en condiciones del paciente
      if (patientInfo.conditions) {
        drugData.contraindications?.forEach((contraindication: string) => {
          if (patientInfo.conditions.some((condition: string) => 
            condition.toLowerCase().includes(contraindication.toLowerCase()))) {
            contraindications.push(`${allMedications[i].name}: ${contraindication}`);
          }
        });
      }

      // Agregar monitoreo requerido
      drugData.monitoring?.forEach((monitor: string) => {
        if (!monitoringRequired.includes(monitor)) {
          monitoringRequired.push(monitor);
        }
      });
    }
  }

  const recommendations = generateRecommendations(interactions, contraindications, patientInfo);

  return {
    patientId,
    analysisDate: new Date().toISOString(),
    medications: allMedications,
    interactions,
    contraindications,
    recommendations,
    riskLevel: highestRisk,
    monitoringRequired
  };
}

function findInteraction(med1: string, med2: string) {
  const drugData1 = drugInteractions[med1 as keyof typeof drugInteractions];
  if (drugData1) {
    const interaction = drugData1.interactions.find(
      (inter: any) => inter.drug.toLowerCase() === med2
    );
    if (interaction) return interaction;
  }

  const drugData2 = drugInteractions[med2 as keyof typeof drugInteractions];
  if (drugData2) {
    const interaction = drugData2.interactions.find(
      (inter: any) => inter.drug.toLowerCase() === med1
    );
    if (interaction) return interaction;
  }

  return null;
}

function generateRecommendations(interactions: any[], contraindications: string[], patientInfo: any): string[] {
  const recommendations: string[] = [];

  if (interactions.length === 0) {
    recommendations.push('No se detectaron interacciones medicamentosas significativas.');
  }

  interactions.forEach((interaction: any) => {
    if (interaction.severity === 'high') {
      recommendations.push(`⚠️ CRÍTICO: Evitar la combinación de ${interaction.medication1} y ${interaction.medication2}. ${interaction.action}`);
    } else if (interaction.severity === 'moderate') {
      recommendations.push(`⚡ PRECAUCIÓN: ${interaction.medication1} y ${interaction.medication2} requieren monitoreo. ${interaction.action}`);
    }
  });

  if (contraindications.length > 0) {
    recommendations.push('❌ CONTRAINDICACIONES DETECTADAS: Revisar medicamentos con las condiciones del paciente.');
  }

  if (patientInfo.age >= 65) {
    recommendations.push('👴 PACIENTE GERIÁTRICO: Considerar ajustes de dosis por edad avanzada.');
  }

  if (patientInfo.kidneyFunction && patientInfo.kidneyFunction !== 'normal') {
    recommendations.push('🔍 FUNCIÓN RENAL COMPROMETIDA: Ajustar dosis según función renal.');
  }

  return recommendations;
}
