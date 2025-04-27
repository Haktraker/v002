import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import { ApiResponse, BuAlerts, BuAlertsQueryParams, CreateBuAlertsDto, UpdateBuAlertsDto } from '@/lib/api/types';
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// API Keys for Business Unit Alerts
export const BU_ALERTS_KEYS = {
  lists: (params?: BuAlertsQueryParams) => ['buAlerts', params] as const,
  detail: (id: string) => ['buAlerts', id] as const,
};

// Base URL for all BU alerts endpoints
const BASE_URL = '/bu-security/bu-alerts';

// Get all BU alerts
export const useGetBuAlerts = (params?: BuAlertsQueryParams) => {
  const { withLoading } = useApiLoading();

  // Filter out null/undefined params
  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== null && value !== undefined)
  ) : {};

  return useQuery<BuAlerts[]>({ // Expecting an array of BuAlerts
    queryKey: BU_ALERTS_KEYS.lists(filteredParams),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<BuAlerts[]>>(BASE_URL, {
        params: filteredParams
      }));
      // Assuming the API returns data directly in response.data or response.data.data
      // Adjust based on your actual API response structure
      return response.data.data || response.data; 
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get BU alert by ID
export const useGetBuAlertById = (id: string) => {
  const { withLoading } = useApiLoading();

  return useQuery({
    queryKey: BU_ALERTS_KEYS.detail(id),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<BuAlerts>>(`${BASE_URL}/${id}`));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Create BU alert
export const useCreateBuAlerts = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (newBuAlert: CreateBuAlertsDto) => {
      const response = await withLoading(() => apiClient.post<ApiResponse<BuAlerts>>(BASE_URL, newBuAlert));
      return response.data.data;
    },
    onSuccess: () => {
      showToast('BU Alert record created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: BU_ALERTS_KEYS.lists({}) });
    },
    onError: (error: any) => {
      console.error('Failed to create BU Alert record:', error);
      showToast('Failed to create BU Alert record', 'error');
    },
  });
};

// Update BU alert
export const useUpdateBuAlerts = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateBuAlertsDto & { id: string }) => {
      const response = await withLoading(() => apiClient.patch<ApiResponse<BuAlerts>>(`${BASE_URL}/${id}`, updateData));
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('BU Alert record updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: BU_ALERTS_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: BU_ALERTS_KEYS.lists({}) });
    },
    onError: (error: any) => {
      console.error('Failed to update BU Alert record:', error);
      showToast('Failed to update BU Alert record', 'error');
    },
  });
};

// Delete BU alert
export const useDeleteBuAlerts = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await withLoading(() => apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`));
      // Check API response structure, typically delete returns success/message or null data
      return response.data; 
    },
    onSuccess: (_, id) => {
      showToast('BU Alert record deleted successfully', 'success');
      queryClient.removeQueries({ queryKey: BU_ALERTS_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: BU_ALERTS_KEYS.lists({}) });
    },
    onError: (error: any) => {
      console.error('Failed to delete BU Alert record:', error);
      showToast('Failed to delete BU Alert record', 'error');
    },
  });
};
