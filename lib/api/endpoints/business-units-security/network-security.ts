import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import { ApiResponse, NetworkSecurity, NetworkSecurityQueryParams, CreateNetworkSecurityDto, UpdateNetworkSecurityDto } from '@/lib/api/types';
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// API Keys for Network Security
export const NETWORK_SECURITY_KEYS = {
  lists: (params?: NetworkSecurityQueryParams) => ['networkSecurities', params] as const,
  detail: (id: string) => ['networkSecurities', id] as const,
};

// Base URL for all network security endpoints
const BASE_URL = '/bu-security/network-security';

// Get all network securities
export const useGetNetworkSecurities = (params?: NetworkSecurityQueryParams) => {
  const { withLoading } = useApiLoading();

  // Filter out null/undefined params
  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== null && value !== undefined)
  ) : {};

  return useQuery<NetworkSecurity[]>({
    queryKey: NETWORK_SECURITY_KEYS.lists(filteredParams),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<NetworkSecurity[]>>(BASE_URL, {
        params: filteredParams
      }));
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get network security by ID
export const useGetNetworkSecurityById = (id: string) => {
  const { withLoading } = useApiLoading();

  return useQuery({
    queryKey: NETWORK_SECURITY_KEYS.detail(id),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<NetworkSecurity>>(`${BASE_URL}/${id}`));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Create network security
export const useCreateNetworkSecurity = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (newNetworkSecurity: CreateNetworkSecurityDto) => {
      const response = await withLoading(() => apiClient.post<ApiResponse<NetworkSecurity>>(BASE_URL, newNetworkSecurity));
      return response.data.data;
    },
    onSuccess: () => {
      showToast('Network security record created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: NETWORK_SECURITY_KEYS.lists({}) });
    },
    onError: (error: any) => {
      console.error('Failed to create network security record:', error);
      showToast('Failed to create network security record', 'error');
    },
  });
};

// Update network security
export const useUpdateNetworkSecurity = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateNetworkSecurityDto & { id: string }) => {
      const response = await withLoading(() => apiClient.patch<ApiResponse<NetworkSecurity>>(`${BASE_URL}/${id}`, updateData));
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('Network security record updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: NETWORK_SECURITY_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: NETWORK_SECURITY_KEYS.lists({}) });
    },
    onError: (error: any) => {
      console.error('Failed to update network security record:', error);
      showToast('Failed to update network security record', 'error');
    },
  });
};

// Delete network security
export const useDeleteNetworkSecurity = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await withLoading(() => apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`));
      return response.data;
    },
    onSuccess: (_, id) => {
      showToast('Network security record deleted successfully', 'success');
      queryClient.removeQueries({ queryKey: NETWORK_SECURITY_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: NETWORK_SECURITY_KEYS.lists({}) });
    },
    onError: (error: any) => {
      console.error('Failed to delete network security record:', error);
      showToast('Failed to delete network security record', 'error');
    },
  });
};
