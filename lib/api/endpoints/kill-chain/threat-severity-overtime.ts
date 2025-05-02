import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import { 
    ApiResponse, 
    ThreatSeverityOverTime, 
    ThreatSeverityOverTimeQueryParams, 
    CreateThreatSeverityOverTimeDto, 
    UpdateThreatSeverityOverTimeDto 
} from '@/lib/api/types';
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// API Keys
export const THREAT_SEVERITY_OVERTIME_KEYS = {
  lists: (params?: ThreatSeverityOverTimeQueryParams) => ['threatSeverityOverTime', params] as const,
  detail: (id: string) => ['threatSeverityOverTime', id] as const,
};

// Base URL
const BASE_URL = '/reports/threat-severity-overtime';

// Get all records
export const useGetThreatSeverityOverTimes = (params?: ThreatSeverityOverTimeQueryParams) => {
  const { withLoading } = useApiLoading();
  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== null && value !== undefined && value !== 'All')
  ) : {};

  return useQuery<{ data: ThreatSeverityOverTime[] } | undefined>({ 
    queryKey: THREAT_SEVERITY_OVERTIME_KEYS.lists(filteredParams),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<{ data: ThreatSeverityOverTime[] }>(BASE_URL, {
        params: filteredParams
      }));
      return response.data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get record by ID
export const useGetThreatSeverityOverTimeById = (id: string) => {
  const { withLoading } = useApiLoading();
  return useQuery<ThreatSeverityOverTime>({
    queryKey: THREAT_SEVERITY_OVERTIME_KEYS.detail(id),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<ThreatSeverityOverTime>>(`${BASE_URL}/${id}`));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Create record
export const useCreateThreatSeverityOverTime = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ThreatSeverityOverTime, Error, CreateThreatSeverityOverTimeDto>({
    mutationFn: async (newData: CreateThreatSeverityOverTimeDto) => {
      const response = await withLoading(() => apiClient.post<ApiResponse<ThreatSeverityOverTime>>(BASE_URL, newData));
      return response.data.data;
    },
    onSuccess: () => {
      showToast('Threat Severity Over Time record created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: THREAT_SEVERITY_OVERTIME_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to create record:', error);
      showToast(`Failed to create record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Update record
export const useUpdateThreatSeverityOverTime = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ThreatSeverityOverTime, Error, UpdateThreatSeverityOverTimeDto & { id: string }>({
    mutationFn: async ({ id, ...updateData }: UpdateThreatSeverityOverTimeDto & { id: string }) => {
      const response = await withLoading(() => apiClient.patch<ApiResponse<ThreatSeverityOverTime>>(`${BASE_URL}/${id}`, updateData));
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('Threat Severity Over Time record updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: THREAT_SEVERITY_OVERTIME_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: THREAT_SEVERITY_OVERTIME_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to update record:', error);
      showToast(`Failed to update record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Delete record
export const useDeleteThreatSeverityOverTime = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ApiResponse<null>, Error, string>({
    mutationFn: async (id: string) => {
      const response = await withLoading(() => apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`));
      return response.data;
    },
    onSuccess: (_, id) => {
      showToast('Threat Severity Over Time record deleted successfully', 'success');
      queryClient.removeQueries({ queryKey: THREAT_SEVERITY_OVERTIME_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: THREAT_SEVERITY_OVERTIME_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to delete record:', error);
      showToast(`Failed to delete record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};
