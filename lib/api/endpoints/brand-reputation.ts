import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../config';
import { 
  ApiResponse, 
  BrandReputation,
  CreateBrandReputationDto,
  UpdateBrandReputationDto,
  BrandReputationQueryParams
} from '../types';
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// API Keys for Brand Reputation
export const BRAND_REPUTATION_KEYS = {
  // Brand Reputation
  brandReputationLists: () => ['brandReputations'] as const,
  brandReputationDetail: (id: string) => ['brandReputations', id] as const,
  
  // All lists
  lists: () => ['brandReputationLists'] as const,
};

// Base URL for all brand reputation endpoints
const BASE_URL = '/brand-reputation';

// ==================== Brand Reputation ====================

// Get all brand reputations
export const useGetBrandReputations = (params?: BrandReputationQueryParams) => {
  const { withLoading } = useApiLoading();
  
  return useQuery({
    queryKey: BRAND_REPUTATION_KEYS.brandReputationLists(),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<BrandReputation[]>>(BASE_URL, { params }));
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get brand reputation by ID
export const useGetBrandReputationById = (id: string) => {
  const { withLoading } = useApiLoading();
  
  return useQuery({
    queryKey: BRAND_REPUTATION_KEYS.brandReputationDetail(id),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<BrandReputation>>(`${BASE_URL}/${id}`));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Create brand reputation
export const useCreateBrandReputation = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (newBrandReputation: CreateBrandReputationDto) => {
      const response = await withLoading(() => apiClient.post<ApiResponse<BrandReputation>>(BASE_URL, newBrandReputation));
      return response.data.data;
    },
    onSuccess: (data) => {
      showToast('Brand reputation created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: BRAND_REPUTATION_KEYS.brandReputationLists() });
      queryClient.invalidateQueries({ queryKey: BRAND_REPUTATION_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to create brand reputation:', error);
      showToast('Failed to create brand reputation', 'error');
    },
  });
};

// Update brand reputation
export const useUpdateBrandReputation = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateBrandReputationDto & { id: string }) => {
      const response = await withLoading(() => apiClient.patch<ApiResponse<BrandReputation>>(`${BASE_URL}/${id}`, updateData));
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('Brand reputation updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: BRAND_REPUTATION_KEYS.brandReputationDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: BRAND_REPUTATION_KEYS.brandReputationLists() });
      queryClient.invalidateQueries({ queryKey: BRAND_REPUTATION_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to update brand reputation:', error);
      showToast('Failed to update brand reputation', 'error');
    },
  });
};

// Delete brand reputation
export const useDeleteBrandReputation = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await withLoading(() => apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`));
      return response.data;
    },
    onSuccess: (_, id) => {
      showToast('Brand reputation deleted successfully', 'success');
      queryClient.removeQueries({ queryKey: BRAND_REPUTATION_KEYS.brandReputationDetail(id) });
      queryClient.invalidateQueries({ queryKey: BRAND_REPUTATION_KEYS.brandReputationLists() });
      queryClient.invalidateQueries({ queryKey: BRAND_REPUTATION_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to delete brand reputation:', error);
      showToast('Failed to delete brand reputation', 'error');
    },
  });
};
