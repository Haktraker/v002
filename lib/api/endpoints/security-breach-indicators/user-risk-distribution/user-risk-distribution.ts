'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import { ApiResponse, UserRiskDistribution, UserRiskDistributionQueryParams, CreateUserRiskDistributionDto, UpdateUserRiskDistributionDto } from '../../../types';
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// API Keys for User Risk Distribution
export const USER_RISK_DISTRIBUTION_KEYS = {
  lists: (params?: UserRiskDistributionQueryParams) => ['userRiskDistribution', params] as const, // Include params in key
  detail: (id: string) => ['userRiskDistribution', id] as const,
};

// Base URL for all user risk distribution endpoints
const BASE_URL = '/security-breach-indicators-dashboard/user-risk-distribution';

// Get all user risk distributions
export const useGetUserRiskDistributions = (params?: UserRiskDistributionQueryParams): ReturnType<typeof useQuery<UserRiskDistribution[], Error>> => {
  const { withLoading } = useApiLoading();
  
  return useQuery({
    queryKey: USER_RISK_DISTRIBUTION_KEYS.lists(params), // Use params in queryKey
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<UserRiskDistribution[]>>(BASE_URL, { params }));
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get user risk distribution by ID
export const useGetUserRiskDistributionById = (id: string) => {
  const { withLoading } = useApiLoading();
  
  return useQuery({
    queryKey: USER_RISK_DISTRIBUTION_KEYS.detail(id),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<UserRiskDistribution>>(`${BASE_URL}/${id}`));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Create user risk distribution
export const useCreateUserRiskDistribution = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (newUserRiskDistribution: CreateUserRiskDistributionDto) => {
      const response = await withLoading(() => apiClient.post<ApiResponse<UserRiskDistribution>>(BASE_URL, newUserRiskDistribution));
      return response.data.data;
    },
    onSuccess: () => {
      showToast('User risk distribution created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: USER_RISK_DISTRIBUTION_KEYS.lists({}) }); // Invalidate base list
    },
    onError: (error: any) => {
      console.error('Failed to create user risk distribution:', error);
      showToast('Failed to create user risk distribution', 'error');
    },
  });
};

// Update user risk distribution
export const useUpdateUserRiskDistribution = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateUserRiskDistributionDto & { id: string }) => {
      const response = await withLoading(() => apiClient.patch<ApiResponse<UserRiskDistribution>>(`${BASE_URL}/${id}`, updateData));
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('User risk distribution updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: USER_RISK_DISTRIBUTION_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: USER_RISK_DISTRIBUTION_KEYS.lists({}) }); // Invalidate base list
    },
    onError: (error: any) => {
      console.error('Failed to update user risk distribution:', error);
      showToast('Failed to update user risk distribution', 'error');
    },
  });
};

// Delete user risk distribution
export const useDeleteUserRiskDistribution = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await withLoading(() => apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`));
      return response.data;
    },
    onSuccess: (_, id) => {
      showToast('User risk distribution deleted successfully', 'success');
      queryClient.removeQueries({ queryKey: USER_RISK_DISTRIBUTION_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: USER_RISK_DISTRIBUTION_KEYS.lists({}) }); // Invalidate base list
    },
    onError: (error: any) => {
      console.error('Failed to delete user risk distribution:', error);
      showToast('Failed to delete user risk distribution', 'error');
    },
  });
};