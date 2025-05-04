import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import {
    ApiResponse,
    ThirdPartyThreatIntelligence,
    ThirdPartyThreatIntelligenceQueryParams,
    CreateThirdPartyThreatIntelligenceDto,
    UpdateThirdPartyThreatIntelligenceDto
} from '@/lib/api/executive-dashboard-types/types';
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// API Keys
export const THIRD_PARTY_THREAT_KEYS = {
  lists: (params?: ThirdPartyThreatIntelligenceQueryParams) => ['thirdPartyThreat', params] as const,
  detail: (id: string) => ['thirdPartyThreat', id] as const,
};

// Base URL
const BASE_URL = '/executive-dashboard/third-party-threat';

// Get all records
export const useGetThirdPartyThreats = (params?: ThirdPartyThreatIntelligenceQueryParams) => {
  const { withLoading } = useApiLoading();
  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== null && value !== undefined && value !== 'All')
  ) : {};

  return useQuery<{ data: ThirdPartyThreatIntelligence[] } | undefined>({ // Assuming { data: [...] }
    queryKey: THIRD_PARTY_THREAT_KEYS.lists(filteredParams),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<{ data: ThirdPartyThreatIntelligence[] }>(BASE_URL, {
        params: filteredParams
      }));
      return response.data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get record by ID
export const useGetThirdPartyThreatById = (id: string) => {
  const { withLoading } = useApiLoading();
  return useQuery<ThirdPartyThreatIntelligence>({
    queryKey: THIRD_PARTY_THREAT_KEYS.detail(id),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<ThirdPartyThreatIntelligence>>(`${BASE_URL}/${id}`));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Create record
export const useCreateThirdPartyThreat = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ThirdPartyThreatIntelligence, Error, CreateThirdPartyThreatIntelligenceDto>({
    mutationFn: async (newData: CreateThirdPartyThreatIntelligenceDto) => {
      const response = await withLoading(() => apiClient.post<ApiResponse<ThirdPartyThreatIntelligence>>(BASE_URL, newData));
      return response.data.data;
    },
    onSuccess: () => {
      showToast('Third Party Threat record created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: THIRD_PARTY_THREAT_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to create record:', error);
      const message = error.response?.data?.message || error.message || 'Unknown error';
      showToast(`Failed to create record: ${message}`, 'error');
    },
  });
};

// Update record
export const useUpdateThirdPartyThreat = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ThirdPartyThreatIntelligence, Error, UpdateThirdPartyThreatIntelligenceDto & { id: string }>({ // Adjusted type
    mutationFn: async ({ id, ...updateData }: UpdateThirdPartyThreatIntelligenceDto & { id: string }) => {
      const response = await withLoading(() => apiClient.patch<ApiResponse<ThirdPartyThreatIntelligence>>(`${BASE_URL}/${id}`, updateData));
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('Third Party Threat record updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: THIRD_PARTY_THREAT_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: THIRD_PARTY_THREAT_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to update record:', error);
       const message = error.response?.data?.message || error.message || 'Unknown error';
      showToast(`Failed to update record: ${message}`, 'error');
    },
  });
};

// Delete record
export const useDeleteThirdPartyThreat = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ApiResponse<null>, Error, string>({ // Assuming ApiResponse<null> for delete
    mutationFn: async (id: string) => {
      const response = await withLoading(() => apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`));
      return response.data;
    },
    onSuccess: (_, id) => {
      showToast('Third Party Threat record deleted successfully', 'success');
      queryClient.removeQueries({ queryKey: THIRD_PARTY_THREAT_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: THIRD_PARTY_THREAT_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to delete record:', error);
      showToast(`Failed to delete record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};
