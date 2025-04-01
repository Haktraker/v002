// Common response type
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Base Asset Type
export interface BaseAsset {
  _id: string;
  value: string;
  location: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

// IPS Types
export interface IPS extends BaseAsset {
  // Additional IPS-specific fields can be added here
  ips:any[]
}

export interface CreateIPSDto {
  value: string;
  location: string;
  description?: string;
}

export interface UpdateIPSDto {
  value?: string;
  location?: string;
  description?: string;
}

// Domain Types
export interface Domain extends BaseAsset {
  // Additional domain-specific fields can be added here
}

export interface CreateDomainDto {
  value: string;
  location: string;
  description?: string;
}

export interface UpdateDomainDto {
  value?: string;
  location?: string;
  description?: string;
}

// Portal Types
export interface Portal extends BaseAsset {
  // Additional portal-specific fields can be added here
}

export interface CreatePortalDto {
  value: string;
  location: string;
  description?: string;
}

export interface UpdatePortalDto {
  value?: string;
  location?: string;
  description?: string;
}

// Query params types
export interface IPSQueryParams {
  status?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface DomainQueryParams {
  status?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PortalQueryParams {
  status?: string;
  location?: string;
  page?: number;
  limit?: number;
}

// Generic Asset Query Params
export interface AssetQueryParams {
  type?: 'ips' | 'domains' | 'portals';
  location?: string;
  page?: number;
  limit?: number;
}

// Pagination response
export interface PaginatedResponse<T> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  length: number;
}
