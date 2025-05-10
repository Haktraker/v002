import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import {
    ApiResponse,
} from '@/lib/api/reports-types/types'; 
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// --- Enums and Constants ---
export const COMPLIANCE_TYPES = ["MITRE ATT&CK", "ISO 27001", "NIST CSF", "PDPL", "CIS"] as const;
export const PRIORITY_LEVELS = ["low", "medium", "high", "critical"] as const;
export const STATUS_TYPES = ["in progress", "open", "resolved"] as const;

export type ComplianceType = typeof COMPLIANCE_TYPES[number];
export type PriorityLevel = typeof PRIORITY_LEVELS[number];
export type StatusType = typeof STATUS_TYPES[number];

// --- Interface Definitions ---
export interface NonComplianceGapDetailItem {
  _id?: string; // If sub-documents have IDs and are managed individually
  quarter?: number;
  issueName?: string;
  relatedStandard?: string;
  priorityLevel?: PriorityLevel;
  recommendation?: string;
  status?: StatusType;
  responsiblePerson?: string;
  user?: string;
  bu?: string;
}

export interface ReportNonComplianceGapsOverview {
  _id: string;
  year: string;
  month: string;
  compliance: ComplianceType;
  score: string;
  details: NonComplianceGapDetailItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateReportNonComplianceGapsOverviewDto {
  year: string;
  month: string;
  compliance: ComplianceType;
  score: string;
  details?: Omit<NonComplianceGapDetailItem, '_id'>[]; // Optional on creation, can be added via update
}

export interface UpdateReportNonComplianceGapsOverviewDto {
  year?: string;
  month?: string;
  compliance?: ComplianceType;
  score?: string;
  details?: NonComplianceGapDetailItem[]; // Allow full replacement or specific item updates
}

export interface ReportNonComplianceGapsOverviewQueryParams {
  year?: string;
  month?: string;
  compliance?: ComplianceType;
  priorityLevel?: PriorityLevel;
  status?: StatusType;
  page?: number;
  limit?: number;
}

// API Keys
export const REPORT_NCGO_KEYS = {
  all: ['reportNonComplianceGapsOverview'] as const,
  lists: (params?: ReportNonComplianceGapsOverviewQueryParams) => [...REPORT_NCGO_KEYS.all, 'list', params] as const,
  details: () => [...REPORT_NCGO_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...REPORT_NCGO_KEYS.details(), id] as const,
};

// Base URL
const BASE_URL = '/reports/non-compliance-gaps-overview';

// Get all records
export const useGetReportNonComplianceGapsOverviews = (params?: ReportNonComplianceGapsOverviewQueryParams) => {
  const { withLoading } = useApiLoading();
  const filteredParams = params ? Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== null && value !== undefined && value !== 'All' && value !== '')
  ) : {};

  return useQuery<{ data: ReportNonComplianceGapsOverview[], pagination?: ApiResponse<any>['pagination'] }>({
    queryKey: REPORT_NCGO_KEYS.lists(filteredParams),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<ReportNonComplianceGapsOverview[]>>(BASE_URL, {
        params: filteredParams
      }));
      return { data: response.data.data, pagination: response.data.pagination };
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get record by ID
export const useGetReportNonComplianceGapsOverviewById = (id: string) => {
  const { withLoading } = useApiLoading();
  return useQuery<ReportNonComplianceGapsOverview>({
    queryKey: REPORT_NCGO_KEYS.detail(id),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<ReportNonComplianceGapsOverview>>(`${BASE_URL}/${id}`));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Create record
export const useCreateReportNonComplianceGapsOverview = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ReportNonComplianceGapsOverview, Error, CreateReportNonComplianceGapsOverviewDto>({
    mutationFn: async (newData: CreateReportNonComplianceGapsOverviewDto) => {
      const response = await withLoading(() => apiClient.post<ApiResponse<ReportNonComplianceGapsOverview>>(BASE_URL, newData));
      return response.data.data;
    },
    onSuccess: () => {
      showToast('Non-Compliance Gap record created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: REPORT_NCGO_KEYS.all });
    },
    onError: (error: any) => {
      console.error('Failed to create record:', error);
      showToast(`Failed to create record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Update record
export const useUpdateReportNonComplianceGapsOverview = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ReportNonComplianceGapsOverview, Error, { id: string; updatedData: UpdateReportNonComplianceGapsOverviewDto }>({
    mutationFn: async ({ id, updatedData }: { id: string; updatedData: UpdateReportNonComplianceGapsOverviewDto }) => {
      const response = await withLoading(() => apiClient.patch<ApiResponse<ReportNonComplianceGapsOverview>>(`${BASE_URL}/${id}`, updatedData));
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('Non-Compliance Gap record updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: REPORT_NCGO_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: REPORT_NCGO_KEYS.all });
    },
    onError: (error: any) => {
      console.error('Failed to update record:', error);
      showToast(`Failed to update record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};

// Delete record
export const useDeleteReportNonComplianceGapsOverview = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();
  return useMutation<ApiResponse<null>, Error, string>({
    mutationFn: async (id: string) => {
      const response = await withLoading(() => apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`));
      return response.data;
    },
    onSuccess: (_, id) => {
      showToast('Non-Compliance Gap record deleted successfully', 'success');
      queryClient.removeQueries({ queryKey: REPORT_NCGO_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: REPORT_NCGO_KEYS.all });
    },
    onError: (error: any) => {
      console.error('Failed to delete record:', error);
      showToast(`Failed to delete record: ${error.response?.data?.message || error.message || 'Unknown error'}`, 'error');
    },
  });
};
