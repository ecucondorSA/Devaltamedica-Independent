"use client";

import { useMutation } from "@tanstack/react-query";

export interface QuickDiagnosisResult {
  summary: string;
  severity?: "low" | "medium" | "high";
  createdAt: string;
}

export function useDiagnosisQuickAnalysis() {
  return useMutation<QuickDiagnosisResult, Error, { patientId?: string; symptoms: string[] }>(
    async ({ patientId, symptoms }) => {
      // TODO: reemplazar por POST real al api-server
      await new Promise((r) => setTimeout(r, 1500));
      const hasResp = symptoms.some((s) => /tos|fiebre|garganta|resp/i.test(s));
      return {
        summary: hasResp
          ? "Posible infección respiratoria leve. Se recomienda consulta con medicina general."
          : "Sin hallazgos evidentes. Si los síntomas persisten, consulte a su médico.",
        severity: hasResp ? "medium" : "low",
        createdAt: new Date().toISOString(),
      };
    }
  );
}

export default useDiagnosisQuickAnalysis;
