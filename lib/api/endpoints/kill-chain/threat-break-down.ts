import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import { 
    ApiResponse, 
    ThreatBreakDown, 
    ThreatBreakDownQueryParams, 
    CreateThreatBreakDownDto, 
    UpdateThreatBreakDownDto 
} from '@/lib/api/types';
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// API Keys
export const THREAT_BREAK_DOWN_KEYS = {
  lists: (params?: ThreatBreakDownQueryParams) => ['threatBreakDown', params] as const,
  detail: (id: string) => ['threatBreakDown', id] as const,
};

// Base URL
const BASE_URL = '/reports/threat-breakdown';

// Get all records
export const useGetThreatBreakDowns = (params?: ThreatBreakDownQueryParams) => {
  const { withLoading } = useApiLoading();
  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== null && value !== undefined && value !== 'All')
  ) : {};

  return useQuery<{ data: ThreatBreakDown[] } | undefined>({ 
    queryKey: THREAT_BREAK_DOWN_KEYS.lists(filteredParams),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<{ data: ThreatBreakDown[] }>(BASE_URL, {
        params: filteredParams
      }));
      return response.data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get record by ID
export const useGetThreatBreakDownById = (id: string) => {
  const { withLoading } = useApiLoading();
  return useQuery<ThreatBreakDown>({
    queryKey: THREAT_BREAK_DOWN_KEYS.detail(id),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<ThreatBreakDown>>(`${BASE_URL}/${id}`));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Create record
export const useCreateThreatBreakDown = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ThreatBreakDown, Error, CreateThreatBreakDownDto>({
    mutationFn: async (newData: CreateThreatBreakDownDto) => {
      const response = await withLoading(() => apiClient.post<ApiResponse<ThreatBreakDown>>(BASE_URL, newData));
      return response.data.data;
    },
    onSuccess: () => {
      showToast('Threat Break Down record created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: THREAT_BREAK_DOWN_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to create record:', error);
      showToast(`Failed to create record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Update record
export const useUpdateThreatBreakDown = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ThreatBreakDown, Error, UpdateThreatBreakDownDto & { id: string }>({
    mutationFn: async ({ id, ...updateData }: UpdateThreatBreakDownDto & { id: string }) => {
      const response = await withLoading(() => apiClient.patch<ApiResponse<ThreatBreakDown>>(`${BASE_URL}/${id}`, updateData));
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('Threat Break Down record updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: THREAT_BREAK_DOWN_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: THREAT_BREAK_DOWN_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to update record:', error);
      showToast(`Failed to update record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Delete record
export const useDeleteThreatBreakDown = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ApiResponse<null>, Error, string>({
    mutationFn: async (id: string) => {
      const response = await withLoading(() => apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`));
      return response.data;
    },
    onSuccess: (_, id) => {
      showToast('Threat Break Down record deleted successfully', 'success');
      queryClient.removeQueries({ queryKey: THREAT_BREAK_DOWN_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: THREAT_BREAK_DOWN_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to delete record:', error);
      showToast(`Failed to delete record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};
