import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import { 
    ApiResponse, 
    SocTeamPerformance, 
    SocTeamPerformanceQueryParams, 
    CreateSocTeamPerformanceDto, 
    UpdateSocTeamPerformanceDto 
} from '@/lib/api/types';
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// API Keys
export const SOC_TEAM_PERFORMANCE_KEYS = {
  lists: (params?: SocTeamPerformanceQueryParams) => ['socTeamPerformances', params] as const,
  detail: (id: string) => ['socTeamPerformances', id] as const,
};

// Base URL
const BASE_URL = '/bu-security/soc-team-performance'; // Adjust if your API route differs

// Get all records
export const useGetSocTeamPerformances = (params?: SocTeamPerformanceQueryParams) => {
  const { withLoading } = useApiLoading();
  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== null && value !== undefined)
  ) : {};

  return useQuery<SocTeamPerformance[]>({ 
    queryKey: SOC_TEAM_PERFORMANCE_KEYS.lists(filteredParams),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<SocTeamPerformance[]>>(BASE_URL, {
        params: filteredParams
      }));
      // Check if the actual data is nested under response.data.data or just response.data
      return response.data.data || response.data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get record by ID
export const useGetSocTeamPerformanceById = (id: string) => {
  const { withLoading } = useApiLoading();
  return useQuery<SocTeamPerformance>({
    queryKey: SOC_TEAM_PERFORMANCE_KEYS.detail(id),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<SocTeamPerformance>>(`${BASE_URL}/${id}`));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Create record
export const useCreateSocTeamPerformance = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<SocTeamPerformance, Error, CreateSocTeamPerformanceDto>({
    mutationFn: async (newData: CreateSocTeamPerformanceDto) => {
      const response = await withLoading(() => apiClient.post<ApiResponse<SocTeamPerformance>>(BASE_URL, newData));
      return response.data.data;
    },
    onSuccess: () => {
      showToast('SOC Team Performance record created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: SOC_TEAM_PERFORMANCE_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to create record:', error);
      showToast(`Failed to create record: ${error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Update record
export const useUpdateSocTeamPerformance = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<SocTeamPerformance, Error, UpdateSocTeamPerformanceDto & { id: string }>({
    mutationFn: async ({ id, ...updateData }: UpdateSocTeamPerformanceDto & { id: string }) => {
      const response = await withLoading(() => apiClient.patch<ApiResponse<SocTeamPerformance>>(`${BASE_URL}/${id}`, updateData));
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('SOC Team Performance record updated successfully', 'success');
      // Invalidate both the detail and list queries on successful update
      queryClient.invalidateQueries({ queryKey: SOC_TEAM_PERFORMANCE_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: SOC_TEAM_PERFORMANCE_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to update record:', error);
      showToast(`Failed to update record: ${error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Delete record
export const useDeleteSocTeamPerformance = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ApiResponse<null>, Error, string>({
    mutationFn: async (id: string) => {
      const response = await withLoading(() => apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`));
      return response.data;
    },
    onSuccess: (_, id) => {
      showToast('SOC Team Performance record deleted successfully', 'success');
      // Remove the specific detail query cache
      queryClient.removeQueries({ queryKey: SOC_TEAM_PERFORMANCE_KEYS.detail(id) });
      // Invalidate the list query to refresh the data
      queryClient.invalidateQueries({ queryKey: SOC_TEAM_PERFORMANCE_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to delete record:', error);
      showToast(`Failed to delete record: ${error.message || 'Unknown error'}`, 'error');
    },
  });
};
