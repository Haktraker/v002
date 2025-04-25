import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import {
  ApiResponse,
  ComplianceRiskDistribution,
  ComplianceRiskDistributionQueryParams,
  CreateComplianceRiskDistributionDto,
  UpdateComplianceRiskDistributionDto
} from '@/lib/api/types';
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// API Keys for Compliance Risk Distribution
export const COMPLIANCE_RISK_DISTRIBUTION_KEYS = {
  lists: (params?: ComplianceRiskDistributionQueryParams) => ['complianceRiskDistributions', params] as const,
  detail: (id: string) => ['complianceRiskDistributions', id] as const,
};

// Base URL
const BASE_URL = '/non-compliance-gaps-dashboard/compliance-risk-distribution';

// GET - Fetch all Compliance Risk Distributions
export const useGetComplianceRiskDistributions = (params?: ComplianceRiskDistributionQueryParams) => {
  const { withLoading } = useApiLoading();
  
  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== null && value !== undefined)
  ) : {};
  
  return useQuery<ComplianceRiskDistribution[]>({ 
    queryKey: COMPLIANCE_RISK_DISTRIBUTION_KEYS.lists(filteredParams),
    queryFn: async () => {
      const response = await withLoading(() => 
        apiClient.get<ApiResponse<ComplianceRiskDistribution[]>>(BASE_URL, { params: filteredParams })
      );
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// GET - Fetch a single Compliance Risk Distribution by ID
export const useGetComplianceRiskDistributionById = (id: string) => {
  const { withLoading } = useApiLoading();
  
  return useQuery<ComplianceRiskDistribution>({ 
    queryKey: COMPLIANCE_RISK_DISTRIBUTION_KEYS.detail(id),
    queryFn: async () => {
      const response = await withLoading(() => 
        apiClient.get<ApiResponse<ComplianceRiskDistribution>>(`${BASE_URL}/${id}`)
      );
      return response.data.data;
    },
    enabled: !!id, 
    staleTime: 5 * 60 * 1000
  });
};

// POST - Create a new Compliance Risk Distribution entry
export const useCreateComplianceRiskDistribution = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (newData: CreateComplianceRiskDistributionDto) => {
      const response = await withLoading(() => 
        apiClient.post<ApiResponse<ComplianceRiskDistribution>>(BASE_URL, newData)
      );
      return response.data.data;
    },
    onSuccess: () => {
      showToast('Compliance risk distribution created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: COMPLIANCE_RISK_DISTRIBUTION_KEYS.lists({}) });
    },
    onError: (error: any) => {
      console.error('Failed to create compliance risk distribution:', error);
      showToast('Failed to create compliance risk distribution', 'error');
    },
  });
};

// PATCH - Update an existing Compliance Risk Distribution entry
export const useUpdateComplianceRiskDistribution = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateComplianceRiskDistributionDto & { id: string }) => {
      const response = await withLoading(() => 
        apiClient.patch<ApiResponse<ComplianceRiskDistribution>>(`${BASE_URL}/${id}`, updateData)
      );
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('Compliance risk distribution updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: COMPLIANCE_RISK_DISTRIBUTION_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: COMPLIANCE_RISK_DISTRIBUTION_KEYS.lists({}) });
    },
    onError: (error: any) => {
      console.error('Failed to update compliance risk distribution:', error);
      showToast('Failed to update compliance risk distribution', 'error');
    },
  });
};

// DELETE - Delete a Compliance Risk Distribution entry
export const useDeleteComplianceRiskDistribution = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await withLoading(() => 
        apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`)
      );
      return response.data;
    },
    onSuccess: (_, id) => {
      showToast('Compliance risk distribution deleted successfully', 'success');
      queryClient.removeQueries({ queryKey: COMPLIANCE_RISK_DISTRIBUTION_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: COMPLIANCE_RISK_DISTRIBUTION_KEYS.lists({}) });
    },
    onError: (error: any) => {
      console.error('Failed to delete compliance risk distribution:', error);
      showToast('Failed to delete compliance risk distribution', 'error');
    },
  });
};
