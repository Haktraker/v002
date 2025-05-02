import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import { 
    ApiResponse, 
    HighRiskUser, 
    HighRiskUserQueryParams, 
    CreateHighRiskUserDto, 
    UpdateHighRiskUserDto, 
    PaginatedResponse // Import if your API returns paginated responses
} from '@/lib/api/types';
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// API Keys
export const HIGH_RISK_USERS_KEYS = {
  lists: (params?: HighRiskUserQueryParams) => ['highRiskUsers', params] as const,
  detail: (id: string) => ['highRiskUsers', id] as const,
};

// Base URL
const BASE_URL = '/uba/high-risk-users';

// Get all records (potentially paginated)
export const useGetHighRiskUsers = (params?: HighRiskUserQueryParams) => {
  const { withLoading } = useApiLoading();
  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== null && value !== undefined && value !== '')
  ) : {};

  // Adjust the return type based on whether the API is paginated
  return useQuery<PaginatedResponse<HighRiskUser>>({ 
    queryKey: HIGH_RISK_USERS_KEYS.lists(filteredParams),
    queryFn: async () => {
      const response = await withLoading(() => 
        apiClient.get<ApiResponse<PaginatedResponse<HighRiskUser>>>(BASE_URL, {
          params: filteredParams
        })
      );
      // Adjust based on your actual API response structure
      return response.data.data; 
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get record by ID
export const useGetHighRiskUserById = (id: string) => {
  const { withLoading } = useApiLoading();
  return useQuery<HighRiskUser>({ 
    queryKey: HIGH_RISK_USERS_KEYS.detail(id),
    queryFn: async () => {
      const response = await withLoading(() => 
        apiClient.get<ApiResponse<HighRiskUser>>(`${BASE_URL}/${id}`)
      );
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Create record
export const useCreateHighRiskUser = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<HighRiskUser, Error, CreateHighRiskUserDto>({ 
    mutationFn: async (newData: CreateHighRiskUserDto) => {
      const response = await withLoading(() => 
        apiClient.post<ApiResponse<HighRiskUser>>(BASE_URL, newData)
      );
      return response.data.data;
    },
    onSuccess: () => {
      showToast('High Risk User record created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: HIGH_RISK_USERS_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to create High Risk User record:', error);
      showToast(`Failed to create record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Update record
export const useUpdateHighRiskUser = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<HighRiskUser, Error, UpdateHighRiskUserDto & { id: string }>({ 
    mutationFn: async ({ id, ...updateData }: UpdateHighRiskUserDto & { id: string }) => {
      const response = await withLoading(() => 
        apiClient.patch<ApiResponse<HighRiskUser>>(`${BASE_URL}/${id}`, updateData)
      );
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('High Risk User record updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: HIGH_RISK_USERS_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: HIGH_RISK_USERS_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to update High Risk User record:', error);
      showToast(`Failed to update record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Delete record
export const useDeleteHighRiskUser = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ApiResponse<null>, Error, string>({ 
    mutationFn: async (id: string) => {
      const response = await withLoading(() => 
        apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`)
      );
      return response.data;
    },
    onSuccess: (_, id) => {
      showToast('High Risk User record deleted successfully', 'success');
      queryClient.removeQueries({ queryKey: HIGH_RISK_USERS_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: HIGH_RISK_USERS_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to delete High Risk User record:', error);
      showToast(`Failed to delete record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};
