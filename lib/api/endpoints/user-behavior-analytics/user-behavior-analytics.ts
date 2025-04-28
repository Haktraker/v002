import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import { 
    ApiResponse, 
    UserBehaviorAnalytics, 
    UserBehaviorAnalyticsQueryParams, 
    CreateUserBehaviorAnalyticsDto, 
    UpdateUserBehaviorAnalyticsDto 
} from '@/lib/api/types';
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// API Keys
export const USER_BEHAVIOR_ANALYTICS_KEYS = {
  lists: (params?: UserBehaviorAnalyticsQueryParams) => ['userBehaviorAnalytics', params] as const,
  detail: (id: string) => ['userBehaviorAnalytics', id] as const,
};

// Base URL
const BASE_URL = '/uba/analytics';

// Get all records
export const useGetUserBehaviorAnalytics = (params?: UserBehaviorAnalyticsQueryParams) => {
  const { withLoading } = useApiLoading();
  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== null && value !== undefined)
  ) : {};

  return useQuery<UserBehaviorAnalytics[]>({ 
    queryKey: USER_BEHAVIOR_ANALYTICS_KEYS.lists(filteredParams),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<UserBehaviorAnalytics[]>>(BASE_URL, {
        params: filteredParams
      }));
      // Check if the actual data is nested under response.data.data or just response.data
      return response.data.data || response.data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get record by ID
export const useGetUserBehaviorAnalyticsById = (id: string) => {
  const { withLoading } = useApiLoading();
  return useQuery<UserBehaviorAnalytics>({
    queryKey: USER_BEHAVIOR_ANALYTICS_KEYS.detail(id),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<UserBehaviorAnalytics>>(`${BASE_URL}/${id}`));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Create record
export const useCreateUserBehaviorAnalytics = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<UserBehaviorAnalytics, Error, CreateUserBehaviorAnalyticsDto>({
    mutationFn: async (newData: CreateUserBehaviorAnalyticsDto) => {
      const response = await withLoading(() => apiClient.post<ApiResponse<UserBehaviorAnalytics>>(BASE_URL, newData));
      return response.data.data;
    },
    onSuccess: () => {
      showToast('User Behavior Analytics record created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: USER_BEHAVIOR_ANALYTICS_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to create record:', error);
      showToast(`Failed to create record: ${error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Update record
export const useUpdateUserBehaviorAnalytics = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<UserBehaviorAnalytics, Error, UpdateUserBehaviorAnalyticsDto & { id: string }>({
    mutationFn: async ({ id, ...updateData }: UpdateUserBehaviorAnalyticsDto & { id: string }) => {
      const response = await withLoading(() => apiClient.patch<ApiResponse<UserBehaviorAnalytics>>(`${BASE_URL}/${id}`, updateData));
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('User Behavior Analytics record updated successfully', 'success');
      // Invalidate both the detail and list queries on successful update
      queryClient.invalidateQueries({ queryKey: USER_BEHAVIOR_ANALYTICS_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: USER_BEHAVIOR_ANALYTICS_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to update record:', error);
      showToast(`Failed to update record: ${error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Delete record
export const useDeleteUserBehaviorAnalytics = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ApiResponse<null>, Error, string>({
    mutationFn: async (id: string) => {
      const response = await withLoading(() => apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`));
      return response.data;
    },
    onSuccess: (_, id) => {
      showToast('User Behavior Analytics record deleted successfully', 'success');
      // Remove the specific detail query cache
      queryClient.removeQueries({ queryKey: USER_BEHAVIOR_ANALYTICS_KEYS.detail(id) });
      // Invalidate the list query to refresh the data
      queryClient.invalidateQueries({ queryKey: USER_BEHAVIOR_ANALYTICS_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to delete record:', error);
      showToast(`Failed to delete record: ${error.message || 'Unknown error'}`, 'error');
    },
  });
};
