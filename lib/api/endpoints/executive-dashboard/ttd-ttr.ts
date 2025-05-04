import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import {
    ApiResponse,
    TtdTtr,
    TtdTtrQueryParams,
    CreateTtdTtrDto,
    UpdateTtdTtrDto
} from '@/lib/api/executive-dashboard-types/types';
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// API Keys
export const TTD_TTR_KEYS = {
  lists: (params?: TtdTtrQueryParams) => ['ttdTtr', params] as const,
  detail: (id: string) => ['ttdTtr', id] as const,
};

// Base URL
const BASE_URL = '/executive-dashboard/ttd-ttr';

// Get all records
export const useGetTtdTtrRecords = (params?: TtdTtrQueryParams) => {
  const { withLoading } = useApiLoading();
  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== null && value !== undefined && value !== 'All')
  ) : {};

  return useQuery<{ data: TtdTtr[] } | undefined>({ // Assuming { data: [...] }
    queryKey: TTD_TTR_KEYS.lists(filteredParams),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<{ data: TtdTtr[] }>(BASE_URL, {
        params: filteredParams
      }));
      // Sort data chronologically before returning if needed for charts
      if (response.data?.data) {
        response.data.data.sort((a, b) => {
          const dateA = new Date(parseInt(a.year, 10), parseInt(a.month, 10) - 1);
          const dateB = new Date(parseInt(b.year, 10), parseInt(b.month, 10) - 1);
          return dateA.getTime() - dateB.getTime();
        });
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get record by ID
export const useGetTtdTtrById = (id: string) => {
  const { withLoading } = useApiLoading();
  return useQuery<TtdTtr>({
    queryKey: TTD_TTR_KEYS.detail(id),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<TtdTtr>>(`${BASE_URL}/${id}`));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Create record
export const useCreateTtdTtrRecord = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<TtdTtr, Error, CreateTtdTtrDto>({
    mutationFn: async (newData: CreateTtdTtrDto) => {
      const response = await withLoading(() => apiClient.post<ApiResponse<TtdTtr>>(BASE_URL, newData));
      return response.data.data;
    },
    onSuccess: () => {
      showToast('TTD/TTR record created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: TTD_TTR_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to create record:', error);
      const message = error.response?.data?.message || error.message || 'Unknown error';
      showToast(`Failed to create record: ${message}`, 'error');
    },
  });
};

// Update record
export const useUpdateTtdTtrRecord = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<TtdTtr, Error, UpdateTtdTtrDto & { id: string }>({ 
    mutationFn: async ({ id, ...updateData }: UpdateTtdTtrDto & { id: string }) => {
      const response = await withLoading(() => apiClient.patch<ApiResponse<TtdTtr>>(`${BASE_URL}/${id}`, updateData));
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('TTD/TTR record updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: TTD_TTR_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: TTD_TTR_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to update record:', error);
       const message = error.response?.data?.message || error.message || 'Unknown error';
      showToast(`Failed to update record: ${message}`, 'error');
    },
  });
};

// Delete record
export const useDeleteTtdTtrRecord = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ApiResponse<null>, Error, string>({ // Assuming ApiResponse<null> for delete
    mutationFn: async (id: string) => {
      const response = await withLoading(() => apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`));
      return response.data;
    },
    onSuccess: (_, id) => {
      showToast('TTD/TTR record deleted successfully', 'success');
      queryClient.removeQueries({ queryKey: TTD_TTR_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: TTD_TTR_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to delete record:', error);
      showToast(`Failed to delete record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};
