'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import { ApiResponse, ComplianceFrameworkOverview, ComplianceFrameworkQueryParams, CreateComplianceFrameworkDto, UpdateComplianceFrameworkDto } from '@/lib/api/types';
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// API Keys for Compliance Framework Overview
export const COMPLIANCE_FRAMEWORK_KEYS = {
  lists: (params?: ComplianceFrameworkQueryParams) => ['complianceFrameworks', params] as const,
  detail: (id: string) => ['complianceFrameworks', id] as const,
};

// Base URL for all compliance framework endpoints
const BASE_URL = '/non-compliance-gaps-dashboard/compliance-gaps-by-frame-work';

// Get all compliance frameworks
export const useGetComplianceFrameworks = (params?: ComplianceFrameworkQueryParams) => {
  const { withLoading } = useApiLoading();
  
  // Filter out null/undefined params
  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== null && value !== undefined)
  ) : {};
  
  return useQuery<ComplianceFrameworkOverview[]>({
    queryKey: COMPLIANCE_FRAMEWORK_KEYS.lists(filteredParams),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<ComplianceFrameworkOverview[]>>(BASE_URL, { 
        params: filteredParams 
      }));
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get compliance framework by ID
export const useGetComplianceFrameworkById = (id: string) => {
  const { withLoading } = useApiLoading();
  
  return useQuery({
    queryKey: COMPLIANCE_FRAMEWORK_KEYS.detail(id),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<ComplianceFrameworkOverview>>(`${BASE_URL}/${id}`));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Create compliance framework
export const useCreateComplianceFramework = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (newComplianceFramework: CreateComplianceFrameworkDto) => {
      const response = await withLoading(() => apiClient.post<ApiResponse<ComplianceFrameworkOverview>>(BASE_URL, newComplianceFramework));
      return response.data.data;
    },
    onSuccess: () => {
      showToast('Compliance framework created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: COMPLIANCE_FRAMEWORK_KEYS.lists({}) });
    },
    onError: (error: any) => {
      console.error('Failed to create compliance framework:', error);
      showToast('Failed to create compliance framework', 'error');
    },
  });
};

// Update compliance framework
export const useUpdateComplianceFramework = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateComplianceFrameworkDto & { id: string }) => {
      const response = await withLoading(() => apiClient.patch<ApiResponse<ComplianceFrameworkOverview>>(`${BASE_URL}/${id}`, updateData));
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('Compliance framework updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: COMPLIANCE_FRAMEWORK_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: COMPLIANCE_FRAMEWORK_KEYS.lists({}) });
    },
    onError: (error: any) => {
      console.error('Failed to update compliance framework:', error);
      showToast('Failed to update compliance framework', 'error');
    },
  });
};

// Delete compliance framework
export const useDeleteComplianceFramework = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await withLoading(() => apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`));
      return response.data;
    },
    onSuccess: (_, id) => {
      showToast('Compliance framework deleted successfully', 'success');
      queryClient.removeQueries({ queryKey: COMPLIANCE_FRAMEWORK_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: COMPLIANCE_FRAMEWORK_KEYS.lists({}) });
    },
    onError: (error: any) => {
      console.error('Failed to delete compliance framework:', error);
      showToast('Failed to delete compliance framework', 'error');
    },
  });
};