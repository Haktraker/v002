import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import {
  ApiResponse,
  PaginatedResponse,
  RiskScoreDistribution,
  CreateRiskScoreDistributionDto,
  UpdateRiskScoreDistributionDto,
  RiskScoreDistributionQueryParams,
} from '@/lib/api/types';
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// API Keys
export const RISK_SCORE_DISTRIBUTION_KEYS = {
  lists: (params?: RiskScoreDistributionQueryParams) => ['riskScoreDistributions', params] as const,
  detail: (id: string) => ['riskScoreDistributions', id] as const,
};

// Base URL
const BASE_URL = '/uba/risk-score-distributions';

// Fetch all Risk Score Distributions (paginated)
const fetchRiskScoreDistributions = async (
  params: RiskScoreDistributionQueryParams = {}
): Promise<PaginatedResponse<RiskScoreDistribution>> => {
  const response = await apiClient.get<PaginatedResponse<RiskScoreDistribution>>(BASE_URL, {
    params,
  });
  return response.data;
};

export const useGetRiskScoreDistributions = (params: RiskScoreDistributionQueryParams = {}) => {
  const { withLoading } = useApiLoading();
  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== null && value !== undefined)
  ) : {};

  return useQuery<PaginatedResponse<RiskScoreDistribution>, Error>({
    queryKey: RISK_SCORE_DISTRIBUTION_KEYS.lists(filteredParams),
    queryFn: () => withLoading(() => fetchRiskScoreDistributions(filteredParams)),
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000
  });
};

// Fetch a single Risk Score Distribution by ID
const fetchRiskScoreDistributionById = async (id: string): Promise<RiskScoreDistribution> => {
  const response = await apiClient.get<ApiResponse<RiskScoreDistribution>>(`${BASE_URL}/${id}`);
  return response.data.data || response.data;
};

export const useGetRiskScoreDistributionById = (id: string) => {
  const { withLoading } = useApiLoading();
  return useQuery<RiskScoreDistribution, Error>({
    queryKey: RISK_SCORE_DISTRIBUTION_KEYS.detail(id),
    queryFn: () => withLoading(() => fetchRiskScoreDistributionById(id)),
    enabled: !!id,
    staleTime: 5 * 60 * 1000
  });
};

// Create a new Risk Score Distribution
const createRiskScoreDistribution = async (
  data: CreateRiskScoreDistributionDto
): Promise<RiskScoreDistribution> => {
  const response = await apiClient.post<ApiResponse<RiskScoreDistribution>>(BASE_URL, data);
  return response.data.data || response.data;
};

export const useCreateRiskScoreDistribution = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<RiskScoreDistribution, Error, CreateRiskScoreDistributionDto>({
    mutationFn: (newData) => withLoading(() => createRiskScoreDistribution(newData)),
    onSuccess: (data) => {
      showToast(`Risk Score Distribution for ${data.month}/${data.year} created successfully`, 'success');
      queryClient.invalidateQueries({ queryKey: RISK_SCORE_DISTRIBUTION_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Create error:', error);
      showToast(`Failed to create Risk Score Distribution: ${error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Update an existing Risk Score Distribution
const updateRiskScoreDistribution = async (id: string, data: UpdateRiskScoreDistributionDto): Promise<RiskScoreDistribution> => {
  const response = await apiClient.patch<ApiResponse<RiskScoreDistribution>>(`${BASE_URL}/${id}`, data);
  return response.data.data || response.data;
};

export const useUpdateRiskScoreDistribution = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<RiskScoreDistribution, Error, { id: string; data: UpdateRiskScoreDistributionDto }>({
    mutationFn: ({ id, data }) => withLoading(() => updateRiskScoreDistribution(id, data)),
    onSuccess: (data, variables) => {
      showToast(`Risk Score Distribution for ${data.month}/${data.year} updated successfully`, 'success');
      queryClient.invalidateQueries({ queryKey: RISK_SCORE_DISTRIBUTION_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: RISK_SCORE_DISTRIBUTION_KEYS.lists() });
    },
    onError: (error: any, variables) => {
      console.error('Update error:', error);
      showToast(`Failed to update Risk Score Distribution (ID: ${variables.id}): ${error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Delete a Risk Score Distribution
const deleteRiskScoreDistribution = async (id: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`);
    return response.data;
};

export const useDeleteRiskScoreDistribution = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ApiResponse<null>, Error, string>({
    mutationFn: (id) => withLoading(() => deleteRiskScoreDistribution(id)),
    onSuccess: (data, id) => {
      if (data.success === false) {
         throw new Error(data.message || 'Deletion failed according to API response');
      }
      showToast(`Risk Score Distribution (ID: ${id}) deleted successfully`, 'success');
      queryClient.removeQueries({ queryKey: RISK_SCORE_DISTRIBUTION_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: RISK_SCORE_DISTRIBUTION_KEYS.lists() });
    },
    onError: (error: any, id) => {
      console.error('Delete error:', error);
      showToast(`Failed to delete Risk Score Distribution (ID: ${id}): ${error.message || 'Unknown error'}`, 'error');
    },
  });
};
