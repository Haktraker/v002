import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import { 
    ApiResponse, 
    AlertTrendAnalysis, 
    AlertTrendAnalysisQueryParams, 
    CreateAlertTrendAnalysisDto, 
    UpdateAlertTrendAnalysisDto, 
    PaginatedResponse
} from '@/lib/api/types';
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// API Keys
export const ALERT_TREND_ANALYSIS_KEYS = {
  lists: (params?: AlertTrendAnalysisQueryParams) => ['alertTrendAnalysis', params] as const,
  detail: (id: string) => ['alertTrendAnalysis', id] as const,
};

// Base URL
const BASE_URL = '/uba/alert-trend-analysis';

// Get all records - not using query params for filtering since it's not working on backend
export const useGetAlertTrendAnalyses = (params?: AlertTrendAnalysisQueryParams) => {
  const { withLoading } = useApiLoading();
  
  return useQuery<{ data: AlertTrendAnalysis[] } | undefined>({ 
    queryKey: ALERT_TREND_ANALYSIS_KEYS.lists({}), // Use empty params to always get all data
    queryFn: async () => {
      const response = await withLoading(() => 
        apiClient.get<{ data: AlertTrendAnalysis[] }>(BASE_URL)
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get record by ID
export const useGetAlertTrendAnalysisById = (id: string) => {
  const { withLoading } = useApiLoading();
  return useQuery<AlertTrendAnalysis>({ 
    queryKey: ALERT_TREND_ANALYSIS_KEYS.detail(id),
    queryFn: async () => {
      const response = await withLoading(() => 
        apiClient.get<ApiResponse<AlertTrendAnalysis>>(`${BASE_URL}/${id}`)
      );
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Create record
export const useCreateAlertTrendAnalysis = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<AlertTrendAnalysis, Error, CreateAlertTrendAnalysisDto>({ 
    mutationFn: async (newData: CreateAlertTrendAnalysisDto) => {
      // Sending the whole newData object which includes the 'risk' property
      const response = await withLoading(() => 
        apiClient.post<ApiResponse<AlertTrendAnalysis>>(BASE_URL, newData)
      );
      return response.data.data;
    },
    onSuccess: () => {
      showToast('Alert Trend Analysis record created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ALERT_TREND_ANALYSIS_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to create Alert Trend Analysis record:', error);
      showToast(`Failed to create record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Update record
export const useUpdateAlertTrendAnalysis = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<AlertTrendAnalysis, Error, UpdateAlertTrendAnalysisDto & { id: string }>({ 
    mutationFn: async ({ id, ...updateData }: UpdateAlertTrendAnalysisDto & { id: string }) => {
      const response = await withLoading(() => 
        apiClient.patch<ApiResponse<AlertTrendAnalysis>>(`${BASE_URL}/${id}`, updateData)
      );
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('Alert Trend Analysis record updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ALERT_TREND_ANALYSIS_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ALERT_TREND_ANALYSIS_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to update Alert Trend Analysis record:', error);
      showToast(`Failed to update record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Delete record
export const useDeleteAlertTrendAnalysis = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ApiResponse<null>, Error, string>({ 
    mutationFn: async (id: string) => {
      const response = await withLoading(() => 
        apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`)
      );
      return response.data;
    },
    onSuccess: (_, id) => {
      showToast('Alert Trend Analysis record deleted successfully', 'success');
      queryClient.removeQueries({ queryKey: ALERT_TREND_ANALYSIS_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: ALERT_TREND_ANALYSIS_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to delete Alert Trend Analysis record:', error);
      showToast(`Failed to delete record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};
