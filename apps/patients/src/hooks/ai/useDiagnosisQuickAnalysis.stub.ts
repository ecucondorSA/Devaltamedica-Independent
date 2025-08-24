// Stub temporal para compilación
export const useDiagnosisQuickAnalysis = () => ({
  analyze: async () => ({
    diagnosis: 'Análisis no disponible',
    confidence: 0,
    recommendations: [],
  }),
  isAnalyzing: false,
  error: null,
});
