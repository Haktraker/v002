import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import {
    ApiResponse,
    SecurityBreachIndicators,
    SecurityBreachIndicatorsQueryParams,
    CreateSecurityBreachIndicatorsDto,
    UpdateSecurityBreachIndicatorsDto
} from '@/lib/api/executive-dashboard-types/types';
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// API Keys
export const SECURITY_BREACH_INDICATORS_KEYS = {
  lists: (params?: SecurityBreachIndicatorsQueryParams) => ['securityBreachIndicators', params] as const,
  detail: (id: string) => ['securityBreachIndicators', id] as const,
};

// Base URL
const BASE_URL = '/executive-dashboard/security-breach-indicators';

// Get all records
export const useGetSecurityBreachIndicators = (params?: SecurityBreachIndicatorsQueryParams) => {
  const { withLoading } = useApiLoading();
  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== null && value !== undefined && value !== 'All')
  ) : {};

  return useQuery<{ data: SecurityBreachIndicators[] } | undefined>({ // Assuming the API returns { data: [...] }
    queryKey: SECURITY_BREACH_INDICATORS_KEYS.lists(filteredParams),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<{ data: SecurityBreachIndicators[] }>(BASE_URL, {
        params: filteredParams
      }));
      return response.data; // Return the whole response object containing the data array
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get record by ID
export const useGetSecurityBreachIndicatorById = (id: string) => {
  const { withLoading } = useApiLoading();
  return useQuery<SecurityBreachIndicators>({
    queryKey: SECURITY_BREACH_INDICATORS_KEYS.detail(id),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<SecurityBreachIndicators>>(`${BASE_URL}/${id}`));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Create record
export const useCreateSecurityBreachIndicator = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<SecurityBreachIndicators, Error, CreateSecurityBreachIndicatorsDto>({
    mutationFn: async (newData: CreateSecurityBreachIndicatorsDto) => {
      const response = await withLoading(() => apiClient.post<ApiResponse<SecurityBreachIndicators>>(BASE_URL, newData));
      return response.data.data;
    },
    onSuccess: () => {
      showToast('Security Breach Indicator record created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: SECURITY_BREACH_INDICATORS_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to create record:', error);
      showToast(`Failed to create record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Update record
export const useUpdateSecurityBreachIndicator = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<SecurityBreachIndicators, Error, UpdateSecurityBreachIndicatorsDto & { id: string }>({
    mutationFn: async ({ id, ...updateData }: UpdateSecurityBreachIndicatorsDto & { id: string }) => {
      const response = await withLoading(() => apiClient.patch<ApiResponse<SecurityBreachIndicators>>(`${BASE_URL}/${id}`, updateData));
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('Security Breach Indicator record updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: SECURITY_BREACH_INDICATORS_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: SECURITY_BREACH_INDICATORS_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to update record:', error);
      showToast(`Failed to update record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Delete record
export const useDeleteSecurityBreachIndicator = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ApiResponse<null>, Error, string>({
    mutationFn: async (id: string) => {
      const response = await withLoading(() => apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`));
      return response.data;
    },
    onSuccess: (_, id) => {
      showToast('Security Breach Indicator record deleted successfully', 'success');
      queryClient.removeQueries({ queryKey: SECURITY_BREACH_INDICATORS_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: SECURITY_BREACH_INDICATORS_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to delete record:', error);
      showToast(`Failed to delete record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};
