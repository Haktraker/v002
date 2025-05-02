import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import { 
    ApiResponse, 
    UserBehaviorPatternAnalysis, 
    UserBehaviorPatternAnalysisQueryParams, 
    CreateUserBehaviorPatternAnalysisDto, 
    UpdateUserBehaviorPatternAnalysisDto 
} from '@/lib/api/types';
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// API Keys
export const USER_BEHAVIOR_PATTERN_ANALYSIS_KEYS = {
  lists: (params?: UserBehaviorPatternAnalysisQueryParams) => ['userBehaviorPatternAnalysis', params] as const,
  detail: (id: string) => ['userBehaviorPatternAnalysis', id] as const,
};

// Base URL
const BASE_URL = '/uba/user-behavior-pattern-analysis';

// Get all records
export const useGetUserBehaviorPatternAnalyses = (params?: UserBehaviorPatternAnalysisQueryParams) => {
  const { withLoading } = useApiLoading();
  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== null && value !== undefined && value !== 'All')
  ) : {};

  return useQuery<{ data: UserBehaviorPatternAnalysis[] } | undefined>({ 
    queryKey: USER_BEHAVIOR_PATTERN_ANALYSIS_KEYS.lists(filteredParams),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<{ data: UserBehaviorPatternAnalysis[] }>(BASE_URL, {
        params: filteredParams
      }));
      return response.data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get record by ID
export const useGetUserBehaviorPatternAnalysisById = (id: string) => {
  const { withLoading } = useApiLoading();
  return useQuery<UserBehaviorPatternAnalysis>({
    queryKey: USER_BEHAVIOR_PATTERN_ANALYSIS_KEYS.detail(id),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<UserBehaviorPatternAnalysis>>(`${BASE_URL}/${id}`));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Create record
export const useCreateUserBehaviorPatternAnalysis = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<UserBehaviorPatternAnalysis, Error, CreateUserBehaviorPatternAnalysisDto>({
    mutationFn: async (newData: CreateUserBehaviorPatternAnalysisDto) => {
      const response = await withLoading(() => apiClient.post<ApiResponse<UserBehaviorPatternAnalysis>>(BASE_URL, newData));
      return response.data.data;
    },
    onSuccess: () => {
      showToast('User Behavior Pattern Analysis record created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: USER_BEHAVIOR_PATTERN_ANALYSIS_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to create record:', error);
      showToast(`Failed to create record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Update record
export const useUpdateUserBehaviorPatternAnalysis = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<UserBehaviorPatternAnalysis, Error, UpdateUserBehaviorPatternAnalysisDto & { id: string }>({
    mutationFn: async ({ id, ...updateData }: UpdateUserBehaviorPatternAnalysisDto & { id: string }) => {
      const response = await withLoading(() => apiClient.patch<ApiResponse<UserBehaviorPatternAnalysis>>(`${BASE_URL}/${id}`, updateData));
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('User Behavior Pattern Analysis record updated successfully', 'success');
      // Invalidate both the detail and list queries on successful update
      queryClient.invalidateQueries({ queryKey: USER_BEHAVIOR_PATTERN_ANALYSIS_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: USER_BEHAVIOR_PATTERN_ANALYSIS_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to update record:', error);
      showToast(`Failed to update record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Delete record
export const useDeleteUserBehaviorPatternAnalysis = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ApiResponse<null>, Error, string>({
    mutationFn: async (id: string) => {
      const response = await withLoading(() => apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`));
      return response.data;
    },
    onSuccess: (_, id) => {
      showToast('User Behavior Pattern Analysis record deleted successfully', 'success');
      // Remove the specific detail query cache
      queryClient.removeQueries({ queryKey: USER_BEHAVIOR_PATTERN_ANALYSIS_KEYS.detail(id) });
      // Invalidate the list query to refresh the data
      queryClient.invalidateQueries({ queryKey: USER_BEHAVIOR_PATTERN_ANALYSIS_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to delete record:', error);
      showToast(`Failed to delete record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};
