// Common response type
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// IPS Types
export interface IPS {
  id: string;
  eventType: string;
  sourceIP: string;
  destinationIP: string;
  protocol: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  status: 'new' | 'investigating' | 'resolved';
  description?: string;
  length: number;
}

export interface CreateIPSDto {
  eventType: string;
  sourceIP: string;
  destinationIP: string;
  protocol: string;
  severity: 'low' | 'medium' | 'high';
  description?: string;
}

export interface UpdateIPSDto extends Partial<CreateIPSDto> {
  status?: 'new' | 'investigating' | 'resolved';
}

// Query params types
export interface IPSQueryParams {
  status?: string;
  severity?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// Pagination response
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  length: number;

}
