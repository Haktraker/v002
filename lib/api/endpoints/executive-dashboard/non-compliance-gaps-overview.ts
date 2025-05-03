import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import {
    ApiResponse,
    NonComplianceGapsOverview,
    NonComplianceGapsOverviewQueryParams,
    CreateNonComplianceGapsOverviewDto,
    UpdateNonComplianceGapsOverviewDto
} from '@/lib/api/executive-dashboard-types/types';
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// API Keys
export const NON_COMPLIANCE_GAPS_OVERVIEW_KEYS = {
  lists: (params?: NonComplianceGapsOverviewQueryParams) => ['nonComplianceGapsOverview', params] as const,
  detail: (id: string) => ['nonComplianceGapsOverview', id] as const,
};

// Base URL
const BASE_URL = '/executive-dashboard/non-compliance-gaps-overview';

// Get all records
export const useGetNonComplianceGapsOverviews = (params?: NonComplianceGapsOverviewQueryParams) => {
  const { withLoading } = useApiLoading();
  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== null && value !== undefined && value !== 'All')
  ) : {};

  return useQuery<{ data: NonComplianceGapsOverview[] } | undefined>({ // Assuming { data: [...] }
    queryKey: NON_COMPLIANCE_GAPS_OVERVIEW_KEYS.lists(filteredParams),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<{ data: NonComplianceGapsOverview[] }>(BASE_URL, {
        params: filteredParams
      }));
      return response.data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get record by ID
export const useGetNonComplianceGapsOverviewById = (id: string) => {
  const { withLoading } = useApiLoading();
  return useQuery<NonComplianceGapsOverview>({
    queryKey: NON_COMPLIANCE_GAPS_OVERVIEW_KEYS.detail(id),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<NonComplianceGapsOverview>>(`${BASE_URL}/${id}`));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Create record
export const useCreateNonComplianceGapsOverview = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<NonComplianceGapsOverview, Error, CreateNonComplianceGapsOverviewDto>({
    mutationFn: async (newData: CreateNonComplianceGapsOverviewDto) => {
      const response = await withLoading(() => apiClient.post<ApiResponse<NonComplianceGapsOverview>>(BASE_URL, newData));
      return response.data.data;
    },
    onSuccess: () => {
      showToast('Non-Compliance Gap record created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: NON_COMPLIANCE_GAPS_OVERVIEW_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to create record:', error);
      showToast(`Failed to create record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Update record
export const useUpdateNonComplianceGapsOverview = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<NonComplianceGapsOverview, Error, UpdateNonComplianceGapsOverviewDto & { id: string }>({
    mutationFn: async ({ id, ...updateData }: UpdateNonComplianceGapsOverviewDto & { id: string }) => {
      const response = await withLoading(() => apiClient.patch<ApiResponse<NonComplianceGapsOverview>>(`${BASE_URL}/${id}`, updateData));
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('Non-Compliance Gap record updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: NON_COMPLIANCE_GAPS_OVERVIEW_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: NON_COMPLIANCE_GAPS_OVERVIEW_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to update record:', error);
      showToast(`Failed to update record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Delete record
export const useDeleteNonComplianceGapsOverview = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ApiResponse<null>, Error, string>({
    mutationFn: async (id: string) => {
      const response = await withLoading(() => apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`));
      return response.data;
    },
    onSuccess: (_, id) => {
      showToast('Non-Compliance Gap record deleted successfully', 'success');
      queryClient.removeQueries({ queryKey: NON_COMPLIANCE_GAPS_OVERVIEW_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: NON_COMPLIANCE_GAPS_OVERVIEW_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to delete record:', error);
      showToast(`Failed to delete record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};
