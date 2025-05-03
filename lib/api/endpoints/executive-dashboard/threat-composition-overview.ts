import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import {
    ApiResponse,
    ThreatCompositionOverview,
    ThreatCompositionOverviewQueryParams,
    CreateThreatCompositionOverviewDto,
    UpdateThreatCompositionOverviewDto
} from '@/lib/api/executive-dashboard-types/types';
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// API Keys
export const THREAT_COMPOSITION_OVERVIEW_KEYS = {
  lists: (params?: ThreatCompositionOverviewQueryParams) => ['threatCompositionOverview', params] as const,
  detail: (id: string) => ['threatCompositionOverview', id] as const,
};

// Base URL
const BASE_URL = '/executive-dashboard/threat-composition-overview';

// Get all records
export const useGetThreatCompositionOverviews = (params?: ThreatCompositionOverviewQueryParams) => {
  const { withLoading } = useApiLoading();
  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== null && value !== undefined && value !== 'All')
  ) : {};

  return useQuery<{ data: ThreatCompositionOverview[] } | undefined>({ // Assuming the API returns { data: [...] }
    queryKey: THREAT_COMPOSITION_OVERVIEW_KEYS.lists(filteredParams),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<{ data: ThreatCompositionOverview[] }>(BASE_URL, {
        params: filteredParams
      }));
      return response.data; // Return the whole response object containing the data array
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get record by ID
export const useGetThreatCompositionOverviewById = (id: string) => {
  const { withLoading } = useApiLoading();
  return useQuery<ThreatCompositionOverview>({
    queryKey: THREAT_COMPOSITION_OVERVIEW_KEYS.detail(id),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<ThreatCompositionOverview>>(`${BASE_URL}/${id}`));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Create record
export const useCreateThreatCompositionOverview = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ThreatCompositionOverview, Error, CreateThreatCompositionOverviewDto>({
    mutationFn: async (newData: CreateThreatCompositionOverviewDto) => {
      const response = await withLoading(() => apiClient.post<ApiResponse<ThreatCompositionOverview>>(BASE_URL, newData));
      return response.data.data;
    },
    onSuccess: () => {
      showToast('Threat Composition Overview record created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: THREAT_COMPOSITION_OVERVIEW_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to create record:', error);
      showToast(`Failed to create record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Update record
export const useUpdateThreatCompositionOverview = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ThreatCompositionOverview, Error, UpdateThreatCompositionOverviewDto & { id: string }>({
    mutationFn: async ({ id, ...updateData }: UpdateThreatCompositionOverviewDto & { id: string }) => {
      const response = await withLoading(() => apiClient.patch<ApiResponse<ThreatCompositionOverview>>(`${BASE_URL}/${id}`, updateData));
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('Threat Composition Overview record updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: THREAT_COMPOSITION_OVERVIEW_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: THREAT_COMPOSITION_OVERVIEW_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to update record:', error);
      showToast(`Failed to update record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Delete record
export const useDeleteThreatCompositionOverview = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ApiResponse<null>, Error, string>({
    mutationFn: async (id: string) => {
      const response = await withLoading(() => apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`));
      return response.data;
    },
    onSuccess: (_, id) => {
      showToast('Threat Composition Overview record deleted successfully', 'success');
      queryClient.removeQueries({ queryKey: THREAT_COMPOSITION_OVERVIEW_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: THREAT_COMPOSITION_OVERVIEW_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to delete record:', error);
      showToast(`Failed to delete record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};
