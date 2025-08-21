"use client";

import { useQuery } from "@tanstack/react-query";

export interface DiagnosisRestriction {
  canUse: boolean;
  nextAvailableDate?: string;
  daysRemaining?: number;
  totalDiagnosesCount: number;
  lastDiagnosisDate?: string;
}

export function useDiagnosisRestrictions(patientId?: string) {
  return useQuery<DiagnosisRestriction>({
    queryKey: ["ai-diagnosis", "restrictions", patientId ?? "anon"],
    enabled: !!patientId, // si no hay paciente, no consulta
    queryFn: async () => {
      // TODO: reemplazar con llamada real a api-server
      // Mock: permitir uso si pasaron 10 días desde lastDiagnosis
      const lastDateStr = typeof window !== "undefined" ? localStorage.getItem("lastDiagnosisDate") : null;
      const count = typeof window !== "undefined" ? parseInt(localStorage.getItem("diagnosisCount") || "0") : 0;
      if (lastDateStr) {
        const daysSince = Math.floor((Date.now() - new Date(lastDateStr).getTime()) / (1000 * 60 * 60 * 24));
        const canUse = daysSince >= 10;
        return {
          canUse,
          nextAvailableDate: canUse ? undefined : new Date(new Date(lastDateStr).getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          daysRemaining: canUse ? 0 : 10 - daysSince,
          totalDiagnosesCount: count,
          lastDiagnosisDate: lastDateStr,
        } as DiagnosisRestriction;
      }
      return { canUse: true, totalDiagnosesCount: count } as DiagnosisRestriction;
    },
  });
}

export default useDiagnosisRestrictions;
