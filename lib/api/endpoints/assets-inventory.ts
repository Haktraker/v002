import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiResponse, IAssetInventory, IThreatDetection, AssetInventoryPayload } from "@/lib/api/types";
import { apiClient } from '../config';
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

const BASE_URL = "/assets-inventory";

// API Keys for Assets Inventory
export const ASSETS_INVENTORY_KEYS = {
  assetsList: () => ['assets-inventory'] as const,
  assetDetail: (id: string) => ['assets-inventory', id] as const,
  assetDetections: (deviceName: string) => ['assets-inventory', 'detections', deviceName] as const,
};

// Interface for query parameters
export interface AssetInventoryQueryParams {
  page?: number;
  limit?: number;
  BU?: string;
  Function?: string;
  Location?: string;
  Server?: boolean;
  Ecommerce?: boolean;
  [key: string]: any; // Allow any other filter parameters
}

// Use React Query to get paginated list of assets with optional filters
export const useGetAssets = (params: AssetInventoryQueryParams = {}) => {
  const { withLoading } = useApiLoading();
  
  return useQuery({
    queryKey: [...ASSETS_INVENTORY_KEYS.assetsList(), params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      
      // Add each parameter to the query string
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
      
      const response = await withLoading(() => 
        apiClient.get<ApiResponse<IAssetInventory[]>>(`${BASE_URL}?${queryParams.toString()}`)
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Use React Query to get a single asset by ID
export const useGetAssetById = (id: string) => {
  const { withLoading } = useApiLoading();
  
  return useQuery({
    queryKey: ASSETS_INVENTORY_KEYS.assetDetail(id),
    queryFn: async () => {
      const response = await withLoading(() => 
        apiClient.get<ApiResponse<IAssetInventory>>(`${BASE_URL}/${id}`)
      );
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Use React Query for creating a new asset
export const useCreateAsset = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (assetData: AssetInventoryPayload) => {
      const response = await withLoading(() => 
        apiClient.post<ApiResponse<IAssetInventory>>(`${BASE_URL}`, assetData)
      );
      return response.data.data;
    },
    onSuccess: (data) => {
      showToast('Asset created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ASSETS_INVENTORY_KEYS.assetsList() });
    },
    onError: (error: any) => {
      console.error('Failed to create asset:', error);
      showToast(error?.response?.data?.message || 'Failed to create asset', 'error');
    },
  });
};

// Use React Query for updating an existing asset
export const useUpdateAsset = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async ({ id, ...assetData }: Partial<AssetInventoryPayload> & { id: string }) => {
      const response = await withLoading(() => 
        apiClient.put<ApiResponse<IAssetInventory>>(`${BASE_URL}/${id}`, assetData)
      );
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('Asset updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ASSETS_INVENTORY_KEYS.assetDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ASSETS_INVENTORY_KEYS.assetsList() });
    },
    onError: (error: any) => {
      console.error('Failed to update asset:', error);
      showToast(error?.response?.data?.message || 'Failed to update asset', 'error');
    },
  });
};

// Use React Query for deleting an asset
export const useDeleteAsset = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await withLoading(() => 
        apiClient.delete<ApiResponse<IAssetInventory>>(`${BASE_URL}/${id}`)
      );
      return response.data.data;
    },
    onSuccess: (_, id) => {
      showToast('Asset deleted successfully', 'success');
      queryClient.removeQueries({ queryKey: ASSETS_INVENTORY_KEYS.assetDetail(id) });
      queryClient.invalidateQueries({ queryKey: ASSETS_INVENTORY_KEYS.assetsList() });
    },
    onError: (error: any) => {
      console.error('Failed to delete asset:', error);
      showToast(error?.response?.data?.message || 'Failed to delete asset', 'error');
    },
  });
};

// Use React Query for getting threat detections for a specific device
export const useGetDetectionsByDeviceName = (deviceName: string, page?: number, limit?: number) => {
  const { withLoading } = useApiLoading();
  
  const params = new URLSearchParams();
  if (page !== undefined) params.append('page', page.toString());
  if (limit !== undefined) params.append('limit', limit.toString());
  
  return useQuery({
    queryKey: [...ASSETS_INVENTORY_KEYS.assetDetections(deviceName), { page, limit }],
    queryFn: async () => {
      const response = await withLoading(() => 
        apiClient.get<ApiResponse<IThreatDetection[]>>(
          `${BASE_URL}/detections/${encodeURIComponent(deviceName)}?${params.toString()}`
        )
      );
      return response.data;
    },
    enabled: !!deviceName,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Keep the old functions for backward compatibility (but mark as deprecated)
/**
 * @deprecated Use useGetAssets instead
 */
export const getAssets = async (params: AssetInventoryQueryParams = {}): Promise<ApiResponse<IAssetInventory[]>> => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value.toString());
    }
  });

  const url = `${process.env.NEXT_PUBLIC_BASE_URL}${BASE_URL}?${queryParams.toString()}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message || `Failed to fetch assets: ${response.status} ${response.statusText}`
    );
  }
  
  return response.json();
};

/**
 * @deprecated Use useGetAssetById instead
 */
export const getAssetById = async (id: string): Promise<ApiResponse<IAssetInventory>> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}${BASE_URL}/${id}`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message || `Failed to fetch asset: ${response.status} ${response.statusText}`
    );
  }
  
  return response.json();
};

/**
 * @deprecated Use useCreateAsset instead
 */
export const createAsset = async (assetData: AssetInventoryPayload): Promise<ApiResponse<IAssetInventory>> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}${BASE_URL}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(assetData),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message || `Failed to create asset: ${response.status} ${response.statusText}`
    );
  }
  
  return response.json();
};

/**
 * @deprecated Use useUpdateAsset instead
 */
export const updateAsset = async (id: string, assetData: Partial<AssetInventoryPayload>): Promise<ApiResponse<IAssetInventory>> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(assetData),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message || `Failed to update asset: ${response.status} ${response.statusText}`
    );
  }
  
  return response.json();
};

/**
 * @deprecated Use useDeleteAsset instead
 */
export const deleteAsset = async (id: string): Promise<ApiResponse<IAssetInventory>> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}${BASE_URL}/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message || `Failed to delete asset: ${response.status} ${response.statusText}`
    );
  }
  
  return response.json();
};

/**
 * @deprecated Use useGetDetectionsByDeviceName instead
 */
export const getDetectionsByDeviceName = async (
  deviceName: string,
  page?: number,
  limit?: number
): Promise<ApiResponse<IThreatDetection[]>> => {
  const queryParams = new URLSearchParams();
  
  if (page !== undefined) queryParams.append('page', page.toString());
  if (limit !== undefined) queryParams.append('limit', limit.toString());
  
  const url = `${process.env.NEXT_PUBLIC_BASE_URL}${BASE_URL}/detections/${encodeURIComponent(deviceName)}?${queryParams.toString()}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message || `Failed to fetch detections: ${response.status} ${response.statusText}`
    );
  }
  
  return response.json();
};