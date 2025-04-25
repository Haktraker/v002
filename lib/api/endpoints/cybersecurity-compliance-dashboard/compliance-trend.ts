import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import { ApiResponse, ComplianceTrend, ComplianceTrendQueryParams, CreateComplianceTrendDto, UpdateComplianceTrendDto } from '@/lib/api/types';
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// API Keys for Compliance Trend
export const COMPLIANCE_TREND_KEYS = {
  lists: (params?: ComplianceTrendQueryParams) => ['complianceTrends', params] as const,
  detail: (id: string) => ['complianceTrends', id] as const,
};

// Base URL for all compliance trend endpoints
const BASE_URL = '/non-compliance-gaps-dashboard/compliance-trend';

// Get all compliance trends
export const useGetComplianceTrends = (params?: ComplianceTrendQueryParams) => {
  const { withLoading } = useApiLoading();
  
  // Filter out null/undefined params
  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== null && value !== undefined)
  ) : {};
  
  return useQuery<ComplianceTrend[]>({
    queryKey: COMPLIANCE_TREND_KEYS.lists(filteredParams),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<ComplianceTrend[]>>(BASE_URL, { 
        params: filteredParams 
      }));
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get compliance trend by ID
export const useGetComplianceTrendById = (id: string) => {
  const { withLoading } = useApiLoading();
  
  return useQuery({
    queryKey: COMPLIANCE_TREND_KEYS.detail(id),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<ComplianceTrend>>(`${BASE_URL}/${id}`));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Create compliance trend
export const useCreateComplianceTrend = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (newComplianceTrend: CreateComplianceTrendDto) => {
      const response = await withLoading(() => apiClient.post<ApiResponse<ComplianceTrend>>(BASE_URL, newComplianceTrend));
      return response.data.data;
    },
    onSuccess: () => {
      showToast('Compliance trend created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: COMPLIANCE_TREND_KEYS.lists({}) });
    },
    onError: (error: any) => {
      console.error('Failed to create compliance trend:', error);
      showToast('Failed to create compliance trend', 'error');
    },
  });
};

// Update compliance trend
export const useUpdateComplianceTrend = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateComplianceTrendDto & { id: string }) => {
      const response = await withLoading(() => apiClient.patch<ApiResponse<ComplianceTrend>>(`${BASE_URL}/${id}`, updateData));
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('Compliance trend updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: COMPLIANCE_TREND_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: COMPLIANCE_TREND_KEYS.lists({}) });
    },
    onError: (error: any) => {
      console.error('Failed to update compliance trend:', error);
      showToast('Failed to update compliance trend', 'error');
    },
  });
};

// Delete compliance trend
export const useDeleteComplianceTrend = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await withLoading(() => apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`));
      return response.data;
    },
    onSuccess: (_, id) => {
      showToast('Compliance trend deleted successfully', 'success');
      queryClient.removeQueries({ queryKey: COMPLIANCE_TREND_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: COMPLIANCE_TREND_KEYS.lists({}) });
    },
    onError: (error: any) => {
      console.error('Failed to delete compliance trend:', error);
      showToast('Failed to delete compliance trend', 'error');
    },
  });
};
