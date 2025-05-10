import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';
import { CreateSupplyChainThreatExposureDto, SupplyChainThreatExposure, SupplyChainThreatExposureQueryParams, UpdateSupplyChainThreatExposureDto } from '../../reports-types/types';

// Assuming a common ApiResponse structure, adjust if different for this endpoint
export interface ApiResponse<T> {
  data: T;
  message?: string;
  // Add other common fields if necessary
}

// Types based on the Mongoose schema
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';



// API Keys
export const SUPPLY_CHAIN_THREAT_EXPOSURE_KEYS = {
  all: ['supplyChainThreatExposure'] as const,
  lists: (params?: SupplyChainThreatExposureQueryParams) => [...SUPPLY_CHAIN_THREAT_EXPOSURE_KEYS.all, 'list', params] as const,
  details: () => [...SUPPLY_CHAIN_THREAT_EXPOSURE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...SUPPLY_CHAIN_THREAT_EXPOSURE_KEYS.details(), id] as const,
};

// Base URL
const BASE_URL = '/reports/supply-chain-threat-exposure';

// Get all records
export const useGetSupplyChainThreatExposures = (params?: SupplyChainThreatExposureQueryParams) => {
  const { withLoading } = useApiLoading();
  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== null && value !== undefined && value !== '' && value !== 'All')
  ) : {};

  return useQuery<{ data: SupplyChainThreatExposure[] } | undefined>({ // Assuming API returns { data: [...] }
    queryKey: SUPPLY_CHAIN_THREAT_EXPOSURE_KEYS.lists(filteredParams),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<{ data: SupplyChainThreatExposure[] }>(BASE_URL, {
        params: filteredParams
      }));
      return response.data; // Assuming the actual data is in response.data.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    // keepPreviousData: true, // Optional: consider if useful for pagination or filtering
  });
};

// Get record by ID
export const useGetSupplyChainThreatExposureById = (id: string) => {
  const { withLoading } = useApiLoading();
  return useQuery<SupplyChainThreatExposure>({
    queryKey: SUPPLY_CHAIN_THREAT_EXPOSURE_KEYS.detail(id),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<SupplyChainThreatExposure>>(`${BASE_URL}/${id}`));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Create record
export const useCreateSupplyChainThreatExposure = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<SupplyChainThreatExposure, Error, CreateSupplyChainThreatExposureDto>({
    mutationFn: async (newData: CreateSupplyChainThreatExposureDto) => {
      const response = await withLoading(() => apiClient.post<ApiResponse<SupplyChainThreatExposure>>(BASE_URL, newData));
      return response.data.data;
    },
    onSuccess: () => {
      showToast('Supply Chain Threat Exposure record created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: SUPPLY_CHAIN_THREAT_EXPOSURE_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to create record:', error);
      const message = error.response?.data?.message || error.message || 'Unknown error creating record';
      showToast(`Failed to create record: ${message}`, 'error');
    },
  });
};

// Update record
export const useUpdateSupplyChainThreatExposure = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<SupplyChainThreatExposure, Error, UpdateSupplyChainThreatExposureDto & { id: string }>({
    mutationFn: async ({ id, ...updateData }: UpdateSupplyChainThreatExposureDto & { id: string }) => {
      const response = await withLoading(() => apiClient.patch<ApiResponse<SupplyChainThreatExposure>>(`${BASE_URL}/${id}`, updateData));
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('Supply Chain Threat Exposure record updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: SUPPLY_CHAIN_THREAT_EXPOSURE_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: SUPPLY_CHAIN_THREAT_EXPOSURE_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to update record:', error);
      const message = error.response?.data?.message || error.message || 'Unknown error updating record';
      showToast(`Failed to update record: ${message}`, 'error');
    },
  });
};

// Delete record
export const useDeleteSupplyChainThreatExposure = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ApiResponse<null> | void, Error, string>({ // Adjusted to allow void if API returns no content
    mutationFn: async (id: string) => {
      const response = await withLoading(() => apiClient.delete<ApiResponse<null> | void>(`${BASE_URL}/${id}`));
      // If your API returns 204 No Content, response.data might be undefined or null.
      // If it returns a body (e.g., { message: "deleted" }), then access response.data.
      return response.data; 
    },
    onSuccess: (_, id) => {
      showToast('Supply Chain Threat Exposure record deleted successfully', 'success');
      queryClient.removeQueries({ queryKey: SUPPLY_CHAIN_THREAT_EXPOSURE_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: SUPPLY_CHAIN_THREAT_EXPOSURE_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to delete record:', error);
      const message = error.response?.data?.message || error.message || 'Unknown error deleting record';
      showToast(`Failed to delete record: ${message}`, 'error');
    },
  });
};
