import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import { 
    ApiResponse, 
    AlertTypeDistribution, 
    AlertTypeDistributionQueryParams, 
    CreateAlertTypeDistributionDto, 
    UpdateAlertTypeDistributionDto 
} from '@/lib/api/types';
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// API Keys
export const ALERT_TYPE_DISTRIBUTION_KEYS = {
  lists: (params?: AlertTypeDistributionQueryParams) => ['alertTypeDistributions', params] as const,
  detail: (id: string) => ['alertTypeDistributions', id] as const,
};

// Base URL
const BASE_URL = '/bu-security/alert-type-distribution';

// Get all records
export const useGetAlertTypeDistributions = (params?: AlertTypeDistributionQueryParams) => {
  const { withLoading } = useApiLoading();
  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== null && value !== undefined)
  ) : {};

  return useQuery<AlertTypeDistribution[]>({ 
    queryKey: ALERT_TYPE_DISTRIBUTION_KEYS.lists(filteredParams),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<AlertTypeDistribution[]>>(BASE_URL, {
        params: filteredParams
      }));
      // Check if the actual data is nested under response.data.data or just response.data
      return response.data.data || response.data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get record by ID
export const useGetAlertTypeDistributionById = (id: string) => {
  const { withLoading } = useApiLoading();
  return useQuery<AlertTypeDistribution>({
    queryKey: ALERT_TYPE_DISTRIBUTION_KEYS.detail(id),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<AlertTypeDistribution>>(`${BASE_URL}/${id}`));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Create record
export const useCreateAlertTypeDistribution = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<AlertTypeDistribution, Error, CreateAlertTypeDistributionDto>({
    mutationFn: async (newData: CreateAlertTypeDistributionDto) => {
      const response = await withLoading(() => apiClient.post<ApiResponse<AlertTypeDistribution>>(BASE_URL, newData));
      return response.data.data;
    },
    onSuccess: () => {
      showToast('Alert Type Distribution record created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ALERT_TYPE_DISTRIBUTION_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to create record:', error);
      showToast(`Failed to create record: ${error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Update record
export const useUpdateAlertTypeDistribution = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<AlertTypeDistribution, Error, UpdateAlertTypeDistributionDto & { id: string }>({
    mutationFn: async ({ id, ...updateData }: UpdateAlertTypeDistributionDto & { id: string }) => {
      const response = await withLoading(() => apiClient.patch<ApiResponse<AlertTypeDistribution>>(`${BASE_URL}/${id}`, updateData));
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('Alert Type Distribution record updated successfully', 'success');
      // Invalidate both the detail and list queries on successful update
      queryClient.invalidateQueries({ queryKey: ALERT_TYPE_DISTRIBUTION_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ALERT_TYPE_DISTRIBUTION_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to update record:', error);
      showToast(`Failed to update record: ${error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Delete record
export const useDeleteAlertTypeDistribution = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ApiResponse<null>, Error, string>({
    mutationFn: async (id: string) => {
      const response = await withLoading(() => apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`));
      return response.data;
    },
    onSuccess: (_, id) => {
      showToast('Alert Type Distribution record deleted successfully', 'success');
      // Remove the specific detail query cache
      queryClient.removeQueries({ queryKey: ALERT_TYPE_DISTRIBUTION_KEYS.detail(id) });
      // Invalidate the list query to refresh the data
      queryClient.invalidateQueries({ queryKey: ALERT_TYPE_DISTRIBUTION_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to delete record:', error);
      showToast(`Failed to delete record: ${error.message || 'Unknown error'}`, 'error');
    },
  });
};
