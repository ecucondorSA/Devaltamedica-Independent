import { useTanstackQuery as useQuery, useMutation, useQueryClient } from '@altamedica/hooks/api';
import { getApiClient } from '../client';
import { API_ENDPOINTS } from '../endpoints';

// Local implementation to avoid cross-package re-export ambiguities during dts build
export function useAppointments(patientId?: string, filters?: { status?: string; type?: string }) {
	const apiClient = getApiClient();
	const queryParams = new URLSearchParams();
	if (patientId) queryParams.append('patientId', patientId);
	if (filters?.status) queryParams.append('status', filters.status);
	if (filters?.type) queryParams.append('type', filters.type);

	return useQuery({
		queryKey: ['appointments', patientId, filters],
		queryFn: () => apiClient.get(`${API_ENDPOINTS.appointments.list}?${queryParams.toString()}`),
		staleTime: 2 * 60 * 1000,
	});
}

export default useAppointments;
