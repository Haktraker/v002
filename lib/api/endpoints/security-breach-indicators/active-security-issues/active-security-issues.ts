'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import { ApiResponse, SecurityIssue, SecurityIssueQueryParams, CreateSecurityIssueDto, UpdateSecurityIssueDto } from '../../../types'; // Adjusted import path and types
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// API Keys for Security Issues
export const SECURITY_ISSUES_KEYS = {
  lists: (params?: SecurityIssueQueryParams) => ['securityIssues', params] as const, // Include params in key
  detail: (id: string) => ['securityIssues', id] as const,
};

// Base URL for all security issues endpoints
const BASE_URL = '/security-breach-indicators-dashboard/security-issue'; // Updated base URL

// Get all security issues
export const useGetSecurityIssues = (params?: SecurityIssueQueryParams) => {
  const { withLoading } = useApiLoading();
  
  // Filter out null/undefined params
  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== null && value !== undefined)
  ) : undefined;
  
  return useQuery<SecurityIssue[]>({ // Use SecurityIssue type
    queryKey: SECURITY_ISSUES_KEYS.lists(filteredParams), // Use params in queryKey
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<SecurityIssue[]>>(BASE_URL, { 
        params: filteredParams 
      }));
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get security issue by ID
export const useGetSecurityIssueById = (id: string) => {
  const { withLoading } = useApiLoading();

  return useQuery({
    queryKey: SECURITY_ISSUES_KEYS.detail(id),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<SecurityIssue>>(`${BASE_URL}/${id}`));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Create security issue
export const useCreateSecurityIssue = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (newSecurityIssue: CreateSecurityIssueDto) => {
      const response = await withLoading(() => apiClient.post<ApiResponse<SecurityIssue>>(BASE_URL, newSecurityIssue));
      return response.data.data;
    },
    onSuccess: () => {
      showToast('Security issue created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: SECURITY_ISSUES_KEYS.lists({}) }); // Invalidate base list
    },
    onError: (error: any) => {
      console.error('Failed to create security issue:', error);
      showToast('Failed to create security issue', 'error');
    },
  });
};

// Update security issue
export const useUpdateSecurityIssue = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateSecurityIssueDto & { id: string }) => {
      const response = await withLoading(() => apiClient.patch<ApiResponse<SecurityIssue>>(`${BASE_URL}/${id}`, updateData));
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('Security issue updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: SECURITY_ISSUES_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: SECURITY_ISSUES_KEYS.lists({}) }); // Invalidate base list
    },
    onError: (error: any) => {
      console.error('Failed to update security issue:', error);
      showToast('Failed to update security issue', 'error');
    },
  });
};

// Delete security issue
export const useDeleteSecurityIssue = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await withLoading(() => apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`));
      return response.data;
    },
    onSuccess: (_, id) => {
      showToast('Security issue deleted successfully', 'success');
      queryClient.removeQueries({ queryKey: SECURITY_ISSUES_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: SECURITY_ISSUES_KEYS.lists({}) }); // Invalidate base list
    },
    onError: (error: any) => {
      console.error('Failed to delete security issue:', error);
      showToast('Failed to delete security issue', 'error');
    },
  });
};