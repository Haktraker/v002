

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import { ApiResponse, CreateThreatCompositionDto, ThreatComposition, ThreatIntelligenceQueryParams, UpdateThreatCompositionDto } from '../../types';
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';


// API Keys for Threat Composition
export const THREAT_COMPOSITION_KEYS = {
  lists: () => ['threatComposition'] as const,
  detail: (id: string) => ['threatComposition', id] as const,
};

// Base URL for all threat composition endpoints
const BASE_URL = '/reports/threat-composition-overview';

// Get all threat compositions
export const useGetThreatCompositions = (params?: ThreatIntelligenceQueryParams) => {
  const { withLoading } = useApiLoading();
  
  return useQuery({
    queryKey: THREAT_COMPOSITION_KEYS.lists(),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<ThreatComposition[]>>(BASE_URL, { params }));
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get threat composition by ID
export const useGetThreatCompositionById = (id: string) => {
  const { withLoading } = useApiLoading();
  
  return useQuery({
    queryKey: THREAT_COMPOSITION_KEYS.detail(id),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<ThreatComposition>>(`${BASE_URL}/${id}`));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Create threat composition
export const useCreateThreatComposition = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (newThreatComposition: CreateThreatCompositionDto) => {
      const response = await withLoading(() => apiClient.post<ApiResponse<ThreatComposition>>(BASE_URL, newThreatComposition));
      return response.data.data;
    },
    onSuccess: () => {
      showToast('Threat composition created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: THREAT_COMPOSITION_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to create threat composition:', error);
      showToast('Failed to create threat composition', 'error');
    },
  });
};

// Update threat composition
export const useUpdateThreatComposition = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateThreatCompositionDto & { id: string }) => {
      const response = await withLoading(() => apiClient.patch<ApiResponse<ThreatComposition>>(`${BASE_URL}/${id}`, updateData));
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('Threat composition updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: THREAT_COMPOSITION_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: THREAT_COMPOSITION_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to update threat composition:', error);
      showToast('Failed to update threat composition', 'error');
    },
  });
};

// Delete threat composition
export const useDeleteThreatComposition = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await withLoading(() => apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`));
      return response.data;
    },
    onSuccess: (_, id) => {
      showToast('Threat composition deleted successfully', 'success');
      queryClient.removeQueries({ queryKey: THREAT_COMPOSITION_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: THREAT_COMPOSITION_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to delete threat composition:', error);
      showToast('Failed to delete threat composition', 'error');
    },
  });
};