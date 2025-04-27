import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import { ApiResponse, RiskAssessmentByBu, RiskAssessmentByBuQueryParams, CreateRiskAssessmentByBuDto, UpdateRiskAssessmentByBuDto } from '@/lib/api/types';
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// API Keys for Risk Assessment By BU
export const RISK_ASSESSMENT_BY_BU_KEYS = {
  lists: (params?: RiskAssessmentByBuQueryParams) => ['riskAssessmentsByBu', params] as const,
  detail: (id: string) => ['riskAssessmentsByBu', id] as const,
};

// Base URL for endpoints
const BASE_URL = '/bu-security/risk-assessments-by-bu'; // Adjust if your endpoint differs

// Get all Risk Assessments
export const useGetRiskAssessmentsByBu = (params?: RiskAssessmentByBuQueryParams) => {
  const { withLoading } = useApiLoading();

  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== null && value !== undefined)
  ) : {};

  return useQuery<RiskAssessmentByBu[]>({ 
    queryKey: RISK_ASSESSMENT_BY_BU_KEYS.lists(filteredParams),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<RiskAssessmentByBu[]>>(BASE_URL, {
        params: filteredParams
      }));
      return response.data.data || response.data;
    },
    staleTime: 5 * 60 * 1000 
  });
};

// Get Risk Assessment by ID
export const useGetRiskAssessmentByBuById = (id: string) => {
  const { withLoading } = useApiLoading();

  return useQuery<RiskAssessmentByBu>({
    queryKey: RISK_ASSESSMENT_BY_BU_KEYS.detail(id),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<RiskAssessmentByBu>>(`${BASE_URL}/${id}`));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000
  });
};

// Create Risk Assessment
export const useCreateRiskAssessmentByBu = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation<RiskAssessmentByBu, Error, CreateRiskAssessmentByBuDto>({
    mutationFn: async (newAssessment: CreateRiskAssessmentByBuDto) => {
      const response = await withLoading(() => apiClient.post<ApiResponse<RiskAssessmentByBu>>(BASE_URL, newAssessment));
      return response.data.data;
    },
    onSuccess: () => {
      showToast('Risk Assessment record created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: RISK_ASSESSMENT_BY_BU_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to create Risk Assessment record:', error);
      showToast(`Failed to create record: ${error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Update Risk Assessment
export const useUpdateRiskAssessmentByBu = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation<RiskAssessmentByBu, Error, UpdateRiskAssessmentByBuDto & { id: string }>({
    mutationFn: async ({ id, ...updateData }: UpdateRiskAssessmentByBuDto & { id: string }) => {
      const response = await withLoading(() => apiClient.patch<ApiResponse<RiskAssessmentByBu>>(`${BASE_URL}/${id}`, updateData));
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('Risk Assessment record updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: RISK_ASSESSMENT_BY_BU_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: RISK_ASSESSMENT_BY_BU_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to update Risk Assessment record:', error);
      showToast(`Failed to update record: ${error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Delete Risk Assessment
export const useDeleteRiskAssessmentByBu = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation<ApiResponse<null>, Error, string>({
    mutationFn: async (id: string) => {
      const response = await withLoading(() => apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`));
      return response.data;
    },
    onSuccess: (_, id) => {
      showToast('Risk Assessment record deleted successfully', 'success');
      queryClient.removeQueries({ queryKey: RISK_ASSESSMENT_BY_BU_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: RISK_ASSESSMENT_BY_BU_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to delete Risk Assessment record:', error);
      showToast(`Failed to delete record: ${error.message || 'Unknown error'}`, 'error');
    },
  });
};
