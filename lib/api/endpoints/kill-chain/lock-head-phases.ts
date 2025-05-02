import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import { 
    ApiResponse, 
    LockHeadPhases, 
    LockHeadPhasesQueryParams, 
    CreateLockHeadPhasesDto, 
    UpdateLockHeadPhasesDto 
} from '@/lib/api/types';
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// API Keys
export const LOCK_HEAD_PHASES_KEYS = {
  lists: (params?: LockHeadPhasesQueryParams) => ['lockHeadPhases', params] as const,
  detail: (id: string) => ['lockHeadPhases', id] as const,
};

// Base URL
const BASE_URL = '/reports/lock-head-phases';

// Get all records
export const useGetLockHeadPhases = (params?: LockHeadPhasesQueryParams) => {
  const { withLoading } = useApiLoading();
  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== null && value !== undefined && value !== 'All')
  ) : {};

  return useQuery<{ data: LockHeadPhases[] } | undefined>({ 
    queryKey: LOCK_HEAD_PHASES_KEYS.lists(filteredParams),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<{ data: LockHeadPhases[] }>(BASE_URL, {
        params: filteredParams
      }));
      return response.data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get record by ID
export const useGetLockHeadPhasesById = (id: string) => {
  const { withLoading } = useApiLoading();
  return useQuery<LockHeadPhases>({
    queryKey: LOCK_HEAD_PHASES_KEYS.detail(id),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<LockHeadPhases>>(`${BASE_URL}/${id}`));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Create record
export const useCreateLockHeadPhases = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<LockHeadPhases, Error, CreateLockHeadPhasesDto>({
    mutationFn: async (newData: CreateLockHeadPhasesDto) => {
      const response = await withLoading(() => apiClient.post<ApiResponse<LockHeadPhases>>(BASE_URL, newData));
      return response.data.data;
    },
    onSuccess: () => {
      showToast('Lock Head Phases record created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: LOCK_HEAD_PHASES_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to create record:', error);
      showToast(`Failed to create record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Update record
export const useUpdateLockHeadPhases = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<LockHeadPhases, Error, UpdateLockHeadPhasesDto & { id: string }>({
    mutationFn: async ({ id, ...updateData }: UpdateLockHeadPhasesDto & { id: string }) => {
      const response = await withLoading(() => apiClient.patch<ApiResponse<LockHeadPhases>>(`${BASE_URL}/${id}`, updateData));
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('Lock Head Phases record updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: LOCK_HEAD_PHASES_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: LOCK_HEAD_PHASES_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to update record:', error);
      showToast(`Failed to update record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Delete record
export const useDeleteLockHeadPhases = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ApiResponse<null>, Error, string>({
    mutationFn: async (id: string) => {
      const response = await withLoading(() => apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`));
      return response.data;
    },
    onSuccess: (_, id) => {
      showToast('Lock Head Phases record deleted successfully', 'success');
      queryClient.removeQueries({ queryKey: LOCK_HEAD_PHASES_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: LOCK_HEAD_PHASES_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to delete record:', error);
      showToast(`Failed to delete record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};
