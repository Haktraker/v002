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
      console.log('Fetched all assets:', data);
      return data.data;
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
};

// ==================== IPS ENDPOINTS ====================

// GET - Fetch all IPS assets
export const useIPSAssets = (params: IPSQueryParams = {}) => {
  return useQuery({
    queryKey: ASSETS_KEYS.ipsList(params),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<any>>('/assets/ips', { params });
      console.log('Fetched IPS assets:', data);
      // Extract the items array from the response if it exists, otherwise return the data as is
      return data.data.items || data.data;
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
};

// GET - Fetch single IPS asset
export const useIPSAsset = (id: string) => {
  return useQuery({
    queryKey: ASSETS_KEYS.ipsDetail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<IPS>>(`/assets/ips/${id}`);
      console.log('Fetched IPS asset:', data);
      return data.data;
    },
    enabled: !!id,
  });
};

// POST - Create new IPS asset
export const useCreateIPSAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newIPS: CreateIPSDto) => {
      const { data } = await apiClient.post<ApiResponse<IPS>>('/assets/ips', newIPS);
      console.log('Created IPS asset:', data);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.ipsLists() });
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.lists() });
    },
  });
};

// PATCH - Update IPS asset
export const useUpdateIPSAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateIPSDto & { id: string }) => {
      const { data } = await apiClient.patch<ApiResponse<IPS>>(`/assets/ips/${id}`, updateData);
      console.log('Updated IPS asset:', data);
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.ipsDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.ipsLists() });
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.lists() });
    },
  });
};

// DELETE - Delete IPS asset
export const useDeleteIPSAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<ApiResponse<void>>(`/assets/ips/${id}`);
      console.log('Deleted IPS asset:', id);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: ASSETS_KEYS.ipsDetail(id) });
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.ipsLists() });
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.lists() });
    },
  });
};

// ==================== DOMAIN ENDPOINTS ====================

// GET - Fetch all domain assets
export const useDomainAssets = (params: DomainQueryParams = {}) => {
  return useQuery({
    queryKey: ASSETS_KEYS.domainsList(params),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Domain>>>('/assets/domains', { params });
      console.log('Fetched domain assets:', data);
      return data.data;
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
};

// GET - Fetch single domain asset
export const useDomainAsset = (id: string) => {
  return useQuery({
    queryKey: ASSETS_KEYS.domainsDetail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Domain>>(`/assets/domains/${id}`);
      console.log('Fetched domain asset:', data);
      return data.data;
    },
    enabled: !!id,
  });
};

// POST - Create new domain asset
export const useCreateDomainAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newDomain: CreateDomainDto) => {
      const { data } = await apiClient.post<ApiResponse<Domain>>('/assets/domains', newDomain);
      console.log('Created domain asset:', data);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.domainsLists() });
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.lists() });
    },
  });
};

// PATCH - Update domain asset
export const useUpdateDomainAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateDomainDto & { id: string }) => {
      const { data } = await apiClient.patch<ApiResponse<Domain>>(`/assets/domains/${id}`, updateData);
      console.log('Updated domain asset:', data);
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.domainsDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.domainsLists() });
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.lists() });
    },
  });
};

// DELETE - Delete domain asset
export const useDeleteDomainAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<ApiResponse<void>>(`/assets/domains/${id}`);
      console.log('Deleted domain asset:', id);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: ASSETS_KEYS.domainsDetail(id) });
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.domainsLists() });
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.lists() });
    },
  });
};

// ==================== PORTAL ENDPOINTS ====================

// GET - Fetch all portal assets
export const usePortalAssets = (params: PortalQueryParams = {}) => {
  return useQuery({
    queryKey: ASSETS_KEYS.portalsList(params),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Portal>>>('/assets/portals', { params });
      console.log('Fetched portal assets:', data);
      return data.data;
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
};

// GET - Fetch single portal asset
export const usePortalAsset = (id: string) => {
  return useQuery({
    queryKey: ASSETS_KEYS.portalsDetail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Portal>>(`/assets/portals/${id}`);
      console.log('Fetched portal asset:', data);
      return data.data;
    },
    enabled: !!id,
  });
};

// POST - Create new portal asset
export const useCreatePortalAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newPortal: CreatePortalDto) => {
      const { data } = await apiClient.post<ApiResponse<Portal>>('/assets/portals', newPortal);
      console.log('Created portal asset:', data);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.portalsLists() });
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.lists() });
    },
  });
};

// PATCH - Update portal asset
export const useUpdatePortalAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdatePortalDto & { id: string }) => {
      const { data } = await apiClient.patch<ApiResponse<Portal>>(`/assets/portals/${id}`, updateData);
      console.log('Updated portal asset:', data);
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.portalsDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.portalsLists() });
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.lists() });
    },
  });
};

// DELETE - Delete portal asset
export const useDeletePortalAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<ApiResponse<void>>(`/assets/portals/${id}`);
      console.log('Deleted portal asset:', id);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: ASSETS_KEYS.portalsDetail(id) });
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.portalsLists() });
      queryClient.invalidateQueries({ queryKey: ASSETS_KEYS.lists() });
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