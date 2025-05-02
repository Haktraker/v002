import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import { 
    ApiResponse, 
    ThreatImpactOverview, 
    ThreatImpactOverviewQueryParams, 
    CreateThreatImpactOverviewDto, 
    UpdateThreatImpactOverviewDto 
} from '@/lib/api/types';
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// API Keys
export const THREAT_IMPACT_OVERVIEW_KEYS = {
  lists: (params?: ThreatImpactOverviewQueryParams) => ['threatImpactOverview', params] as const,
  detail: (id: string) => ['threatImpactOverview', id] as const,
};

// Base URL
const BASE_URL = '/reports/threat-impact-overView';

// Get all records
export const useGetThreatImpactOverviews = (params?: ThreatImpactOverviewQueryParams) => {
  const { withLoading } = useApiLoading();
  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== null && value !== undefined && value !== 'All')
  ) : {};

  return useQuery<{ data: ThreatImpactOverview[] } | undefined>({ 
    queryKey: THREAT_IMPACT_OVERVIEW_KEYS.lists(filteredParams),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<{ data: ThreatImpactOverview[] }>(BASE_URL, {
        params: filteredParams
      }));
      return response.data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get record by ID
export const useGetThreatImpactOverviewById = (id: string) => {
  const { withLoading } = useApiLoading();
  return useQuery<ThreatImpactOverview>({
    queryKey: THREAT_IMPACT_OVERVIEW_KEYS.detail(id),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<ThreatImpactOverview>>(`${BASE_URL}/${id}`));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Create record
export const useCreateThreatImpactOverview = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ThreatImpactOverview, Error, CreateThreatImpactOverviewDto>({
    mutationFn: async (newData: CreateThreatImpactOverviewDto) => {
      const response = await withLoading(() => apiClient.post<ApiResponse<ThreatImpactOverview>>(BASE_URL, newData));
      return response.data.data;
    },
    onSuccess: () => {
      showToast('Threat Impact Overview record created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: THREAT_IMPACT_OVERVIEW_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to create record:', error);
      showToast(`Failed to create record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Update record
export const useUpdateThreatImpactOverview = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ThreatImpactOverview, Error, UpdateThreatImpactOverviewDto & { id: string }>({
    mutationFn: async ({ id, ...updateData }: UpdateThreatImpactOverviewDto & { id: string }) => {
      const response = await withLoading(() => apiClient.patch<ApiResponse<ThreatImpactOverview>>(`${BASE_URL}/${id}`, updateData));
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('Threat Impact Overview record updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: THREAT_IMPACT_OVERVIEW_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: THREAT_IMPACT_OVERVIEW_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to update record:', error);
      showToast(`Failed to update record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Delete record
export const useDeleteThreatImpactOverview = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ApiResponse<null>, Error, string>({
    mutationFn: async (id: string) => {
      const response = await withLoading(() => apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`));
      return response.data;
    },
    onSuccess: (_, id) => {
      showToast('Threat Impact Overview record deleted successfully', 'success');
      queryClient.removeQueries({ queryKey: THREAT_IMPACT_OVERVIEW_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: THREAT_IMPACT_OVERVIEW_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to delete record:', error);
      showToast(`Failed to delete record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};
