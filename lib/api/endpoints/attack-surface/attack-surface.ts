import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import {
  ApiResponse,
  AttackSurface,
  AttackSurfaceQueryParams,
  CreateAttackSurfaceDto,
  UpdateAttackSurfaceDto,
  // Assuming PaginatedResponse might be used, though the reference doesn't use it for list
  // PaginatedResponse 
} from '@/lib/api/types';
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// API Keys for Attack Surface
export const ATTACK_SURFACE_KEYS = {
  lists: (params?: AttackSurfaceQueryParams) => ['attackSurfaces', params] as const,
  detail: (id: string) => ['attackSurfaces', id] as const,
};

// Base URL
const BASE_URL = '/attack-surface';

// Get all Attack Surfaces
export const useGetAttackSurfaces = (params?: AttackSurfaceQueryParams) => {
  const { withLoading } = useApiLoading();

  // Filter out null or undefined params before making the request
  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== null && value !== undefined)
  ) : {};

  return useQuery<AttackSurface[]>({ // Assuming the API returns an array like the reference
    queryKey: ATTACK_SURFACE_KEYS.lists(filteredParams),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<AttackSurface[]>>(BASE_URL, {
        params: filteredParams
      }));
      // Handle potential API response structures (data directly or nested in data.data)
      return response.data.data || response.data as any; // Use 'as any' for flexibility if structure varies
    },
    staleTime: 5 * 60 * 1000 // 5 minutes cache time
  });
};

// Get Attack Surface by ID
export const useGetAttackSurfaceById = (id: string) => {
  const { withLoading } = useApiLoading();

  return useQuery<AttackSurface>({
    queryKey: ATTACK_SURFACE_KEYS.detail(id),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<AttackSurface>>(`${BASE_URL}/${id}`));
      return response.data.data; // Assuming the single item is always in response.data.data
    },
    enabled: !!id, // Only run query if ID is provided
    staleTime: 5 * 60 * 1000 // 5 minutes cache time
  });
};

// Create Attack Surface
export const useCreateAttackSurface = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (data: CreateAttackSurfaceDto) => {
      const response = await withLoading(() => apiClient.post<ApiResponse<AttackSurface>>(BASE_URL, data));
      return response.data.data;
    },
    onSuccess: () => {
      showToast('Attack Surface created successfully', 'success');
      // Invalidate the cache for the list query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ATTACK_SURFACE_KEYS.lists({}) });
    },
    onError: (error: any) => {
      console.error('Failed to create Attack Surface:', error);
      showToast(error?.response?.data?.message || 'Failed to create Attack Surface', 'error');
    },
  });
};

// Update Attack Surface
export const useUpdateAttackSurface = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    // The mutation function expects an object containing both the ID and the update data
    mutationFn: async ({ id, ...updateData }: UpdateAttackSurfaceDto & { id: string }) => {
      const response = await withLoading(() => apiClient.patch<ApiResponse<AttackSurface>>(`${BASE_URL}/${id}`, updateData));
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('Attack Surface updated successfully', 'success');
      // Invalidate specific detail query and the general list query
      queryClient.invalidateQueries({ queryKey: ATTACK_SURFACE_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ATTACK_SURFACE_KEYS.lists({}) });
    },
    onError: (error: any) => {
      console.error('Failed to update Attack Surface:', error);
      showToast(error?.response?.data?.message || 'Failed to update Attack Surface', 'error');
    },
  });
};

// Delete Attack Surface
export const useDeleteAttackSurface = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (id: string) => {
      // Assuming the delete endpoint returns a success status or null data
      const response = await withLoading(() => apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`));
      return response.data; // Return the response data (might be null or { success: true })
    },
    onSuccess: (_, id) => {
      showToast('Attack Surface deleted successfully', 'success');
      // Remove the specific item from the cache
      queryClient.removeQueries({ queryKey: ATTACK_SURFACE_KEYS.detail(id) });
      // Invalidate the list to reflect the deletion
      queryClient.invalidateQueries({ queryKey: ATTACK_SURFACE_KEYS.lists({}) });
    },
    onError: (error: any) => {
      console.error('Failed to delete Attack Surface:', error);
      showToast(error?.response?.data?.message || 'Failed to delete Attack Surface', 'error');
    },
  });
};
