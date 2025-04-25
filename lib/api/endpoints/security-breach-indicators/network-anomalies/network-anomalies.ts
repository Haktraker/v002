'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import { ApiResponse, NetworkAnomaly, NetworkAnomalyQueryParams, CreateNetworkAnomalyDto, UpdateNetworkAnomalyDto, PaginatedResponse } from '../../../types';
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// API Keys for Network Anomalies
export const NETWORK_ANOMALIES_KEYS = {
  lists: (params?: NetworkAnomalyQueryParams) => ['networkAnomalies', params] as const, // Include params in key
  detail: (id: string) => ['networkAnomalies', id] as const,
};

// Base URL for all network anomalies endpoints
const BASE_URL = '/security-breach-indicators-dashboard/network-anomalies';

// Get all network anomalies with pagination
export const useGetNetworkAnomalies = (params?: NetworkAnomalyQueryParams) => {
  const { withLoading } = useApiLoading();
  
  // Filter out null/undefined params
  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== null && value !== undefined)
  ) : undefined;
  
  return useQuery<NetworkAnomaly[]>({ // Add explicit type here
    queryKey: NETWORK_ANOMALIES_KEYS.lists(filteredParams), // Use params in queryKey
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<{results: number, paginateResult: any, data: NetworkAnomaly[]}>(BASE_URL, { 
        params: filteredParams 
      }));
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};


// Get network anomaly by ID
export const useGetNetworkAnomalyById = (id: string) => {
  const { withLoading } = useApiLoading();
  
  return useQuery({
    queryKey: NETWORK_ANOMALIES_KEYS.detail(id),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<NetworkAnomaly>>(`${BASE_URL}/${id}`));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Create network anomaly
export const useCreateNetworkAnomaly = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (newNetworkAnomaly: CreateNetworkAnomalyDto) => {
      const response = await withLoading(() => apiClient.post<ApiResponse<NetworkAnomaly>>(BASE_URL, newNetworkAnomaly));
      return response.data.data;
    },
    onSuccess: () => {
      showToast('Network anomaly created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: NETWORK_ANOMALIES_KEYS.lists({}) }); // Invalidate base list
    },
    onError: (error: any) => {
      console.error('Failed to create network anomaly:', error);
      showToast('Failed to create network anomaly', 'error');
    },
  });
};

// Update network anomaly
export const useUpdateNetworkAnomaly = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateNetworkAnomalyDto & { id: string }) => {
      const response = await withLoading(() => apiClient.patch<ApiResponse<NetworkAnomaly>>(`${BASE_URL}/${id}`, updateData));
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('Network anomaly updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: NETWORK_ANOMALIES_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: NETWORK_ANOMALIES_KEYS.lists({}) }); // Invalidate base list
    },
    onError: (error: any) => {
      console.error('Failed to update network anomaly:', error);
      showToast('Failed to update network anomaly', 'error');
    },
  });
};

// Delete network anomaly
export const useDeleteNetworkAnomaly = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await withLoading(() => apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`));
      return response.data;
    },
    onSuccess: (_, id) => {
      showToast('Network anomaly deleted successfully', 'success');
      queryClient.removeQueries({ queryKey: NETWORK_ANOMALIES_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: NETWORK_ANOMALIES_KEYS.lists({}) }); // Invalidate base list
    },
    onError: (error: any) => {
      console.error('Failed to delete network anomaly:', error);
      showToast('Failed to delete network anomaly', 'error');
    },
  });
};