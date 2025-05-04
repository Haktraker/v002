import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import {
    ApiResponse,
    ReportsIncidentAlertVolume,
    ReportsIncidentAlertVolumeQueryParams,
    CreateReportsIncidentAlertVolumeDto,
    UpdateReportsIncidentAlertVolumeDto
} from '@/lib/api/reports-types/types';
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// API Keys
export const REPORTS_INCIDENT_ALERT_VOLUME_KEYS = {
  lists: (params?: ReportsIncidentAlertVolumeQueryParams) => ['reportsIncidentAlertVolume', params] as const,
  detail: (id: string) => ['reportsIncidentAlertVolume', id] as const,
};

// Base URL
const BASE_URL = '/reports/monthly-incident';

// Get all records
export const useGetReportsIncidentAlertVolumes = (params?: ReportsIncidentAlertVolumeQueryParams) => {
  const { withLoading } = useApiLoading();
  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== null && value !== undefined && value !== 'All')
  ) : {};

  return useQuery<{ data: ReportsIncidentAlertVolume[], pagination?: ApiResponse<any>['pagination'] }>({ 
    queryKey: REPORTS_INCIDENT_ALERT_VOLUME_KEYS.lists(filteredParams),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<ReportsIncidentAlertVolume[]>>(BASE_URL, {
        params: filteredParams
      }));
      return { data: response.data.data, pagination: response.data.pagination };
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get record by ID
export const useGetReportsIncidentAlertVolumeById = (id: string) => {
  const { withLoading } = useApiLoading();
  return useQuery<ReportsIncidentAlertVolume>({ 
    queryKey: REPORTS_INCIDENT_ALERT_VOLUME_KEYS.detail(id),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<ReportsIncidentAlertVolume>>(`${BASE_URL}/${id}`));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Create record
export const useCreateReportsIncidentAlertVolume = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ReportsIncidentAlertVolume, Error, CreateReportsIncidentAlertVolumeDto>({ 
    mutationFn: async (newData: CreateReportsIncidentAlertVolumeDto) => {
      const response = await withLoading(() => apiClient.post<ApiResponse<ReportsIncidentAlertVolume>>(BASE_URL, newData));
      return response.data.data;
    },
    onSuccess: () => {
      showToast('Incident/Alert Volume record created successfully', 'success'); 
      queryClient.invalidateQueries({ queryKey: REPORTS_INCIDENT_ALERT_VOLUME_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to create record:', error);
      showToast(`Failed to create Incident/Alert Volume record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Update record
export const useUpdateReportsIncidentAlertVolume = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ReportsIncidentAlertVolume, Error, UpdateReportsIncidentAlertVolumeDto & { id: string }>({ 
    mutationFn: async ({ id, ...updateData }: UpdateReportsIncidentAlertVolumeDto & { id: string }) => {
      const response = await withLoading(() => apiClient.patch<ApiResponse<ReportsIncidentAlertVolume>>(`${BASE_URL}/${id}`, updateData));
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('Incident/Alert Volume record updated successfully', 'success'); 
      queryClient.invalidateQueries({ queryKey: REPORTS_INCIDENT_ALERT_VOLUME_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: REPORTS_INCIDENT_ALERT_VOLUME_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to update record:', error);
      showToast(`Failed to update Incident/Alert Volume record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Delete record
export const useDeleteReportsIncidentAlertVolume = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ApiResponse<null>, Error, string>({ 
    mutationFn: async (id: string) => {
      const response = await withLoading(() => apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`));
      return response.data;
    },
    onSuccess: (_, id) => {
      showToast('Incident/Alert Volume record deleted successfully', 'success'); 
      queryClient.removeQueries({ queryKey: REPORTS_INCIDENT_ALERT_VOLUME_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: REPORTS_INCIDENT_ALERT_VOLUME_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to delete record:', error);
      showToast(`Failed to delete Incident/Alert Volume record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};
