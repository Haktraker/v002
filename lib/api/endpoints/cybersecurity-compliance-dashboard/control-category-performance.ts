import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import {
  ApiResponse,
  ControlCategoryPerformance,
  ControlCategoryPerformanceQueryParams,
  CreateControlCategoryPerformanceDto,
  UpdateControlCategoryPerformanceDto
} from '@/lib/api/types';
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// API Keys for Control Category Performance
export const CONTROL_CATEGORY_PERFORMANCE_KEYS = {
  lists: (params?: ControlCategoryPerformanceQueryParams) => ['controlCategoryPerformances', params] as const,
  detail: (id: string) => ['controlCategoryPerformances', id] as const,
};

// Base URL - Adjust if your API route differs
// Assuming a similar structure to compliance-trends under a non-compliance-gaps-dashboard parent route
const BASE_URL = '/non-compliance-gaps-dashboard/control-category-performance';

// GET - Fetch all Control Category Performances
export const useGetControlCategoryPerformances = (params?: ControlCategoryPerformanceQueryParams) => {
  const { withLoading } = useApiLoading();
  
  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== null && value !== undefined)
  ) : {};
  
  return useQuery<ControlCategoryPerformance[]>({ // Expecting an array based on reference
    queryKey: CONTROL_CATEGORY_PERFORMANCE_KEYS.lists(filteredParams),
    queryFn: async () => {
      const response = await withLoading(() => 
        apiClient.get<ApiResponse<ControlCategoryPerformance[]>>(BASE_URL, { params: filteredParams })
      );
      // Assuming the API returns { success: boolean, data: ControlCategoryPerformance[] }
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// GET - Fetch a single Control Category Performance by ID
export const useGetControlCategoryPerformanceById = (id: string) => {
  const { withLoading } = useApiLoading();
  
  return useQuery<ControlCategoryPerformance>({ // Expecting a single object
    queryKey: CONTROL_CATEGORY_PERFORMANCE_KEYS.detail(id),
    queryFn: async () => {
      const response = await withLoading(() => 
        apiClient.get<ApiResponse<ControlCategoryPerformance>>(`${BASE_URL}/${id}`)
      );
      return response.data.data;
    },
    enabled: !!id, // Only run query if ID is provided
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// POST - Create a new Control Category Performance entry
export const useCreateControlCategoryPerformance = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (newData: CreateControlCategoryPerformanceDto) => {
      const response = await withLoading(() => 
        apiClient.post<ApiResponse<ControlCategoryPerformance>>(BASE_URL, newData)
      );
      return response.data.data;
    },
    onSuccess: () => {
      showToast('Control category performance created successfully', 'success');
      // Invalidate the list query to refetch data
      queryClient.invalidateQueries({ queryKey: CONTROL_CATEGORY_PERFORMANCE_KEYS.lists({}) });
    },
    onError: (error: any) => {
      console.error('Failed to create control category performance:', error);
      showToast('Failed to create control category performance', 'error');
    },
  });
};

// PATCH - Update an existing Control Category Performance entry
export const useUpdateControlCategoryPerformance = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateControlCategoryPerformanceDto & { id: string }) => {
      const response = await withLoading(() => 
        apiClient.patch<ApiResponse<ControlCategoryPerformance>>(`${BASE_URL}/${id}`, updateData)
      );
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('Control category performance updated successfully', 'success');
      // Invalidate both the specific detail query and the list query
      queryClient.invalidateQueries({ queryKey: CONTROL_CATEGORY_PERFORMANCE_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: CONTROL_CATEGORY_PERFORMANCE_KEYS.lists({}) });
    },
    onError: (error: any) => {
      console.error('Failed to update control category performance:', error);
      showToast('Failed to update control category performance', 'error');
    },
  });
};

// DELETE - Delete a Control Category Performance entry
export const useDeleteControlCategoryPerformance = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (id: string) => {
      // Assuming the delete endpoint returns ApiResponse<null> or similar
      const response = await withLoading(() => 
        apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`)
      );
      return response.data; // Return the API response data (might be null or include a message)
    },
    onSuccess: (_, id) => {
      showToast('Control category performance deleted successfully', 'success');
      // Remove the specific detail query from cache if it exists
      queryClient.removeQueries({ queryKey: CONTROL_CATEGORY_PERFORMANCE_KEYS.detail(id) });
      // Invalidate the list query to refetch
      queryClient.invalidateQueries({ queryKey: CONTROL_CATEGORY_PERFORMANCE_KEYS.lists({}) });
    },
    onError: (error: any) => {
      console.error('Failed to delete control category performance:', error);
      showToast('Failed to delete control category performance', 'error');
    },
  });
};
