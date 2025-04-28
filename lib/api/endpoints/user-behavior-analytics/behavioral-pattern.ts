import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import {
  ApiResponse,
  PaginatedResponse,
  BehavioralPattern,
  CreateBehavioralPatternDto,
  UpdateBehavioralPatternDto,
  BehavioralPatternQueryParams,
} from '@/lib/api/types';
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// API Keys
export const BEHAVIORAL_PATTERN_KEYS = {
  lists: (params?: BehavioralPatternQueryParams) => ['behavioralPatterns', params] as const,
  detail: (id: string) => ['behavioralPatterns', id] as const,
};

// Base URL
const BASE_URL = '/uba/behavioral-pattern';

// Fetch all Behavioral Patterns (paginated)
const fetchBehavioralPatterns = async (
  params: BehavioralPatternQueryParams = {}
): Promise<PaginatedResponse<BehavioralPattern>> => {
  const response = await apiClient.get<PaginatedResponse<BehavioralPattern>>(BASE_URL, {
    params,
  });
  return response.data;
};

export const useGetBehavioralPatterns = (params: BehavioralPatternQueryParams = {}) => {
  const { withLoading } = useApiLoading();
  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== null && value !== undefined)
  ) : {};

  return useQuery<PaginatedResponse<BehavioralPattern>, Error>({
    queryKey: BEHAVIORAL_PATTERN_KEYS.lists(filteredParams),
    queryFn: () => withLoading(() => fetchBehavioralPatterns(filteredParams)),
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000 // 5 minutes stale time
  });
};

// Fetch a single Behavioral Pattern by ID
const fetchBehavioralPatternById = async (id: string): Promise<BehavioralPattern> => {
  const response = await apiClient.get<ApiResponse<BehavioralPattern>>(`${BASE_URL}/${id}`);
  return response.data.data || response.data;
};

export const useGetBehavioralPatternById = (id: string) => {
  const { withLoading } = useApiLoading();
  return useQuery<BehavioralPattern, Error>({
    queryKey: BEHAVIORAL_PATTERN_KEYS.detail(id),
    queryFn: () => withLoading(() => fetchBehavioralPatternById(id)),
    enabled: !!id, 
    staleTime: 5 * 60 * 1000
  });
};

// Create a new Behavioral Pattern
const createBehavioralPattern = async (
  data: CreateBehavioralPatternDto
): Promise<BehavioralPattern> => {
  const response = await apiClient.post<ApiResponse<BehavioralPattern>>(BASE_URL, data);
  return response.data.data || response.data;
};

export const useCreateBehavioralPattern = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<BehavioralPattern, Error, CreateBehavioralPatternDto>({
    mutationFn: (newData) => withLoading(() => createBehavioralPattern(newData)),
    onSuccess: (data) => {
      showToast(`Behavioral Pattern for ${data.businessUnit} (${data.month}/${data.year}) created successfully`, 'success');
      queryClient.invalidateQueries({ queryKey: BEHAVIORAL_PATTERN_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Create error:', error);
      showToast(`Failed to create Behavioral Pattern: ${error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Update an existing Behavioral Pattern
const updateBehavioralPattern = async (id: string, data: UpdateBehavioralPatternDto): Promise<BehavioralPattern> => {
  const response = await apiClient.patch<ApiResponse<BehavioralPattern>>(`${BASE_URL}/${id}`, data);
  return response.data.data || response.data;
};

export const useUpdateBehavioralPattern = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<BehavioralPattern, Error, { id: string; data: UpdateBehavioralPatternDto }>({
    mutationFn: ({ id, data }) => withLoading(() => updateBehavioralPattern(id, data)),
    onSuccess: (data, variables) => {
      showToast(`Behavioral Pattern for ${data.businessUnit} (${data.month}/${data.year}) updated successfully`, 'success');
      queryClient.invalidateQueries({ queryKey: BEHAVIORAL_PATTERN_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: BEHAVIORAL_PATTERN_KEYS.lists() });
    },
    onError: (error: any, variables) => {
      console.error('Update error:', error);
      showToast(`Failed to update Behavioral Pattern (ID: ${variables.id}): ${error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Delete a Behavioral Pattern
const deleteBehavioralPattern = async (id: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`);
    return response.data;
};

export const useDeleteBehavioralPattern = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ApiResponse<null>, Error, string>({
    mutationFn: (id) => withLoading(() => deleteBehavioralPattern(id)),
    onSuccess: (data, id) => {
      if (data.success === false) {
         throw new Error(data.message || 'Deletion failed according to API response');
      }
      showToast(`Behavioral Pattern (ID: ${id}) deleted successfully`, 'success');
      queryClient.removeQueries({ queryKey: BEHAVIORAL_PATTERN_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: BEHAVIORAL_PATTERN_KEYS.lists() });
    },
    onError: (error: any, id) => {
      console.error('Delete error:', error);
      showToast(`Failed to delete Behavioral Pattern (ID: ${id}): ${error.message || 'Unknown error'}`, 'error');
    },
  });
};
