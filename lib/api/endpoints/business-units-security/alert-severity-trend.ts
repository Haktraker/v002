import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import { ApiResponse, AlertSeverityTrend, AlertSeverityTrendQueryParams, CreateAlertSeverityTrendDto, UpdateAlertSeverityTrendDto } from '@/lib/api/types';
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// API Keys for Alert Severity Trend
export const ALERT_SEVERITY_TREND_KEYS = {
  lists: (params?: AlertSeverityTrendQueryParams) => ['alertSeverityTrends', params] as const,
  detail: (id: string) => ['alertSeverityTrends', id] as const,
};

// Base URL - Adjust if different
const BASE_URL = '/bu-security/alert-severity-trends';

// Get all Alert Severity Trends
export const useGetAlertSeverityTrends = (params?: AlertSeverityTrendQueryParams) => {
  const { withLoading } = useApiLoading();

  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== null && value !== undefined)
  ) : {};

  return useQuery<AlertSeverityTrend[]>({ 
    queryKey: ALERT_SEVERITY_TREND_KEYS.lists(filteredParams),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<AlertSeverityTrend[]>>(BASE_URL, {
        params: filteredParams
      }));
      return response.data.data || response.data; 
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get Alert Severity Trend by ID
export const useGetAlertSeverityTrendById = (id: string) => {
  const { withLoading } = useApiLoading();

  return useQuery({
    queryKey: ALERT_SEVERITY_TREND_KEYS.detail(id),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<AlertSeverityTrend>>(`${BASE_URL}/${id}`));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Create Alert Severity Trend
export const useCreateAlertSeverityTrend = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (newTrend: CreateAlertSeverityTrendDto) => {
      const response = await withLoading(() => apiClient.post<ApiResponse<AlertSeverityTrend>>(BASE_URL, newTrend));
      return response.data.data;
    },
    onSuccess: () => {
      showToast('Alert Severity Trend created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ALERT_SEVERITY_TREND_KEYS.lists({}) });
    },
    onError: (error: any) => {
      console.error('Failed to create Alert Severity Trend:', error);
      showToast('Failed to create Alert Severity Trend', 'error');
    },
  });
};

// Update Alert Severity Trend
export const useUpdateAlertSeverityTrend = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateAlertSeverityTrendDto & { id: string }) => {
      const response = await withLoading(() => apiClient.patch<ApiResponse<AlertSeverityTrend>>(`${BASE_URL}/${id}`, updateData));
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('Alert Severity Trend updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ALERT_SEVERITY_TREND_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ALERT_SEVERITY_TREND_KEYS.lists({}) });
    },
    onError: (error: any) => {
      console.error('Failed to update Alert Severity Trend:', error);
      showToast('Failed to update Alert Severity Trend', 'error');
    },
  });
};

// Delete Alert Severity Trend
export const useDeleteAlertSeverityTrend = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await withLoading(() => apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`));
      return response.data; 
    },
    onSuccess: (_, id) => {
      showToast('Alert Severity Trend deleted successfully', 'success');
      queryClient.removeQueries({ queryKey: ALERT_SEVERITY_TREND_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: ALERT_SEVERITY_TREND_KEYS.lists({}) });
    },
    onError: (error: any) => {
      console.error('Failed to delete Alert Severity Trend:', error);
      showToast('Failed to delete Alert Severity Trend', 'error');
    },
  });
};
