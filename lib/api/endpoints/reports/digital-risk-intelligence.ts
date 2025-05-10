import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import {
    ApiResponse,
    ReportsDigitalRiskIntelligence,
    ReportsDigitalRiskIntelligenceQueryParams,
    CreateReportsDigitalRiskIntelligenceDto,
    UpdateReportsDigitalRiskIntelligenceDto
} from '@/lib/api/reports-types/types'; // Assuming these types are defined here
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// API Keys
export const REPORTS_DIGITAL_RISK_INTELLIGENCE_KEYS = {
  lists: (params?: ReportsDigitalRiskIntelligenceQueryParams) => ['reportsDigitalRiskIntelligence', params] as const,
  detail: (id: string) => ['reportsDigitalRiskIntelligence', id] as const,
};

// Base URL
const BASE_URL = '/reports/digital-risk-intelligence';

// Get all records
export const useGetReportsDigitalRiskIntelligence = (params?: ReportsDigitalRiskIntelligenceQueryParams) => {
  const { withLoading } = useApiLoading();
  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== null && value !== undefined && value !== 'All')
  ) : {};

  return useQuery<{ data: ReportsDigitalRiskIntelligence[], pagination?: ApiResponse<any>['pagination'] }>({ 
    queryKey: REPORTS_DIGITAL_RISK_INTELLIGENCE_KEYS.lists(filteredParams),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<ReportsDigitalRiskIntelligence[]>>(BASE_URL, {
        params: filteredParams
      }));
      return { data: response.data.data, pagination: response.data.pagination };
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get record by ID
export const useGetReportsDigitalRiskIntelligenceById = (id: string) => {
  const { withLoading } = useApiLoading();
  return useQuery<ReportsDigitalRiskIntelligence>({ 
    queryKey: REPORTS_DIGITAL_RISK_INTELLIGENCE_KEYS.detail(id),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<ReportsDigitalRiskIntelligence>>(`${BASE_URL}/${id}`));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Create record
export const useCreateReportsDigitalRiskIntelligence = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ReportsDigitalRiskIntelligence, Error, CreateReportsDigitalRiskIntelligenceDto>({
    mutationFn: async (newData: CreateReportsDigitalRiskIntelligenceDto) => {
      const response = await withLoading(() => apiClient.post<ApiResponse<ReportsDigitalRiskIntelligence>>(BASE_URL, newData));
      return response.data.data;
    },
    onSuccess: () => {
      showToast('Digital Risk Intelligence record created successfully', 'success'); 
      queryClient.invalidateQueries({ queryKey: [REPORTS_DIGITAL_RISK_INTELLIGENCE_KEYS.lists()[0]] });
    },
    onError: (error: any) => {
      console.error('Failed to create record:', error);
      showToast(`Failed to create Digital Risk Intelligence record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Update record
export const useUpdateReportsDigitalRiskIntelligence = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ReportsDigitalRiskIntelligence, Error, UpdateReportsDigitalRiskIntelligenceDto & { id: string }>({
    mutationFn: async ({ id, ...updateData }: UpdateReportsDigitalRiskIntelligenceDto & { id: string }) => {
      const response = await withLoading(() => apiClient.patch<ApiResponse<ReportsDigitalRiskIntelligence>>(`${BASE_URL}/${id}`, updateData));
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('Digital Risk Intelligence record updated successfully', 'success'); 
      queryClient.invalidateQueries({ queryKey: REPORTS_DIGITAL_RISK_INTELLIGENCE_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: [REPORTS_DIGITAL_RISK_INTELLIGENCE_KEYS.lists()[0]] });
    },
    onError: (error: any) => {
      console.error('Failed to update record:', error);
      showToast(`Failed to update Digital Risk Intelligence record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Delete record
export const useDeleteReportsDigitalRiskIntelligence = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ApiResponse<null>, Error, string>({
    mutationFn: async (id: string) => {
      const response = await withLoading(() => apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`));
      return response.data;
    },
    onSuccess: (_, id) => {
      showToast('Digital Risk Intelligence record deleted successfully', 'success'); 
      queryClient.removeQueries({ queryKey: REPORTS_DIGITAL_RISK_INTELLIGENCE_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: [REPORTS_DIGITAL_RISK_INTELLIGENCE_KEYS.lists()[0]] });
    },
    onError: (error: any) => {
      console.error('Failed to delete record:', error);
      showToast(`Failed to delete Digital Risk Intelligence record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};
