import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import {
  ApiResponse,
  BusinessUnitPerformance,
  BusinessUnitPerformanceQueryParams,
  CreateBusinessUnitPerformanceDto,
  UpdateBusinessUnitPerformanceDto,
  ControlCategoryName // Ensure ControlCategoryName is imported if needed elsewhere, or manage types centrally
} from '@/lib/api/types'; // Import the newly defined types
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// API Keys for Business Unit Performance
export const BUSINESS_UNIT_PERFORMANCE_KEYS = {
  lists: (params?: BusinessUnitPerformanceQueryParams) => ['businessUnitPerformances', params] as const,
  detail: (id: string) => ['businessUnitPerformances', id] as const,
};

// Base URL - Assuming this is the correct backend route
const BASE_URL = '/non-compliance-gaps-dashboard/business-unit-performance';

// GET - Fetch all Business Unit Performance entries
export const useGetBusinessUnitPerformances = (params?: BusinessUnitPerformanceQueryParams) => {
  const { withLoading } = useApiLoading();

  // Filter out null/undefined params before sending
  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== null && value !== undefined)
  ) : {};

  return useQuery<BusinessUnitPerformance[]> ({
    queryKey: BUSINESS_UNIT_PERFORMANCE_KEYS.lists(filteredParams),
    queryFn: async () => {
      const response = await withLoading(() =>
        apiClient.get<ApiResponse<BusinessUnitPerformance[]>>(BASE_URL, { params: filteredParams })
      );
      // Assuming the API returns { success: boolean, data: T[], message?: string }
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// GET - Fetch a single Business Unit Performance entry by ID
export const useGetBusinessUnitPerformanceById = (id: string) => {
  const { withLoading } = useApiLoading();

  return useQuery<BusinessUnitPerformance>({
    queryKey: BUSINESS_UNIT_PERFORMANCE_KEYS.detail(id),
    queryFn: async () => {
      const response = await withLoading(() =>
        apiClient.get<ApiResponse<BusinessUnitPerformance>>(`${BASE_URL}/${id}`)
      );
      return response.data.data;
    },
    enabled: !!id, // Only run query if id is provided
    staleTime: 5 * 60 * 1000
  });
};

// POST - Create a new Business Unit Performance entry
export const useCreateBusinessUnitPerformance = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (newData: CreateBusinessUnitPerformanceDto) => {
      const response = await withLoading(() =>
        apiClient.post<ApiResponse<BusinessUnitPerformance>>(BASE_URL, newData)
      );
      return response.data.data;
    },
    onSuccess: () => {
      showToast('Business unit performance entry created successfully', 'success');
      // Invalidate lists query to refetch data
      queryClient.invalidateQueries({ queryKey: BUSINESS_UNIT_PERFORMANCE_KEYS.lists({}) });
    },
    onError: (error: any) => {
      console.error('Failed to create business unit performance entry:', error);
      // Attempt to show a more specific error message if available
      const message = error?.response?.data?.message || 'Failed to create business unit performance entry';
      showToast(message, 'error');
    },
  });
};

// PATCH - Update an existing Business Unit Performance entry
export const useUpdateBusinessUnitPerformance = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    // The mutation function expects an object containing the id and the update data
    mutationFn: async ({ id, ...updateData }: UpdateBusinessUnitPerformanceDto & { id: string }) => {
      const response = await withLoading(() =>
        apiClient.patch<ApiResponse<BusinessUnitPerformance>>(`${BASE_URL}/${id}`, updateData)
      );
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('Business unit performance entry updated successfully', 'success');
      // Invalidate both the specific entry and the list
      queryClient.invalidateQueries({ queryKey: BUSINESS_UNIT_PERFORMANCE_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: BUSINESS_UNIT_PERFORMANCE_KEYS.lists({}) });
    },
    onError: (error: any) => {
      console.error('Failed to update business unit performance entry:', error);
      const message = error?.response?.data?.message || 'Failed to update business unit performance entry';
      showToast(message, 'error');
    },
  });
};

// DELETE - Delete a Business Unit Performance entry
export const useDeleteBusinessUnitPerformance = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (id: string) => {
      // Assuming the API returns a standard ApiResponse on delete, possibly with null data
      const response = await withLoading(() =>
        apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`)
      );
      return response.data; // Or simply return true/void if preferred
    },
    onSuccess: (_, id) => {
      showToast('Business unit performance entry deleted successfully', 'success');
      // Remove the specific item from the cache and invalidate the list
      queryClient.removeQueries({ queryKey: BUSINESS_UNIT_PERFORMANCE_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: BUSINESS_UNIT_PERFORMANCE_KEYS.lists({}) });
    },
    onError: (error: any) => {
      console.error('Failed to delete business unit performance entry:', error);
      const message = error?.response?.data?.message || 'Failed to delete business unit performance entry';
      showToast(message, 'error');
    },
  });
};
