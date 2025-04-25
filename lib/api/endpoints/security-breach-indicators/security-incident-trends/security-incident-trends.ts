'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import { ApiResponse, SecurityIncidentTrend, SecurityIncidentTrendQueryParams, CreateSecurityIncidentTrendDto, UpdateSecurityIncidentTrendDto } from '../../../types';
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// API Keys for Security Incident Trends
export const SECURITY_INCIDENT_TRENDS_KEYS = {
  lists: (params?: SecurityIncidentTrendQueryParams) => ['securityIncidentTrends', params] as const, // Include params in key
  detail: (id: string) => ['securityIncidentTrends', id] as const,
};

// Base URL for all security incident trends endpoints
const BASE_URL = '/security-breach-indicators-dashboard/security-incident-trends';

// Get all security incident trends with pagination
export const useGetSecurityIncidentTrends = (params?: SecurityIncidentTrendQueryParams) => {
  const { withLoading } = useApiLoading();
  
  // Filter out null/undefined params
  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== null && value !== undefined)
  ) : {};
  
  return useQuery<SecurityIncidentTrend[]>({ // Add explicit type here
    queryKey: SECURITY_INCIDENT_TRENDS_KEYS.lists(filteredParams), // Use params in queryKey
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<{results: number, paginateResult: any, data: SecurityIncidentTrend[]}>(BASE_URL, { 
        params: filteredParams 
      }));
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get security incident trend by ID
export const useGetSecurityIncidentTrendById = (id: string) => {
  const { withLoading } = useApiLoading();
  
  return useQuery({
    queryKey: SECURITY_INCIDENT_TRENDS_KEYS.detail(id),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<SecurityIncidentTrend>>(`${BASE_URL}/${id}`));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Create security incident trend
export const useCreateSecurityIncidentTrend = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (newSecurityIncidentTrend: CreateSecurityIncidentTrendDto) => {
      const response = await withLoading(() => apiClient.post<ApiResponse<SecurityIncidentTrend>>(BASE_URL, newSecurityIncidentTrend));
      return response.data.data;
    },
    onSuccess: () => {
      showToast('Security incident trend created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: SECURITY_INCIDENT_TRENDS_KEYS.lists({}) }); // Invalidate base list
    },
    onError: (error: any) => {
      console.error('Failed to create security incident trend:', error);
      showToast('Failed to create security incident trend', 'error');
    },
  });
};

// Update security incident trend
export const useUpdateSecurityIncidentTrend = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateSecurityIncidentTrendDto & { id: string }) => {
      const response = await withLoading(() => apiClient.patch<ApiResponse<SecurityIncidentTrend>>(`${BASE_URL}/${id}`, updateData));
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('Security incident trend updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: SECURITY_INCIDENT_TRENDS_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: SECURITY_INCIDENT_TRENDS_KEYS.lists({}) }); // Invalidate base list
    },
    onError: (error: any) => {
      console.error('Failed to update security incident trend:', error);
      showToast('Failed to update security incident trend', 'error');
    },
  });
};

// Delete security incident trend
export const useDeleteSecurityIncidentTrend = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await withLoading(() => apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`));
      return response.data;
    },
    onSuccess: (_, id) => {
      showToast('Security incident trend deleted successfully', 'success');
      queryClient.removeQueries({ queryKey: SECURITY_INCIDENT_TRENDS_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: SECURITY_INCIDENT_TRENDS_KEYS.lists({}) }); // Invalidate base list
    },
    onError: (error: any) => {
      console.error('Failed to delete security incident trend:', error);
      showToast('Failed to delete security incident trend', 'error');
    },
  });
};