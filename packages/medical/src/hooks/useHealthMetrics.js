/**
 * Health metrics tracking hook
 * @module @altamedica/medical/hooks/useHealthMetrics
 */
import { useState, useEffect, useCallback } from 'react';
import { calculateBMI, calculateHeartRateZones, classifyBloodPressure } from '../utils';
export const useHealthMetrics = (initialMetrics, patientAge) => {
    const [metrics, setMetrics] = useState(initialMetrics || {});
    const [analysis, setAnalysis] = useState({ alerts: [] });
    const updateMetric = useCallback((key, value) => {
        setMetrics(prev => ({ ...prev, [key]: value }));
    }, []);
    const updateBloodPressure = useCallback((systolic, diastolic) => {
        setMetrics(prev => ({
            ...prev,
            bloodPressure: { systolic, diastolic }
        }));
    }, []);
    // Analyze metrics whenever they change
    useEffect(() => {
        const newAnalysis = { alerts: [] };
        // BMI Analysis
        if (metrics.weight && metrics.height) {
            newAnalysis.bmi = calculateBMI(metrics.weight, metrics.height);
            if (newAnalysis.bmi.category === 'Obese') {
                newAnalysis.alerts.push('BMI indicates obesity - consider consultation');
            }
        }
        // Heart Rate Analysis
        if (metrics.heartRate && patientAge) {
            newAnalysis.heartRateZones = calculateHeartRateZones(patientAge);
            if (metrics.heartRate < 60) {
                newAnalysis.alerts.push('Heart rate is below normal resting rate');
            }
            else if (metrics.heartRate > 100) {
                newAnalysis.alerts.push('Heart rate is elevated');
            }
        }
        // Blood Pressure Analysis
        if (metrics.bloodPressure) {
            newAnalysis.bloodPressureClassification = classifyBloodPressure(metrics.bloodPressure.systolic, metrics.bloodPressure.diastolic);
            if (newAnalysis.bloodPressureClassification.severity === 'critical') {
                newAnalysis.alerts.push('CRITICAL: Hypertensive crisis - seek immediate medical attention');
            }
            else if (newAnalysis.bloodPressureClassification.severity === 'high') {
                newAnalysis.alerts.push('High blood pressure detected');
            }
        }
        // Temperature Analysis
        if (metrics.temperature) {
            if (metrics.temperature > 38) {
                newAnalysis.alerts.push('Fever detected');
            }
            else if (metrics.temperature < 35.5) {
                newAnalysis.alerts.push('Low body temperature detected');
            }
        }
        // Oxygen Saturation Analysis
        if (metrics.oxygenSaturation) {
            if (metrics.oxygenSaturation < 95) {
                newAnalysis.alerts.push('Low oxygen saturation - monitor closely');
            }
            if (metrics.oxygenSaturation < 90) {
                newAnalysis.alerts.push('CRITICAL: Very low oxygen saturation');
            }
        }
        setAnalysis(newAnalysis);
    }, [metrics, patientAge]);
    return {
        metrics,
        analysis,
        updateMetric,
        updateBloodPressure,
        hasAlerts: analysis.alerts.length > 0,
        criticalAlerts: analysis.alerts.filter(alert => alert.includes('CRITICAL'))
    };
};
//# sourceMappingURL=useHealthMetrics.js.map