'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import { ApiResponse, ComplianceScore, ComplianceScoreQueryParams, CreateComplianceScoreDto, UpdateComplianceScoreDto } from '../../../types';
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// API Keys for Compliance Scores
export const COMPLIANCE_SCORES_KEYS = {
  lists: (params?: ComplianceScoreQueryParams) => ['complianceScores', params] as const, // Include params in key
  detail: (id: string) => ['complianceScores', id] as const,
};

// Base URL for all compliance scores endpoints
const BASE_URL = '/security-breach-indicators-dashboard/compliance-score';

// Get all compliance scores
export const useGetComplianceScores = (params?: ComplianceScoreQueryParams) => {
  const { withLoading } = useApiLoading();
  
  return useQuery<ComplianceScore[]>({ // Add explicit type here
    queryKey: COMPLIANCE_SCORES_KEYS.lists(params), // Use params in queryKey
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<ComplianceScore[]>>(BASE_URL, { params }));
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get compliance score by ID
export const useGetComplianceScoreById = (id: string) => {
  const { withLoading } = useApiLoading();
  
  return useQuery({
    queryKey: COMPLIANCE_SCORES_KEYS.detail(id),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<ComplianceScore>>(`${BASE_URL}/${id}`));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Create compliance score
export const useCreateComplianceScore = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (newComplianceScore: CreateComplianceScoreDto) => {
      const response = await withLoading(() => apiClient.post<ApiResponse<ComplianceScore>>(BASE_URL, newComplianceScore));
      return response.data.data;
    },
    onSuccess: () => {
      showToast('Compliance score created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: COMPLIANCE_SCORES_KEYS.lists({}) }); // Invalidate base list
    },
    onError: (error: any) => {
      console.error('Failed to create compliance score:', error);
      showToast('Failed to create compliance score', 'error');
    },
  });
};

// Update compliance score
export const useUpdateComplianceScore = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateComplianceScoreDto & { id: string }) => {
      const response = await withLoading(() => apiClient.patch<ApiResponse<ComplianceScore>>(`${BASE_URL}/${id}`, updateData));
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('Compliance score updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: COMPLIANCE_SCORES_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: COMPLIANCE_SCORES_KEYS.lists({}) }); // Invalidate base list
    },
    onError: (error: any) => {
      console.error('Failed to update compliance score:', error);
      showToast('Failed to update compliance score', 'error');
    },
  });
};

// Delete compliance score
export const useDeleteComplianceScore = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await withLoading(() => apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`));
      return response.data;
    },
    onSuccess: (_, id) => {
      showToast('Compliance score deleted successfully', 'success');
      queryClient.removeQueries({ queryKey: COMPLIANCE_SCORES_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: COMPLIANCE_SCORES_KEYS.lists({}) }); // Invalidate base list
    },
    onError: (error: any) => {
      console.error('Failed to delete compliance score:', error);
      showToast('Failed to delete compliance score', 'error');
    },
  });
};