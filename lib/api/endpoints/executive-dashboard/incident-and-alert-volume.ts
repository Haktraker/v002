import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import {
    ApiResponse,
    IncidentAndAlertVolume,
    IncidentAndAlertVolumeQueryParams,
    CreateIncidentAndAlertVolumeDto,
    UpdateIncidentAndAlertVolumeDto
} from '@/lib/api/executive-dashboard-types/types';
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// API Keys
export const INCIDENT_ALERT_VOLUME_KEYS = {
  lists: (params?: IncidentAndAlertVolumeQueryParams) => ['incidentAlertVolume', params] as const,
  detail: (id: string) => ['incidentAlertVolume', id] as const,
};

// Base URL
const BASE_URL = '/executive-dashboard/incidents-qu'; // Note: URL seems short, verify if correct

// Get all records
export const useGetIncidentAlertVolumes = (params?: IncidentAndAlertVolumeQueryParams) => {
  const { withLoading } = useApiLoading();
  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== null && value !== undefined && value !== 'All')
  ) : {};

  return useQuery<{ data: IncidentAndAlertVolume[] } | undefined>({ // Assuming { data: [...] }
    queryKey: INCIDENT_ALERT_VOLUME_KEYS.lists(filteredParams),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<{ data: IncidentAndAlertVolume[] }>(BASE_URL, {
        params: filteredParams
      }));
      // Sort data chronologically (Year then Month) before returning if needed
      // response.data.data.sort((a, b) => ...);
      return response.data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get record by ID
export const useGetIncidentAlertVolumeById = (id: string) => {
  const { withLoading } = useApiLoading();
  return useQuery<IncidentAndAlertVolume>({
    queryKey: INCIDENT_ALERT_VOLUME_KEYS.detail(id),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<IncidentAndAlertVolume>>(`${BASE_URL}/${id}`));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Create record
export const useCreateIncidentAlertVolume = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<IncidentAndAlertVolume, Error, CreateIncidentAndAlertVolumeDto>({
    mutationFn: async (newData: CreateIncidentAndAlertVolumeDto) => {
      const response = await withLoading(() => apiClient.post<ApiResponse<IncidentAndAlertVolume>>(BASE_URL, newData));
      return response.data.data;
    },
    onSuccess: () => {
      showToast('Incident/Alert Volume record created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: INCIDENT_ALERT_VOLUME_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to create record:', error);
      // Check for specific unique constraint error from backend if possible
      const message = error.response?.data?.message || error.message || 'Unknown error';
      showToast(`Failed to create record: ${message}`, 'error');
    },
  });
};

// Update record
export const useUpdateIncidentAlertVolume = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<IncidentAndAlertVolume, Error, UpdateIncidentAndAlertVolumeDto & { id: string }>({
    mutationFn: async ({ id, ...updateData }: UpdateIncidentAndAlertVolumeDto & { id: string }) => {
      const response = await withLoading(() => apiClient.patch<ApiResponse<IncidentAndAlertVolume>>(`${BASE_URL}/${id}`, updateData));
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('Incident/Alert Volume record updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: INCIDENT_ALERT_VOLUME_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: INCIDENT_ALERT_VOLUME_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to update record:', error);
       const message = error.response?.data?.message || error.message || 'Unknown error';
      showToast(`Failed to update record: ${message}`, 'error');
    },
  });
};

// Delete record
export const useDeleteIncidentAlertVolume = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ApiResponse<null>, Error, string>({
    mutationFn: async (id: string) => {
      const response = await withLoading(() => apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`));
      return response.data;
    },
    onSuccess: (_, id) => {
      showToast('Incident/Alert Volume record deleted successfully', 'success');
      queryClient.removeQueries({ queryKey: INCIDENT_ALERT_VOLUME_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: INCIDENT_ALERT_VOLUME_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to delete record:', error);
      showToast(`Failed to delete record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};
