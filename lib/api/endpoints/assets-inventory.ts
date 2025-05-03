import { ApiResponse, IAssetInventory, IThreatDetection, AssetInventoryPayload } from "@/lib/api/types";

const BASE_URL = "/assets-inventory";

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

// Get paginated list of assets with optional filters
export const getAssets = async (params: AssetInventoryQueryParams = {}): Promise<ApiResponse<IAssetInventory[]>> => {
  const queryParams = new URLSearchParams();
  
  // Add each parameter to the query string
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

// Get a single asset by ID
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

// Create a new asset
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

// Update an existing asset
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

// Delete an asset by ID
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

// Get threat detections for a specific device (machine or server)
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