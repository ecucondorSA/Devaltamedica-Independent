/**
 * Health metrics tracking hook
 * @module @altamedica/medical/hooks/useHealthMetrics
 */
import { calculateBMI, calculateHeartRateZones, classifyBloodPressure } from '../utils';
export interface HealthMetrics {
    weight?: number;
    height?: number;
    heartRate?: number;
    bloodPressure?: {
        systolic: number;
        diastolic: number;
    };
    temperature?: number;
    oxygenSaturation?: number;
}
export interface HealthMetricsAnalysis {
    bmi?: ReturnType<typeof calculateBMI>;
    heartRateZones?: ReturnType<typeof calculateHeartRateZones>;
    bloodPressureClassification?: ReturnType<typeof classifyBloodPressure>;
    alerts: string[];
}
export declare const useHealthMetrics: (initialMetrics?: HealthMetrics, patientAge?: number) => {
    metrics: HealthMetrics;
    analysis: HealthMetricsAnalysis;
    updateMetric: (key: keyof HealthMetrics, value: any) => void;
    updateBloodPressure: (systolic: number, diastolic: number) => void;
    hasAlerts: boolean;
    criticalAlerts: string[];
};
//# sourceMappingURL=useHealthMetrics.d.ts.map