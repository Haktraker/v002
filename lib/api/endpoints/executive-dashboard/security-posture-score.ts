import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import {
    ApiResponse,
    SecurityPostureScore,
    SecurityPostureScoreQueryParams,
    CreateSecurityPostureScoreDto,
    UpdateSecurityPostureScoreDto
} from '@/lib/api/executive-dashboard-types/types';
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// API Keys
export const SECURITY_POSTURE_SCORE_KEYS = {
  lists: (params?: SecurityPostureScoreQueryParams) => ['securityPostureScore', params] as const,
  detail: (id: string) => ['securityPostureScore', id] as const,
};

// Base URL
const BASE_URL = '/executive-dashboard/security-posture-score';

// Get all records
export const useGetSecurityPostureScores = (params?: SecurityPostureScoreQueryParams) => {
  const { withLoading } = useApiLoading();
  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== null && value !== undefined && value !== 'All')
  ) : {};

  return useQuery<{ data: SecurityPostureScore[] } | undefined>({ // Adjusted return type assumption
    queryKey: SECURITY_POSTURE_SCORE_KEYS.lists(filteredParams),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<{ data: SecurityPostureScore[] }>(BASE_URL, {
        params: filteredParams
      }));
      return response.data; // Assuming the data is directly under response.data
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get record by ID
export const useGetSecurityPostureScoreById = (id: string) => {
  const { withLoading } = useApiLoading();
  return useQuery<SecurityPostureScore>({
    queryKey: SECURITY_POSTURE_SCORE_KEYS.detail(id),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<SecurityPostureScore>>(`${BASE_URL}/${id}`));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Create record
export const useCreateSecurityPostureScore = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<SecurityPostureScore, Error, CreateSecurityPostureScoreDto>({
    mutationFn: async (newData: CreateSecurityPostureScoreDto) => {
      const response = await withLoading(() => apiClient.post<ApiResponse<SecurityPostureScore>>(BASE_URL, newData));
      return response.data.data;
    },
    onSuccess: () => {
      showToast('Security Posture Score record created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: SECURITY_POSTURE_SCORE_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to create record:', error);
      showToast(`Failed to create Security Posture Score record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Update record
export const useUpdateSecurityPostureScore = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<SecurityPostureScore, Error, UpdateSecurityPostureScoreDto & { id: string }>({
    mutationFn: async ({ id, ...updateData }: UpdateSecurityPostureScoreDto & { id: string }) => {
      const response = await withLoading(() => apiClient.patch<ApiResponse<SecurityPostureScore>>(`${BASE_URL}/${id}`, updateData));
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('Security Posture Score record updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: SECURITY_POSTURE_SCORE_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: SECURITY_POSTURE_SCORE_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to update record:', error);
      showToast(`Failed to update Security Posture Score record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Delete record
export const useDeleteSecurityPostureScore = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ApiResponse<null>, Error, string>({
    mutationFn: async (id: string) => {
      const response = await withLoading(() => apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`));
      return response.data;
    },
    onSuccess: (_, id) => {
      showToast('Security Posture Score record deleted successfully', 'success');
      queryClient.removeQueries({ queryKey: SECURITY_POSTURE_SCORE_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: SECURITY_POSTURE_SCORE_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to delete record:', error);
      showToast(`Failed to delete Security Posture Score record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};
