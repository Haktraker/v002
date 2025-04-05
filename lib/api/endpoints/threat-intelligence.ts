import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../config';
import { 
  ApiResponse, 
  SuspiciousIP, 
  CreateSuspiciousIPDto, 
  UpdateSuspiciousIPDto,
  IOC,
  CreateIOCDto,
  UpdateIOCDto,
  APTFeed,
  CreateAPTFeedDto,
  UpdateAPTFeedDto,
  ThreatIntelligenceFeed,
  CreateThreatIntelligenceFeedDto,
  UpdateThreatIntelligenceFeedDto,
  ThreatNews,
  CreateThreatNewsDto,
  UpdateThreatNewsDto,
  GeoWatch,
  CreateGeoWatchDto,
  UpdateGeoWatchDto,
  ThreatIntelligenceQueryParams
} from '../types';
import { showToast } from '@/lib/utils/toast-utils';
import { useApiLoading } from '@/lib/utils/api-utils';

// API Keys for Threat Intelligence
export const THREAT_INTELLIGENCE_KEYS = {
  // Suspicious IPs
  suspiciousIpsLists: () => ['suspiciousIps'] as const,
  suspiciousIpsDetail: (id: string) => ['suspiciousIps', id] as const,
  
  // IOCs
  iocsLists: () => ['iocs'] as const,
  iocsDetail: (id: string) => ['iocs', id] as const,
  
  // APT Feeds
  aptFeedsLists: () => ['aptFeeds'] as const,
  aptFeedsDetail: (id: string) => ['aptFeeds', id] as const,
  
  // Threat Intelligence Feeds
  threatIntelligenceFeedsLists: () => ['threatIntelligenceFeeds'] as const,
  threatIntelligenceFeedsDetail: (id: string) => ['threatIntelligenceFeeds', id] as const,
  
  // Threat News
  threatNewsLists: () => ['threatNews'] as const,
  threatNewsDetail: (id: string) => ['threatNews', id] as const,
  
  // Geo Watch
  geoWatchLists: () => ['geoWatch'] as const,
  geoWatchDetail: (id: string) => ['geoWatch', id] as const,
  
  // All lists
  lists: () => ['threatIntelligenceLists'] as const,
};

// Base URL for all threat intelligence endpoints
const BASE_URL = '/threat-intelligence';

// ==================== Suspicious IPs ====================

// Get all suspicious IPs
export const useGetSuspiciousIPs = (params?: ThreatIntelligenceQueryParams) => {
  const { withLoading } = useApiLoading();
  
  return useQuery({
    queryKey: THREAT_INTELLIGENCE_KEYS.suspiciousIpsLists(),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<SuspiciousIP[]>>(`${BASE_URL}/suspicious-ips`, { params }));
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get suspicious IP by ID
export const useGetSuspiciousIPById = (id: string) => {
  const { withLoading } = useApiLoading();
  
  return useQuery({
    queryKey: THREAT_INTELLIGENCE_KEYS.suspiciousIpsDetail(id),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<SuspiciousIP>>(`${BASE_URL}/suspicious-ips/${id}`));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Create suspicious IP
export const useCreateSuspiciousIP = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (newSuspiciousIP: CreateSuspiciousIPDto) => {
      const response = await withLoading(() => apiClient.post<ApiResponse<SuspiciousIP>>(`${BASE_URL}/suspicious-ips`, newSuspiciousIP));
      return response.data.data;
    },
    onSuccess: (data) => {
      showToast('Suspicious IP created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.suspiciousIpsLists() });
      queryClient.invalidateQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to create suspicious IP:', error);
      showToast('Failed to create suspicious IP', 'error');
    },
  });
};

// Update suspicious IP
export const useUpdateSuspiciousIP = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateSuspiciousIPDto & { id: string }) => {
      const response = await withLoading(() => apiClient.patch<ApiResponse<SuspiciousIP>>(`${BASE_URL}/suspicious-ips/${id}`, updateData));
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('Suspicious IP updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.suspiciousIpsDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.suspiciousIpsLists() });
      queryClient.invalidateQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to update suspicious IP:', error);
      showToast('Failed to update suspicious IP', 'error');
    },
  });
};

// Delete suspicious IP
export const useDeleteSuspiciousIP = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await withLoading(() => apiClient.delete<ApiResponse<null>>(`${BASE_URL}/suspicious-ips/${id}`));
      return response.data;
    },
    onSuccess: (_, id) => {
      showToast('Suspicious IP deleted successfully', 'success');
      queryClient.removeQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.suspiciousIpsDetail(id) });
      queryClient.invalidateQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.suspiciousIpsLists() });
      queryClient.invalidateQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to delete suspicious IP:', error);
      showToast('Failed to delete suspicious IP', 'error');
    },
  });
};

// ==================== IOCs ====================

// Get all IOCs
export const useGetIOCs = (params?: ThreatIntelligenceQueryParams) => {
  const { withLoading } = useApiLoading();
  
  return useQuery({
    queryKey: THREAT_INTELLIGENCE_KEYS.iocsLists(),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<IOC[]>>(`${BASE_URL}/iocs`, { params }));
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get IOC by ID
export const useGetIOCById = (id: string) => {
  const { withLoading } = useApiLoading();
  
  return useQuery({
    queryKey: THREAT_INTELLIGENCE_KEYS.iocsDetail(id),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<IOC>>(`${BASE_URL}/iocs/${id}`));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Create IOC
export const useCreateIOC = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (newIOC: CreateIOCDto) => {
      const response = await withLoading(() => apiClient.post<ApiResponse<IOC>>(`${BASE_URL}/iocs`, newIOC));
      return response.data.data;
    },
    onSuccess: (data) => {
      showToast('IOC created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.iocsLists() });
      queryClient.invalidateQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to create IOC:', error);
      showToast('Failed to create IOC', 'error');
    },
  });
};

// Update IOC
export const useUpdateIOC = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateIOCDto & { id: string }) => {
      const response = await withLoading(() => apiClient.patch<ApiResponse<IOC>>(`${BASE_URL}/iocs/${id}`, updateData));
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('IOC updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.iocsDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.iocsLists() });
      queryClient.invalidateQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to update IOC:', error);
      showToast('Failed to update IOC', 'error');
    },
  });
};

// Delete IOC
export const useDeleteIOC = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await withLoading(() => apiClient.delete<ApiResponse<null>>(`${BASE_URL}/iocs/${id}`));
      return response.data;
    },
    onSuccess: (_, id) => {
      showToast('IOC deleted successfully', 'success');
      queryClient.removeQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.iocsDetail(id) });
      queryClient.invalidateQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.iocsLists() });
      queryClient.invalidateQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to delete IOC:', error);
      showToast('Failed to delete IOC', 'error');
    },
  });
};

// ==================== APT Feeds ====================

// Get all APT feeds
export const useGetAPTFeeds = (params?: ThreatIntelligenceQueryParams) => {
  const { withLoading } = useApiLoading();
  
  return useQuery({
    queryKey: THREAT_INTELLIGENCE_KEYS.aptFeedsLists(),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<APTFeed[]>>(`${BASE_URL}/apt-feeds`, { params }));
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get APT feed by ID
export const useGetAPTFeedById = (id: string) => {
  const { withLoading } = useApiLoading();
  
  return useQuery({
    queryKey: THREAT_INTELLIGENCE_KEYS.aptFeedsDetail(id),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<APTFeed>>(`${BASE_URL}/apt-feeds/${id}`));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Create APT feed
export const useCreateAPTFeed = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (newAPTFeed: CreateAPTFeedDto) => {
      const response = await withLoading(() => apiClient.post<ApiResponse<APTFeed>>(`${BASE_URL}/apt-feeds`, newAPTFeed));
      return response.data.data;
    },
    onSuccess: (data) => {
      showToast('APT feed created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.aptFeedsLists() });
      queryClient.invalidateQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to create APT feed:', error);
      showToast('Failed to create APT feed', 'error');
    },
  });
};

// Update APT feed
export const useUpdateAPTFeed = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateAPTFeedDto & { id: string }) => {
      const response = await withLoading(() => apiClient.patch<ApiResponse<APTFeed>>(`${BASE_URL}/apt-feeds/${id}`, updateData));
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('APT feed updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.aptFeedsDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.aptFeedsLists() });
      queryClient.invalidateQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to update APT feed:', error);
      showToast('Failed to update APT feed', 'error');
    },
  });
};

// Delete APT feed
export const useDeleteAPTFeed = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await withLoading(() => apiClient.delete<ApiResponse<null>>(`${BASE_URL}/apt-feeds/${id}`));
      return response.data;
    },
    onSuccess: (_, id) => {
      showToast('APT feed deleted successfully', 'success');
      queryClient.removeQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.aptFeedsDetail(id) });
      queryClient.invalidateQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.aptFeedsLists() });
      queryClient.invalidateQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to delete APT feed:', error);
      showToast('Failed to delete APT feed', 'error');
    },
  });
};

// ==================== Threat Intelligence Feeds ====================

// Get all threat intelligence feeds
export const useGetThreatIntelligenceFeeds = (params?: ThreatIntelligenceQueryParams) => {
  const { withLoading } = useApiLoading();
  
  return useQuery({
    queryKey: THREAT_INTELLIGENCE_KEYS.threatIntelligenceFeedsLists(),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<ThreatIntelligenceFeed[]>>(`${BASE_URL}/threat-intelligence-feeds`, { params }));
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get threat intelligence feed by ID
export const useGetThreatIntelligenceFeedById = (id: string) => {
  const { withLoading } = useApiLoading();
  
  return useQuery({
    queryKey: THREAT_INTELLIGENCE_KEYS.threatIntelligenceFeedsDetail(id),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<ThreatIntelligenceFeed>>(`${BASE_URL}/threat-intelligence-feeds/${id}`));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Create threat intelligence feed
export const useCreateThreatIntelligenceFeed = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (newThreatIntelligenceFeed: CreateThreatIntelligenceFeedDto) => {
      const response = await withLoading(() => apiClient.post<ApiResponse<ThreatIntelligenceFeed>>(`${BASE_URL}/threat-intelligence-feeds`, newThreatIntelligenceFeed));
      return response.data.data;
    },
    onSuccess: (data) => {
      showToast('Threat intelligence feed created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.threatIntelligenceFeedsLists() });
      queryClient.invalidateQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to create threat intelligence feed:', error);
      showToast('Failed to create threat intelligence feed', 'error');
    },
  });
};

// Update threat intelligence feed
export const useUpdateThreatIntelligenceFeed = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateThreatIntelligenceFeedDto & { id: string }) => {
      const response = await withLoading(() => apiClient.patch<ApiResponse<ThreatIntelligenceFeed>>(`${BASE_URL}/threat-intelligence-feeds/${id}`, updateData));
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('Threat intelligence feed updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.threatIntelligenceFeedsDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.threatIntelligenceFeedsLists() });
      queryClient.invalidateQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to update threat intelligence feed:', error);
      showToast('Failed to update threat intelligence feed', 'error');
    },
  });
};

// Delete threat intelligence feed
export const useDeleteThreatIntelligenceFeed = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await withLoading(() => apiClient.delete<ApiResponse<null>>(`${BASE_URL}/threat-intelligence-feeds/${id}`));
      return response.data;
    },
    onSuccess: (_, id) => {
      showToast('Threat intelligence feed deleted successfully', 'success');
      queryClient.removeQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.threatIntelligenceFeedsDetail(id) });
      queryClient.invalidateQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.threatIntelligenceFeedsLists() });
      queryClient.invalidateQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to delete threat intelligence feed:', error);
      showToast('Failed to delete threat intelligence feed', 'error');
    },
  });
};

// ==================== Threat News ====================

// Get all threat news
export const useGetThreatNews = (params?: ThreatIntelligenceQueryParams) => {
  const { withLoading } = useApiLoading();
  
  return useQuery({
    queryKey: THREAT_INTELLIGENCE_KEYS.threatNewsLists(),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<ThreatNews[]>>(`${BASE_URL}/threat-news`, { params }));
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get threat news by ID
export const useGetThreatNewsById = (id: string) => {
  const { withLoading } = useApiLoading();
  
  return useQuery({
    queryKey: THREAT_INTELLIGENCE_KEYS.threatNewsDetail(id),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<ThreatNews>>(`${BASE_URL}/threat-news/${id}`));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Create threat news
export const useCreateThreatNews = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (newThreatNews: CreateThreatNewsDto) => {
      const response = await withLoading(() => apiClient.post<ApiResponse<ThreatNews>>(`${BASE_URL}/threat-news`, newThreatNews));
      return response.data.data;
    },
    onSuccess: (data) => {
      showToast('Threat news created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.threatNewsLists() });
      queryClient.invalidateQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to create threat news:', error);
      showToast('Failed to create threat news', 'error');
    },
  });
};

// Update threat news
export const useUpdateThreatNews = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateThreatNewsDto & { id: string }) => {
      const response = await withLoading(() => apiClient.patch<ApiResponse<ThreatNews>>(`${BASE_URL}/threat-news/${id}`, updateData));
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('Threat news updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.threatNewsDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.threatNewsLists() });
      queryClient.invalidateQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to update threat news:', error);
      showToast('Failed to update threat news', 'error');
    },
  });
};

// Delete threat news
export const useDeleteThreatNews = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await withLoading(() => apiClient.delete<ApiResponse<null>>(`${BASE_URL}/threat-news/${id}`));
      return response.data;
    },
    onSuccess: (_, id) => {
      showToast('Threat news deleted successfully', 'success');
      queryClient.removeQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.threatNewsDetail(id) });
      queryClient.invalidateQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.threatNewsLists() });
      queryClient.invalidateQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to delete threat news:', error);
      showToast('Failed to delete threat news', 'error');
    },
  });
};

// ==================== Geo Watch ====================

// Get all geo watch
export const useGetGeoWatch = (params?: ThreatIntelligenceQueryParams) => {
  const { withLoading } = useApiLoading();
  
  return useQuery({
    queryKey: THREAT_INTELLIGENCE_KEYS.geoWatchLists(),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<GeoWatch[]>>(`${BASE_URL}/geo-watch`, { params }));
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Get geo watch by ID
export const useGetGeoWatchById = (id: string) => {
  const { withLoading } = useApiLoading();
  
  return useQuery({
    queryKey: THREAT_INTELLIGENCE_KEYS.geoWatchDetail(id),
    queryFn: async () => {
      const response = await withLoading(() => apiClient.get<ApiResponse<GeoWatch>>(`${BASE_URL}/geo-watch/${id}`));
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Create geo watch
export const useCreateGeoWatch = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (newGeoWatch: CreateGeoWatchDto) => {
      const response = await withLoading(() => apiClient.post<ApiResponse<GeoWatch>>(`${BASE_URL}/geo-watch`, newGeoWatch));
      return response.data.data;
    },
    onSuccess: (data) => {
      showToast('Geo watch created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.geoWatchLists() });
      queryClient.invalidateQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to create geo watch:', error);
      showToast('Failed to create geo watch', 'error');
    },
  });
};

// Update geo watch
export const useUpdateGeoWatch = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateGeoWatchDto & { id: string }) => {
      const response = await withLoading(() => apiClient.patch<ApiResponse<GeoWatch>>(`${BASE_URL}/geo-watch/${id}`, updateData));
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      showToast('Geo watch updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.geoWatchDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.geoWatchLists() });
      queryClient.invalidateQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to update geo watch:', error);
      showToast('Failed to update geo watch', 'error');
    },
  });
};

// Delete geo watch
export const useDeleteGeoWatch = () => {
  const queryClient = useQueryClient();
  const { withLoading } = useApiLoading();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await withLoading(() => apiClient.delete<ApiResponse<null>>(`${BASE_URL}/geo-watch/${id}`));
      return response.data;
    },
    onSuccess: (_, id) => {
      showToast('Geo watch deleted successfully', 'success');
      queryClient.removeQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.geoWatchDetail(id) });
      queryClient.invalidateQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.geoWatchLists() });
      queryClient.invalidateQueries({ queryKey: THREAT_INTELLIGENCE_KEYS.lists() });
    },
    onError: (error: any) => {
      console.error('Failed to delete geo watch:', error);
      showToast('Failed to delete geo watch', 'error');
    },
  });
};