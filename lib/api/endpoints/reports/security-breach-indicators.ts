import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import {
    ApiResponse,
} from '@/lib/api/reports-types/types'; // Assuming common ApiResponse
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// --- Enums and Constants ---
export const SECURITY_BREACH_INDICATOR_NAMES = [
  "Compromised Employees",
  "Account Take Over",
  "3rd Party Leaked Credentials",
  "Brand Reputation",
] as const;

export type SecurityBreachIndicatorName = typeof SECURITY_BREACH_INDICATOR_NAMES[number];

// --- Interface Definitions ---
export interface SecurityBreachIndicatorItem {
  _id?: string; // Included for updates if sub-documents have IDs
  indicatorName: SecurityBreachIndicatorName;
  score: string; // Schema defines score as String
}

export interface ReportsSecurityBreachIndicators {
  _id: string;
  month: string;
  year: string;
  indicators: SecurityBreachIndicatorItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateReportsSecurityBreachIndicatorsDto {
  month: string;
  year: string;
  indicators: Omit<SecurityBreachIndicatorItem, '_id'>[];
}

export interface UpdateReportsSecurityBreachIndicatorsDto {
  month?: string;
  year?: string;
  indicators?: SecurityBreachIndicatorItem[]; // For updates, allowing full replacement or specific item updates if backend supports
}

export interface ReportsSecurityBreachIndicatorsQueryParams {
  month?: string;
  year?: string;
  indicatorName?: SecurityBreachIndicatorName;
  page?: number;
  limit?: number;
  // Add other query parameters as needed
}

// API Keys
export const REPORTS_SECURITY_BREACH_INDICATORS_KEYS = {
  all: ['reportsSecurityBreachIndicators'] as const,
  lists: (params?: ReportsSecurityBreachIndicatorsQueryParams) => [...REPORTS_SECURITY_BREACH_INDICATORS_KEYS.all, 'list', params] as const,
  details: () => [...REPORTS_SECURITY_BREACH_INDICATORS_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...REPORTS_SECURITY_BREACH_INDICATORS_KEYS.details(), id] as const,
};

// Base URL (Assuming this path, adjust if necessary)
const BASE_URL = '/reports/security-breach-indicators';

// Get all records
export const useGetReportsSecurityBreachIndicators = (params?: ReportsSecurityBreachIndicatorsQueryParams) => {
  const { withLoading } = useApiLoading();
  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== null && value !== undefined && value !== 'All' && value !== '')
  ) : {};

  return useQuery<{ data: ReportsSecurityBreachIndicators[], pagination?: ApiResponse<any>['pagination'] }>({
    queryKey: REPORTS_SECURITY_BREACH_INDICATORS_KEYS.lists(filteredParams),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<ReportsSecurityBreachIndicators[]>>(BASE_URL, {
        params: filteredParams
      }));
      return { data: response.data.data, pagination: response.data.pagination };
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get record by ID
export const useGetReportsSecurityBreachIndicatorById = (id: string) => {
  const { withLoading } = useApiLoading();
  return useQuery<ReportsSecurityBreachIndicators>({
    queryKey: REPORTS_SECURITY_BREACH_INDICATORS_KEYS.detail(id),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<ReportsSecurityBreachIndicators>>(`${BASE_URL}/${id}`));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Create record
export const useCreateReportsSecurityBreachIndicator = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ReportsSecurityBreachIndicators, Error, CreateReportsSecurityBreachIndicatorsDto>({
    mutationFn: async (newData: CreateReportsSecurityBreachIndicatorsDto) => {
      const response = await withLoading(() => apiClient.post<ApiResponse<ReportsSecurityBreachIndicators>>(BASE_URL, newData));
      return response.data.data;
    },
    onSuccess: () => {
      showToast('Security Breach Indicator record created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: REPORTS_SECURITY_BREACH_INDICATORS_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to create record:', error);
      showToast(`Failed to create record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Update record
export const useUpdateReportsSecurityBreachIndicator = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ReportsSecurityBreachIndicators, Error, { id: string; updatedData: UpdateReportsSecurityBreachIndicatorsDto }>({
    mutationFn: async ({ id, updatedData }: { id: string; updatedData: UpdateReportsSecurityBreachIndicatorsDto }) => {
      const response = await withLoading(() => apiClient.patch<ApiResponse<ReportsSecurityBreachIndicators>>(`${BASE_URL}/${id}`, updatedData));
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('Security Breach Indicator record updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: REPORTS_SECURITY_BREACH_INDICATORS_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: REPORTS_SECURITY_BREACH_INDICATORS_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to update record:', error);
      showToast(`Failed to update record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Delete record
export const useDeleteReportsSecurityBreachIndicator = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ApiResponse<null>, Error, string>({
    mutationFn: async (id: string) => {
      const response = await withLoading(() => apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`));
      return response.data;
    },
    onSuccess: (_, id) => {
      showToast('Security Breach Indicator record deleted successfully', 'success');
      queryClient.removeQueries({ queryKey: REPORTS_SECURITY_BREACH_INDICATORS_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: REPORTS_SECURITY_BREACH_INDICATORS_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to delete record:', error);
      showToast(`Failed to delete record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};
