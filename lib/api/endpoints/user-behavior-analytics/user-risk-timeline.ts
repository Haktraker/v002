import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import {
  ApiResponse,
  PaginatedResponse,
  UserRiskTimeline,
  CreateUserRiskTimelineDto,
  UpdateUserRiskTimelineDto,
  UserRiskTimelineQueryParams,
} from '@/lib/api/types';
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// API Keys
export const USER_RISK_TIMELINE_KEYS = {
  lists: (params?: UserRiskTimelineQueryParams) => ['userRiskTimeline', params] as const,
  detail: (id: string) => ['userRiskTimeline', id] as const,
};

// Base URL
const BASE_URL = '/uba/user-risk-timeline';

// Fetch all Risk Timeline entries (paginated)
const fetchUserRiskTimelines = async (
  params: UserRiskTimelineQueryParams = {}
): Promise<PaginatedResponse<UserRiskTimeline>> => {
  const response = await apiClient.get<PaginatedResponse<UserRiskTimeline>>(BASE_URL, {
    params,
  });
  return response.data;
};

export const useGetUserRiskTimelines = (params: UserRiskTimelineQueryParams = {}) => {
  const { withLoading } = useApiLoading();
  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== null && value !== undefined)
  ) : {};

  return useQuery<PaginatedResponse<UserRiskTimeline>, Error>({
    queryKey: USER_RISK_TIMELINE_KEYS.lists(filteredParams),
    queryFn: () => withLoading(() => fetchUserRiskTimelines(filteredParams)),
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000 // 5 minutes stale time
  });
};

// Fetch a single Risk Timeline entry by ID
const fetchUserRiskTimelineById = async (id: string): Promise<UserRiskTimeline> => {
  const response = await apiClient.get<ApiResponse<UserRiskTimeline>>(`${BASE_URL}/${id}`);
  return response.data.data || response.data;
};

export const useGetUserRiskTimelineById = (id: string) => {
  const { withLoading } = useApiLoading();
  return useQuery<UserRiskTimeline, Error>({
    queryKey: USER_RISK_TIMELINE_KEYS.detail(id),
    queryFn: () => withLoading(() => fetchUserRiskTimelineById(id)),
    enabled: !!id, 
    staleTime: 5 * 60 * 1000
  });
};

// Create a new Risk Timeline entry
// NOTE: The API likely expects the payload to match the structure of the 'risk' object
const createUserRiskTimeline = async (
  data: CreateUserRiskTimelineDto
): Promise<UserRiskTimeline> => {
   // The DTO matches the 'risk' subdocument structure, assuming the API expects this directly.
   // If the API expects { risk: { ... } }, adjust the payload here.
  const response = await apiClient.post<ApiResponse<UserRiskTimeline>>(BASE_URL, data);
  return response.data.data || response.data;
};

export const useCreateUserRiskTimeline = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<UserRiskTimeline, Error, CreateUserRiskTimelineDto>({
    mutationFn: (newData) => withLoading(() => createUserRiskTimeline(newData)),
    onSuccess: (data) => {
      showToast(`User Risk Timeline entry for ${data.risk.month}/${data.risk.day}/${data.risk.year} created successfully`, 'success');
      queryClient.invalidateQueries({ queryKey: USER_RISK_TIMELINE_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Create error:', error);
      showToast(`Failed to create User Risk Timeline entry: ${error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Update an existing Risk Timeline entry
// NOTE: API might expect updates applied to the nested 'risk' object.
const updateUserRiskTimeline = async (id: string, data: UpdateUserRiskTimelineDto): Promise<UserRiskTimeline> => {
  // The UpdateDTO is { risk?: Partial<...> }. This assumes the PATCH endpoint accepts this structure.
  const response = await apiClient.patch<ApiResponse<UserRiskTimeline>>(`${BASE_URL}/${id}`, data);
  return response.data.data || response.data;
};

export const useUpdateUserRiskTimeline = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<UserRiskTimeline, Error, { id: string; data: UpdateUserRiskTimelineDto }>({
    mutationFn: ({ id, data }) => withLoading(() => updateUserRiskTimeline(id, data)),
    onSuccess: (data, variables) => {
      showToast(`User Risk Timeline entry for ${data.risk.month}/${data.risk.day}/${data.risk.year} updated successfully`, 'success');
      queryClient.invalidateQueries({ queryKey: USER_RISK_TIMELINE_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: USER_RISK_TIMELINE_KEYS.lists() });
    },
    onError: (error: any, variables) => {
      console.error('Update error:', error);
      showToast(`Failed to update User Risk Timeline entry (ID: ${variables.id}): ${error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Delete a Risk Timeline entry
const deleteUserRiskTimeline = async (id: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`);
    return response.data;
};

export const useDeleteUserRiskTimeline = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ApiResponse<null>, Error, string>({
    mutationFn: (id) => withLoading(() => deleteUserRiskTimeline(id)),
    onSuccess: (data, id) => {
      if (data.success === false) {
         throw new Error(data.message || 'Deletion failed according to API response');
      }
      showToast(`User Risk Timeline entry (ID: ${id}) deleted successfully`, 'success');
      queryClient.removeQueries({ queryKey: USER_RISK_TIMELINE_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: USER_RISK_TIMELINE_KEYS.lists() });
    },
    onError: (error: any, id) => {
      console.error('Delete error:', error);
      showToast(`Failed to delete User Risk Timeline entry (ID: ${id}): ${error.message || 'Unknown error'}`, 'error');
    },
  });
};
