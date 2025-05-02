import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import { 
    ApiResponse, 
    IncidentResponseMetrics, 
    IncidentResponseMetricsQueryParams, 
    CreateIncidentResponseMetricsDto, 
    UpdateIncidentResponseMetricsDto 
} from '@/lib/api/types';
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// API Keys
export const INCIDENT_RESPONSE_METRICS_KEYS = {
  lists: (params?: IncidentResponseMetricsQueryParams) => ['incidentResponseMetrics', params] as const,
  detail: (id: string) => ['incidentResponseMetrics', id] as const,
};

// Base URL
const BASE_URL = '/reports/incident-response-metrics';

// Get all records
export const useGetIncidentResponseMetrics = (params?: IncidentResponseMetricsQueryParams) => {
  const { withLoading } = useApiLoading();
  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== null && value !== undefined && value !== 'All')
  ) : {};

  return useQuery<{ data: IncidentResponseMetrics[] } | undefined>({ 
    queryKey: INCIDENT_RESPONSE_METRICS_KEYS.lists(filteredParams),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<{ data: IncidentResponseMetrics[] }>(BASE_URL, {
        params: filteredParams
      }));
      return response.data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get record by ID
export const useGetIncidentResponseMetricsById = (id: string) => {
  const { withLoading } = useApiLoading();
  return useQuery<IncidentResponseMetrics>({
    queryKey: INCIDENT_RESPONSE_METRICS_KEYS.detail(id),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<IncidentResponseMetrics>>(`${BASE_URL}/${id}`));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Create record
export const useCreateIncidentResponseMetrics = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<IncidentResponseMetrics, Error, CreateIncidentResponseMetricsDto>({
    mutationFn: async (newData: CreateIncidentResponseMetricsDto) => {
      const response = await withLoading(() => apiClient.post<ApiResponse<IncidentResponseMetrics>>(BASE_URL, newData));
      return response.data.data;
    },
    onSuccess: () => {
      showToast('Incident Response Metrics record created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: INCIDENT_RESPONSE_METRICS_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to create record:', error);
      showToast(`Failed to create record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Update record
export const useUpdateIncidentResponseMetrics = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<IncidentResponseMetrics, Error, UpdateIncidentResponseMetricsDto & { id: string }>({
    mutationFn: async ({ id, ...updateData }: UpdateIncidentResponseMetricsDto & { id: string }) => {
      const response = await withLoading(() => apiClient.patch<ApiResponse<IncidentResponseMetrics>>(`${BASE_URL}/${id}`, updateData));
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('Incident Response Metrics record updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: INCIDENT_RESPONSE_METRICS_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: INCIDENT_RESPONSE_METRICS_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to update record:', error);
      showToast(`Failed to update record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Delete record
export const useDeleteIncidentResponseMetrics = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ApiResponse<null>, Error, string>({
    mutationFn: async (id: string) => {
      const response = await withLoading(() => apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`));
      return response.data;
    },
    onSuccess: (_, id) => {
      showToast('Incident Response Metrics record deleted successfully', 'success');
      queryClient.removeQueries({ queryKey: INCIDENT_RESPONSE_METRICS_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: INCIDENT_RESPONSE_METRICS_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to delete record:', error);
      showToast(`Failed to delete record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};
