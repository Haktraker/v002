import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import {
    ApiResponse,
    DigitalRiskIntelligence,
    DigitalRiskIntelligenceQueryParams,
    CreateDigitalRiskIntelligenceDto,
    UpdateDigitalRiskIntelligenceDto
} from '@/lib/api/executive-dashboard-types/types';
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// API Keys
export const DIGITAL_RISK_KEYS = {
  lists: (params?: DigitalRiskIntelligenceQueryParams) => ['digitalRisk', params] as const,
  detail: (id: string) => ['digitalRisk', id] as const,
};

// Base URL
const BASE_URL = '/executive-dashboard/digital-risk-intelligence';

// Get all records
export const useGetDigitalRisks = (params?: DigitalRiskIntelligenceQueryParams) => {
  const { withLoading } = useApiLoading();
  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== null && value !== undefined && value !== 'All')
  ) : {};

  return useQuery<{ data: DigitalRiskIntelligence[] } | undefined>({ // Assuming { data: [...] }
    queryKey: DIGITAL_RISK_KEYS.lists(filteredParams),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<{ data: DigitalRiskIntelligence[] }>(BASE_URL, {
        params: filteredParams
      }));
      return response.data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get record by ID
export const useGetDigitalRiskById = (id: string) => {
  const { withLoading } = useApiLoading();
  return useQuery<DigitalRiskIntelligence>({
    queryKey: DIGITAL_RISK_KEYS.detail(id),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<DigitalRiskIntelligence>>(`${BASE_URL}/${id}`));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Create record
export const useCreateDigitalRisk = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<DigitalRiskIntelligence, Error, CreateDigitalRiskIntelligenceDto>({
    mutationFn: async (newData: CreateDigitalRiskIntelligenceDto) => {
      const response = await withLoading(() => apiClient.post<ApiResponse<DigitalRiskIntelligence>>(BASE_URL, newData));
      return response.data.data;
    },
    onSuccess: () => {
      showToast('Digital Risk record created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: DIGITAL_RISK_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to create record:', error);
      const message = error.response?.data?.message || error.message || 'Unknown error';
      showToast(`Failed to create record: ${message}`, 'error');
    },
  });
};

// Update record
export const useUpdateDigitalRisk = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<DigitalRiskIntelligence, Error, UpdateDigitalRiskIntelligenceDto & { id: string }>({ 
    mutationFn: async ({ id, ...updateData }: UpdateDigitalRiskIntelligenceDto & { id: string }) => {
      const response = await withLoading(() => apiClient.patch<ApiResponse<DigitalRiskIntelligence>>(`${BASE_URL}/${id}`, updateData));
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('Digital Risk record updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: DIGITAL_RISK_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: DIGITAL_RISK_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to update record:', error);
       const message = error.response?.data?.message || error.message || 'Unknown error';
      showToast(`Failed to update record: ${message}`, 'error');
    },
  });
};

// Delete record
export const useDeleteDigitalRisk = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ApiResponse<null>, Error, string>({ // Assuming ApiResponse<null> for delete
    mutationFn: async (id: string) => {
      const response = await withLoading(() => apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`));
      return response.data;
    },
    onSuccess: (_, id) => {
      showToast('Digital Risk record deleted successfully', 'success');
      queryClient.removeQueries({ queryKey: DIGITAL_RISK_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: DIGITAL_RISK_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to delete record:', error);
      showToast(`Failed to delete record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};
