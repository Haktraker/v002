import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/config';
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

import type {
    AnomalyCategoryDistribution,
    CreateAnomalyCategoryDistributionDto,
    UpdateAnomalyCategoryDistributionDto,
    AnomalyCategoryDistributionQueryParams,
    PaginatedResponse,
    ApiResponse
} from '@/lib/api/types';

// Base URL for the endpoint
const BASE_URL = '/uba/anomaly-category-distribution';

// --- React Query Keys ---
export const ANOMALY_CATEGORY_DISTRIBUTION_KEYS = {
    all: ['anomalyCategoryDistribution'] as const,
    lists: () => [...ANOMALY_CATEGORY_DISTRIBUTION_KEYS.all, 'list'] as const,
    list: (params: AnomalyCategoryDistributionQueryParams) => [...ANOMALY_CATEGORY_DISTRIBUTION_KEYS.lists(), params] as const,
    details: () => [...ANOMALY_CATEGORY_DISTRIBUTION_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...ANOMALY_CATEGORY_DISTRIBUTION_KEYS.details(), id] as const,
};

// --- API Functions ---

// Fetch multiple entries with pagination/filtering
const fetchAnomalyCategoryDistributions = async (
    params: AnomalyCategoryDistributionQueryParams = {}
): Promise<PaginatedResponse<AnomalyCategoryDistribution>> => {
    const response = await apiClient.get<PaginatedResponse<AnomalyCategoryDistribution>>(BASE_URL, { params });
    return response.data;
};

// Fetch a single entry by ID
const getAnomalyCategoryDistribution = async (id: string): Promise<AnomalyCategoryDistribution> => {
    const response = await apiClient.get<ApiResponse<AnomalyCategoryDistribution>>(`${BASE_URL}/${id}`);
    return response.data.data || response.data;
};

// Create a new entry
const createAnomalyCategoryDistribution = async (
    data: CreateAnomalyCategoryDistributionDto
): Promise<AnomalyCategoryDistribution> => {
    const response = await apiClient.post<ApiResponse<AnomalyCategoryDistribution>>(BASE_URL, data);
    if (!response.data.success) {
        throw new Error(response.data.message || 'Creation failed');
    }
    return response.data.data || response.data as any;
};

// Update an existing entry
const updateAnomalyCategoryDistribution = async ({
    id,
    data,
}: { id: string; data: UpdateAnomalyCategoryDistributionDto }): Promise<AnomalyCategoryDistribution> => {
    const response = await apiClient.patch<ApiResponse<AnomalyCategoryDistribution>>(`${BASE_URL}/${id}`, data);
    if (!response.data.success) {
        throw new Error(response.data.message || 'Update failed');
    }
    return response.data.data || response.data as any;
};

// Delete an entry
const deleteAnomalyCategoryDistribution = async (id: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`);
    if (!response.data.success) {
        throw new Error(response.data.message || 'Deletion failed');
    }
    return response.data;
};

// --- React Query Hooks ---

// Hook to fetch multiple entries
export const useGetAnomalyCategoryDistributions = (params: AnomalyCategoryDistributionQueryParams = {}) => {
    const { withLoading } = useApiLoading();
    return useQuery<PaginatedResponse<AnomalyCategoryDistribution>, Error>({
        queryKey: ANOMALY_CATEGORY_DISTRIBUTION_KEYS.list(params),
        queryFn: () => withLoading(() => fetchAnomalyCategoryDistributions(params)),
        placeholderData: (previousData) => previousData,
        staleTime: 5 * 60 * 1000
    });
};

// Hook to fetch a single entry
export const useGetAnomalyCategoryDistributionById = (id: string, enabled: boolean = true) => {
    const { withLoading } = useApiLoading();
    return useQuery<AnomalyCategoryDistribution, Error>({
        queryKey: ANOMALY_CATEGORY_DISTRIBUTION_KEYS.detail(id),
        queryFn: () => withLoading(() => getAnomalyCategoryDistribution(id)),
        enabled: !!id && enabled,
        staleTime: 5 * 60 * 1000
    });
};

// Hook to create an entry
export const useCreateAnomalyCategoryDistribution = () => {
    const queryClient = useQueryClient();
    const { withLoading } = useApiLoading();

    return useMutation<AnomalyCategoryDistribution, Error, CreateAnomalyCategoryDistributionDto>({
        mutationFn: (newData) => withLoading(() => createAnomalyCategoryDistribution(newData)),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ANOMALY_CATEGORY_DISTRIBUTION_KEYS.lists() });
            const message = data.name ? `Anomaly Category '${data.name}' created successfully` : 'Anomaly Category created successfully';
            showToast(message, 'success');
        },
        onError: (error: any) => {
            console.error('Create error:', error);
            const message = error.message || error.response?.data?.message || 'Failed to create Anomaly Category';
            showToast(message, 'error');
        },
    });
};

// Hook to update an entry
export const useUpdateAnomalyCategoryDistribution = () => {
    const queryClient = useQueryClient();
    const { withLoading } = useApiLoading();

    return useMutation<AnomalyCategoryDistribution, Error, { id: string; data: UpdateAnomalyCategoryDistributionDto }>({
        mutationFn: ({ id, data }) => withLoading(() => updateAnomalyCategoryDistribution({ id, data })),
        onSuccess: (data, { id }) => {
            queryClient.invalidateQueries({ queryKey: ANOMALY_CATEGORY_DISTRIBUTION_KEYS.lists() });
            queryClient.invalidateQueries({ queryKey: ANOMALY_CATEGORY_DISTRIBUTION_KEYS.detail(id) });
            const message = data.name ? `Anomaly Category '${data.name}' updated successfully` : 'Anomaly Category updated successfully';
            showToast(message, 'success');
        },
        onError: (error: any, { id }) => {
            console.error('Update error:', error);
            const message = error.message || error.response?.data?.message || `Failed to update Anomaly Category (ID: ${id})`;
            showToast(message, 'error');
        },
    });
};

// Hook to delete an entry
export const useDeleteAnomalyCategoryDistribution = () => {
    const queryClient = useQueryClient();
    const { withLoading } = useApiLoading();

    return useMutation<ApiResponse<null>, Error, string>({
        mutationFn: (id) => withLoading(() => deleteAnomalyCategoryDistribution(id)),
        onSuccess: (data, id) => {
            queryClient.invalidateQueries({ queryKey: ANOMALY_CATEGORY_DISTRIBUTION_KEYS.lists() });
            queryClient.removeQueries({ queryKey: ANOMALY_CATEGORY_DISTRIBUTION_KEYS.detail(id) });
            const message = data?.message || `Anomaly Category (ID: ${id}) deleted successfully`;
            showToast(message, 'success');
        },
        onError: (error: any, id) => {
            console.error('Delete error:', error);
            const message = error.message || error.response?.data?.message || `Failed to delete Anomaly Category (ID: ${id})`;
            showToast(message, 'error');
        },
    });
};
