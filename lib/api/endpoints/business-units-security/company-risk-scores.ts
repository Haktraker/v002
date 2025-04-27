import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import { ApiResponse, CompanyRiskScore, CompanyRiskScoreQueryParams, CreateCompanyRiskScoreDto, UpdateCompanyRiskScoreDto } from '@/lib/api/types';
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// API Keys for Company Risk Scores
export const COMPANY_RISK_SCORES_KEYS = {
  lists: (params?: CompanyRiskScoreQueryParams) => ['companyRiskScores', params] as const,
  detail: (id: string) => ['companyRiskScores', id] as const,
};

// Base URL for all company risk scores endpoints
const BASE_URL = '/bu-security/company-risk-scores';

// Get all company risk scores
export const useGetCompanyRiskScores = (params?: CompanyRiskScoreQueryParams) => {
  const { withLoading } = useApiLoading();

  // Filter out null/undefined params
  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== null && value !== undefined)
  ) : {};

  return useQuery<CompanyRiskScore[]>({ // Expecting an array of CompanyRiskScore
    queryKey: COMPANY_RISK_SCORES_KEYS.lists(filteredParams),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<CompanyRiskScore[]>>(BASE_URL, {
        params: filteredParams
      }));
      // Adjust based on your actual API response structure
      return response.data.data || response.data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get company risk score by ID
export const useGetCompanyRiskScoreById = (id: string) => {
  const { withLoading } = useApiLoading();

  return useQuery<CompanyRiskScore>({
    queryKey: COMPANY_RISK_SCORES_KEYS.detail(id),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<CompanyRiskScore>>(`${BASE_URL}/${id}`));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Create company risk score
export const useCreateCompanyRiskScore = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation<CompanyRiskScore, Error, CreateCompanyRiskScoreDto>({
    mutationFn: async (newScore: CreateCompanyRiskScoreDto) => {
      const response = await withLoading(() => apiClient.post<ApiResponse<CompanyRiskScore>>(BASE_URL, newScore));
      return response.data.data;
    },
    onSuccess: () => {
      showToast('Company Risk Score record created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: COMPANY_RISK_SCORES_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to create Company Risk Score record:', error);
      showToast(`Failed to create record: ${error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Update company risk score
export const useUpdateCompanyRiskScore = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation<CompanyRiskScore, Error, UpdateCompanyRiskScoreDto & { id: string }>({
    mutationFn: async ({ id, ...updateData }: UpdateCompanyRiskScoreDto & { id: string }) => {
      const response = await withLoading(() => apiClient.patch<ApiResponse<CompanyRiskScore>>(`${BASE_URL}/${id}`, updateData));
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('Company Risk Score record updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: COMPANY_RISK_SCORES_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: COMPANY_RISK_SCORES_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to update Company Risk Score record:', error);
      showToast(`Failed to update record: ${error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Delete company risk score
export const useDeleteCompanyRiskScore = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation<ApiResponse<null>, Error, string>({
    mutationFn: async (id: string) => {
      const response = await withLoading(() => apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`));
      return response.data;
    },
    onSuccess: (_, id) => {
      showToast('Company Risk Score record deleted successfully', 'success');
      queryClient.removeQueries({ queryKey: COMPANY_RISK_SCORES_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: COMPANY_RISK_SCORES_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to delete Company Risk Score record:', error);
      showToast(`Failed to delete record: ${error.message || 'Unknown error'}`, 'error');
    },
  });
};
