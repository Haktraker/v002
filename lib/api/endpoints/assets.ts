import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../config';
import { 
  ApiResponse, 
  AssetQueryParams,
  CreateIPSDto, 
  CreateDomainDto,
  CreatePortalDto,
  Domain,
  DomainQueryParams,
  IPS, 
  IPSQueryParams, 
  PaginatedResponse, 
  Portal,
  PortalQueryParams,
  UpdateIPSDto,
  UpdateDomainDto,
  UpdatePortalDto
} from '../types';
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// API Keys for Assets
const ASSETS_KEYS = {
  all: ['assets'] as const,
  lists: () => [...ASSETS_KEYS.all, 'list'] as const,
  list: (filters: AssetQueryParams) => [...ASSETS_KEYS.lists(), filters] as const,
  details: () => [...ASSETS_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...ASSETS_KEYS.details(), id] as const,
  
  // IPS specific keys
  ips: ['assets', 'ips'] as const,
  ipsLists: () => [...ASSETS_KEYS.ips, 'list'] as const,
  ipsList: (filters: IPSQueryParams) => [...ASSETS_KEYS.ipsLists(), filters] as const,
  ipsDetails: () => [...ASSETS_KEYS.ips, 'detail'] as const,
  ipsDetail: (id: string) => [...ASSETS_KEYS.ipsDetails(), id] as const,
  
  // Domain specific keys
  domains: ['assets', 'domains'] as const,
  domainsLists: () => [...ASSETS_KEYS.domains, 'list'] as const,
  domainsList: (filters: DomainQueryParams) => [...ASSETS_KEYS.domainsLists(), filters] as const,
  domainsDetails: () => [...ASSETS_KEYS.domains, 'detail'] as const,
  domainsDetail: (id: string) => [...ASSETS_KEYS.domainsDetails(), id] as const,
  
  // Portal specific keys
  portals: ['assets', 'portals'] as const,
  portalsLists: () => [...ASSETS_KEYS.portals, 'list'] as const,
  portalsList: (filters: PortalQueryParams) => [...ASSETS_KEYS.portalsLists(), filters] as const,
  portalsDetails: () => [...ASSETS_KEYS.portals, 'detail'] as const,
  portalsDetail: (id: string) => [...ASSETS_KEYS.portalsDetails(), id] as const,
};

// GET - Fetch all assets (combined)
export const useAllAssets = (params: AssetQueryParams = {}) => {
  return useQuery({
    queryKey: ASSETS_KEYS.list(params),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<{
        ips: PaginatedResponse<IPS>,
        domains: PaginatedResponse<Domain>,
        portals: PaginatedResponse<Portal>
      }>>('/assets', { params });
      return data.data;
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
};

// ==================== IPS ENDPOINTS ====================

// GET - Fetch all IPS assets with pagination
export const useIPSAssets = (params?: IPSQueryParams) => {
  const { withLoading } = useApiLoading();
  
  return useQuery({
    queryKey: ASSETS_KEYS.ipsList(params || {}),
    queryFn: async () => {
      const { data } = await withLoading(async () => 
        apiClient.get<ApiResponse<PaginatedResponse<IPS>>>('/assets/ips', { params })
      );
      return data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// GET - Fetch a single IPS asset by ID
export const useIPSAsset = (id: string) => {
  const { withLoading } = useApiLoading();
  
  return useQuery({
    queryKey: ASSETS_KEYS.ipsDetail(id),
    queryFn: async () => {
      const { data } = await withLoading(async () =>
        apiClient.get<ApiResponse<IPS>>(`/assets/ips/${id}`)
      );
      return data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// POST - Create new IPS asset
export const useCreateIPSAsset = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (newIPS: CreateIPSDto) => {
      const { data } = await withLoading(async () =>
        apiClient.post<ApiResponse<IPS>>('/assets/ips', newIPS)
      );
      return data.data;
    },
    onSuccess: (data) => {
      showToast('IP asset created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.ipsLists() });
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to create IP asset:', error);
      showToast('Failed to create IP asset', 'error');
    },
  });
};

// PATCH - Update IPS asset
export const useUpdateIPSAsset = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateIPSDto & { id: string }) => {
      const { data } = await withLoading(async () =>
        apiClient.patch<ApiResponse<IPS>>(`/assets/ips/${id}`, updateData)
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      showToast('IP asset updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.ipsDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.ipsLists() });
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to update IP asset:', error);
      showToast('Failed to update IP asset', 'error');
    },
  });
};

// DELETE - Delete IPS asset
export const useDeleteIPSAsset = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await withLoading(async () =>
        apiClient.delete<ApiResponse<void>>(`/assets/ips/${id}`)
      );
      return data;
    },
    onSuccess: (_, id) => {
      showToast('IP asset deleted successfully', 'success');
      queryClient.removeQueries({ queryKey: ASSETS_KEYS.ipsDetail(id) });
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.ipsLists() });
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to delete IP asset:', error);
      showToast('Failed to delete IP asset', 'error');
    },
  });
};

// ==================== DOMAIN ENDPOINTS ====================

// GET - Fetch all domain assets with pagination
export const useDomainAssets = (params?: DomainQueryParams) => {
  const { withLoading } = useApiLoading();
  
  return useQuery({
    queryKey: ASSETS_KEYS.domainsList(params || {}),
    queryFn: async () => {
      const { data } = await withLoading(async () =>
        apiClient.get<ApiResponse<PaginatedResponse<Domain>>>('/assets/domains', { params })
      );
      return data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// GET - Fetch a single domain asset by ID
export const useDomainAsset = (id: string) => {
  const { withLoading } = useApiLoading();
  
  return useQuery({
    queryKey: ASSETS_KEYS.domainsDetail(id),
    queryFn: async () => {
      const { data } = await withLoading(async () =>
        apiClient.get<ApiResponse<Domain>>(`/assets/domains/${id}`)
      );
      return data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// POST - Create new domain asset
export const useCreateDomainAsset = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (newDomain: CreateDomainDto) => {
      const { data } = await withLoading(async () =>
        apiClient.post<ApiResponse<Domain>>('/assets/domains', newDomain)
      );
      return data.data;
    },
    onSuccess: () => {
      showToast('Domain asset created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.domainsLists() });
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to create domain asset:', error);
      showToast('Failed to create domain asset', 'error');
    },
  });
};

// PATCH - Update domain asset
export const useUpdateDomainAsset = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateDomainDto & { id: string }) => {
      const { data } = await withLoading(async () =>
        apiClient.patch<ApiResponse<Domain>>(`/assets/domains/${id}`, updateData)
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      showToast('Domain asset updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.domainsDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.domainsLists() });
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to update domain asset:', error);
      showToast('Failed to update domain asset', 'error');
    },
  });
};

// DELETE - Delete domain asset
export const useDeleteDomainAsset = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await withLoading(async () =>
        apiClient.delete<ApiResponse<void>>(`/assets/domains/${id}`)
      );
      return data;
    },
    onSuccess: (_, id) => {
      showToast('Domain asset deleted successfully', 'success');
      queryClient.removeQueries({ queryKey: ASSETS_KEYS.domainsDetail(id) });
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.domainsLists() });
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to delete domain asset:', error);
      showToast('Failed to delete domain asset', 'error');
    },
  });
};

// ==================== PORTAL ENDPOINTS ====================

// GET - Fetch all portal assets with pagination
export const usePortalAssets = (params?: PortalQueryParams) => {
  const { withLoading } = useApiLoading();
  
  return useQuery({
    queryKey: ASSETS_KEYS.portalsList(params || {}),
    queryFn: async () => {
      const { data } = await withLoading(async () =>
        apiClient.get<ApiResponse<PaginatedResponse<Portal>>>('/assets/portals', { params })
      );
      return data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// GET - Fetch a single portal asset by ID
export const usePortalAsset = (id: string) => {
  const { withLoading } = useApiLoading();
  
  return useQuery({
    queryKey: ASSETS_KEYS.portalsDetail(id),
    queryFn: async () => {
      const { data } = await withLoading(async () =>
        apiClient.get<ApiResponse<Portal>>(`/assets/portals/${id}`)
      );
      return data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// POST - Create new portal asset
export const useCreatePortalAsset = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (newPortal: CreatePortalDto) => {
      const { data } = await withLoading(async () =>
        apiClient.post<ApiResponse<Portal>>('/assets/portals', newPortal)
      );
      return data.data;
    },
    onSuccess: (data) => {
      showToast('Portal asset created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.portalsLists() });
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to create portal asset:', error);
      showToast('Failed to create portal asset', 'error');
    },
  });
};

// PATCH - Update portal asset
export const useUpdatePortalAsset = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdatePortalDto & { id: string }) => {
      const { data } = await withLoading(async () =>
        apiClient.patch<ApiResponse<Portal>>(`/assets/portals/${id}`, updateData)
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      showToast('Portal asset updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.portalsDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.portalsLists() });
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to update portal asset:', error);
      showToast('Failed to update portal asset', 'error');
    },
  });
};

// DELETE - Delete portal asset
export const useDeletePortalAsset = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await withLoading(async () =>
        apiClient.delete<ApiResponse<void>>(`/assets/portals/${id}`)
      );
      return data;
    },
    onSuccess: (_, id) => {
      showToast('Portal asset deleted successfully', 'success');
      queryClient.removeQueries({ queryKey: ASSETS_KEYS.portalsDetail(id) });
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.portalsLists() });
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to delete portal asset:', error);
      showToast('Failed to delete portal asset', 'error');
    },
  });
};

// Backward compatibility exports for existing code
export const useAssets = useIPSAssets;
export const useCreateAsset = useCreateIPSAsset;
export const useUpdateAsset = useUpdateIPSAsset;
export const useDeleteAsset = useDeleteIPSAsset;

// Compatibility with ips.ts exports
export const useIPSEvents = useIPSAssets;
export const useIPSEvent = useIPSAsset;
export const useCreateIPS = useCreateIPSAsset;
export const useUpdateIPS = useUpdateIPSAsset;
export const useDeleteIPS = useDeleteIPSAsset;