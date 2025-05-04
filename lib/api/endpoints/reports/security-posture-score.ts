import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import {
    ApiResponse,
    ReportsSecurityPostureScore,
    ReportsSecurityPostureScoreQueryParams,
    CreateReportsSecurityPostureScoreDto,
    UpdateReportsSecurityPostureScoreDto
} from '@/lib/api/reports-types/types'; // Updated import path
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// API Keys for Reports Security Posture Score
export const REPORTS_SECURITY_POSTURE_SCORE_KEYS = {
  lists: (params?: ReportsSecurityPostureScoreQueryParams) => ['reportsSecurityPostureScore', params] as const,
  detail: (id: string) => ['reportsSecurityPostureScore', id] as const,
};

// Base URL for Reports Security Posture Score
const BASE_URL = '/reports/security-posture-score';

// Get all records
export const useGetReportsSecurityPostureScores = (params?: ReportsSecurityPostureScoreQueryParams) => {
  const { withLoading } = useApiLoading();
  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== null && value !== undefined && value !== 'All')
  ) : {};

  return useQuery<{ data: ReportsSecurityPostureScore[], pagination?: ApiResponse<any>['pagination'] }>({ // Adjusted to potentially include pagination
    queryKey: REPORTS_SECURITY_POSTURE_SCORE_KEYS.lists(filteredParams),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<ReportsSecurityPostureScore[]>>(BASE_URL, {
        params: filteredParams
      }));
      return { data: response.data.data, pagination: response.data.pagination };
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get record by ID
export const useGetReportsSecurityPostureScoreById = (id: string) => {
  const { withLoading } = useApiLoading();
  return useQuery<ReportsSecurityPostureScore>({ // Type updated
    queryKey: REPORTS_SECURITY_POSTURE_SCORE_KEYS.detail(id),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<ReportsSecurityPostureScore>>(`${BASE_URL}/${id}`));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Create record
export const useCreateReportsSecurityPostureScore = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ReportsSecurityPostureScore, Error, CreateReportsSecurityPostureScoreDto>({ // Types updated
    mutationFn: async (newData: CreateReportsSecurityPostureScoreDto) => {
      const response = await withLoading(() => apiClient.post<ApiResponse<ReportsSecurityPostureScore>>(BASE_URL, newData));
      return response.data.data;
    },
    onSuccess: () => {
      showToast('Reports Security Posture Score record created successfully', 'success'); // Message updated
      queryClient.invalidateQueries({ queryKey: REPORTS_SECURITY_POSTURE_SCORE_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to create record:', error);
      showToast(`Failed to create Reports Security Posture Score record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error'); // Message updated
    },
  });
};

// Update record
export const useUpdateReportsSecurityPostureScore = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ReportsSecurityPostureScore, Error, UpdateReportsSecurityPostureScoreDto & { id: string }>({ // Types updated
    mutationFn: async ({ id, ...updateData }: UpdateReportsSecurityPostureScoreDto & { id: string }) => {
      const response = await withLoading(() => apiClient.patch<ApiResponse<ReportsSecurityPostureScore>>(`${BASE_URL}/${id}`, updateData));
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('Reports Security Posture Score record updated successfully', 'success'); // Message updated
      queryClient.invalidateQueries({ queryKey: REPORTS_SECURITY_POSTURE_SCORE_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: REPORTS_SECURITY_POSTURE_SCORE_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to update record:', error);
      showToast(`Failed to update Reports Security Posture Score record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error'); // Message updated
    },
  });
};

// Delete record
export const useDeleteReportsSecurityPostureScore = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ApiResponse<null>, Error, string>({ // Type updated
    mutationFn: async (id: string) => {
      const response = await withLoading(() => apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`));
      return response.data;
    },
    onSuccess: (_, id) => {
      showToast('Reports Security Posture Score record deleted successfully', 'success'); // Message updated
      queryClient.removeQueries({ queryKey: REPORTS_SECURITY_POSTURE_SCORE_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: REPORTS_SECURITY_POSTURE_SCORE_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to delete record:', error);
      showToast(`Failed to delete Reports Security Posture Score record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error'); // Message updated
    },
  });
};
