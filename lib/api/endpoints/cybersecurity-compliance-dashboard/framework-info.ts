import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import {
  ApiResponse,
  FrameworkInfo,
  FrameworkInfoQueryParams,
  CreateFrameworkInfoDto,
  UpdateFrameworkInfoDto
} from '@/lib/api/types'; // Ensure types are correctly imported
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// API Keys for Framework Info
export const FRAMEWORK_INFO_KEYS = {
  lists: (params?: FrameworkInfoQueryParams) => ['frameworkInfos', params] as const,
  detail: (id: string) => ['frameworkInfos', id] as const,
};

// Base URL
const BASE_URL = '/non-compliance-gaps-dashboard/frame-work-info'; // Adjust if backend route differs

// GET - Fetch all Framework Info entries
export const useGetFrameworkInfos = (params?: FrameworkInfoQueryParams) => {
  const { withLoading } = useApiLoading();

  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== null && value !== undefined && value !== '')
  ) : {};

  return useQuery<FrameworkInfo[]>({ 
    queryKey: FRAMEWORK_INFO_KEYS.lists(filteredParams),
    queryFn: async () => {
      const response = await withLoading(() => 
        apiClient.get<ApiResponse<FrameworkInfo[]>>(BASE_URL, { params: filteredParams })
      );
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// GET - Fetch a single Framework Info entry by ID
export const useGetFrameworkInfoById = (id: string) => {
  const { withLoading } = useApiLoading();

  return useQuery<FrameworkInfo>({ 
    queryKey: FRAMEWORK_INFO_KEYS.detail(id),
    queryFn: async () => {
      const response = await withLoading(() => 
        apiClient.get<ApiResponse<FrameworkInfo>>(`${BASE_URL}/${id}`)
      );
      return response.data.data;
    },
    enabled: !!id, 
    staleTime: 5 * 60 * 1000
  });
};

// POST - Create a new Framework Info entry
export const useCreateFrameworkInfo = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (newData: CreateFrameworkInfoDto) => {
      const response = await withLoading(() => 
        apiClient.post<ApiResponse<FrameworkInfo>>(BASE_URL, newData)
      );
      return response.data.data;
    },
    onSuccess: () => {
      showToast('Framework info created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: FRAMEWORK_INFO_KEYS.lists({}) });
    },
    onError: (error: any) => {
      console.error('Failed to create framework info:', error);
      showToast(error.response?.data?.message || 'Failed to create framework info', 'error');
    },
  });
};

// PATCH - Update an existing Framework Info entry
export const useUpdateFrameworkInfo = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateFrameworkInfoDto & { id: string }) => {
      const response = await withLoading(() => 
        apiClient.patch<ApiResponse<FrameworkInfo>>(`${BASE_URL}/${id}`, updateData)
      );
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('Framework info updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: FRAMEWORK_INFO_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: FRAMEWORK_INFO_KEYS.lists({}) });
    },
    onError: (error: any) => {
      console.error('Failed to update framework info:', error);
      showToast(error.response?.data?.message || 'Failed to update framework info', 'error');
    },
  });
};

// DELETE - Delete a Framework Info entry
export const useDeleteFrameworkInfo = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await withLoading(() => 
        apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`)
      );
      return response.data; // Or response itself depending on expected backend response
    },
    onSuccess: (_, id) => {
      showToast('Framework info deleted successfully', 'success');
      queryClient.removeQueries({ queryKey: FRAMEWORK_INFO_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: FRAMEWORK_INFO_KEYS.lists({}) });
    },
    onError: (error: any) => {
      console.error('Failed to delete framework info:', error);
      showToast(error.response?.data?.message || 'Failed to delete framework info', 'error');
    },
  });
};
