export type DiagnosticSuggestion = {
  conditionCode: string;
  confidence: number;
  rationale: string;
};

export function getPreliminaryDiagnosis(symptoms: string[]): DiagnosticSuggestion[] {
  if (symptoms.length === 0) return [];
  return [
    {
      conditionCode: 'UNSPECIFIED',
      confidence: 0.1,
      rationale: 'Stub de diagnóstico: implementar lógica clínica real.',
    },
  ];
}
