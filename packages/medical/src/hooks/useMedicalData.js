/**
 * Medical data fetching hook
 * @module @altamedica/medical/hooks/useMedicalData
 */
import { useCallback, useState } from 'react';
export const useMedicalData = (apiBaseUrl = '/api/v1') => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const handleError = (err) => {
        const message = err.message || 'An error occurred';
        setError(message);
        // logger.error('Medical data error:', err); // This line was commented out
        return [];
    };
    const fetchPatients = useCallback(async (filters) => {
        setLoading(true);
        setError(null);
        try {
            const queryParams = new URLSearchParams();
            if (filters?.search)
                queryParams.append('search', filters.search);
            if (filters?.status)
                queryParams.append('status', filters.status);
            if (filters?.hasConditions !== undefined) {
                queryParams.append('hasConditions', filters.hasConditions.toString());
            }
            const response = await fetch(`${apiBaseUrl}/patients?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok)
                throw new Error('Failed to fetch patients');
            const data = await response.json();
            return data.patients || [];
        }
        catch (err) {
            return handleError(err);
        }
        finally {
            setLoading(false);
        }
    }, [apiBaseUrl]);
    const fetchDoctors = useCallback(async (filters) => {
        setLoading(true);
        setError(null);
        try {
            const queryParams = new URLSearchParams();
            if (filters?.search)
                queryParams.append('search', filters.search);
            if (filters?.specialization)
                queryParams.append('specialization', filters.specialization);
            if (filters?.available !== undefined) {
                queryParams.append('available', filters.available.toString());
            }
            const response = await fetch(`${apiBaseUrl}/doctors?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok)
                throw new Error('Failed to fetch doctors');
            const data = await response.json();
            return data.doctors || [];
        }
        catch (err) {
            return handleError(err);
        }
        finally {
            setLoading(false);
        }
    }, [apiBaseUrl]);
    const fetchAppointments = useCallback(async (filters) => {
        setLoading(true);
        setError(null);
        try {
            const queryParams = new URLSearchParams();
            if (filters?.patientId)
                queryParams.append('patientId', filters.patientId);
            if (filters?.doctorId)
                queryParams.append('doctorId', filters.doctorId);
            if (filters?.status)
                queryParams.append('status', filters.status);
            if (filters?.dateFrom)
                queryParams.append('dateFrom', filters.dateFrom.toISOString());
            if (filters?.dateTo)
                queryParams.append('dateTo', filters.dateTo.toISOString());
            const response = await fetch(`${apiBaseUrl}/appointments?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok)
                throw new Error('Failed to fetch appointments');
            const data = await response.json();
            return data.appointments || [];
        }
        catch (err) {
            return handleError(err);
        }
        finally {
            setLoading(false);
        }
    }, [apiBaseUrl]);
    const fetchMedicalRecords = useCallback(async (patientId) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${apiBaseUrl}/patients/${patientId}/medical-records`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok)
                throw new Error('Failed to fetch medical records');
            const data = await response.json();
            return data.records || [];
        }
        catch (err) {
            return handleError(err);
        }
        finally {
            setLoading(false);
        }
    }, [apiBaseUrl]);
    return {
        loading,
        error,
        fetchPatients,
        fetchDoctors,
        fetchAppointments,
        fetchMedicalRecords
    };
};
//# sourceMappingURL=useMedicalData.js.map