import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../config';
import { 
  ApiResponse,
  DarkWebMention,
  CreateDarkWebMentionDto,
  UpdateDarkWebMentionDto,
  DarkWebMentionQueryParams
} from '../../types';
import { useApiLoading } from '@/lib/utils/api-utils';
import { toast } from 'sonner';
import { showToast } from '@/lib/utils/toast-utils';

// API Keys for Dark Web Mentions
const DARK_WEB_MENTIONS_KEYS = {
  all: ['darkWebMentions'] as const,
  lists: () => [...DARK_WEB_MENTIONS_KEYS.all, 'list'] as const,
  list: (filters: DarkWebMentionQueryParams) => [...DARK_WEB_MENTIONS_KEYS.lists(), filters] as const,
  details: () => [...DARK_WEB_MENTIONS_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...DARK_WEB_MENTIONS_KEYS.details(), id] as const,
};

// Base URL for dark web mentions endpoints
const BASE_URL = '/dark-web-monitoring/dark-web-mentions';

// Get all dark web mentions
export const useGetDarkWebMentions = (params?: DarkWebMentionQueryParams) => {
  const { withLoading } = useApiLoading();
  
  return useQuery({
    queryKey: DARK_WEB_MENTIONS_KEYS.list(params || {}),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<DarkWebMention[]>>(BASE_URL, { params }));
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get dark web mention by ID
export const useGetDarkWebMentionById = (id: string) => {
  const { withLoading } = useApiLoading();
  
  return useQuery({
    queryKey: DARK_WEB_MENTIONS_KEYS.detail(id),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<DarkWebMention>>(`${BASE_URL}/${id}`));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Create dark web mention
export const useCreateDarkWebMention = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (data: CreateDarkWebMentionDto) => {
      const response = await withLoading(() => apiClient.post<ApiResponse<DarkWebMention>>(BASE_URL, data));
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DARK_WEB_MENTIONS_KEYS.lists() });
      showToast("Dark web mention created successfully", "success");
    },
    onError: (error: any) => {
      console.error("Error creating dark web mention:", error);
      showToast("Failed to create dark web mention", "error");
    },
  });
};

// Update dark web mention
export const useUpdateDarkWebMention = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateDarkWebMentionDto }) => {
      const response = await withLoading(() => apiClient.patch<ApiResponse<DarkWebMention>>(`${BASE_URL}/${id}`, data));
      return response.data.data;
    },
    onSuccess: (_, { id }) => {
      showToast("Dark web mention updated successfully", "success");
      queryClient.invalidateQueries({ queryKey: DARK_WEB_MENTIONS_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: DARK_WEB_MENTIONS_KEYS.detail(id) });
    },
    onError: (error: any) => {
      console.error("Error updating dark web mention:", error);
      showToast("Failed to update dark web mention", "error");
    },
  });
};

// Delete dark web mention
export const useDeleteDarkWebMention = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await withLoading(() => apiClient.delete<ApiResponse<void>>(`${BASE_URL}/${id}`));
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: DARK_WEB_MENTIONS_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: DARK_WEB_MENTIONS_KEYS.detail(id) });
      showToast("Dark web mention deleted successfully", "success");
    },
    onError: (error: any) => {
      console.error("Error deleting dark web mention:", error);
      showToast("Failed to delete dark web mention", "error");
    },
  });
};