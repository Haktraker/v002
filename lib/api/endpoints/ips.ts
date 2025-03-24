import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../config';
import { ApiResponse, CreateIPSDto, IPS, IPSQueryParams, PaginatedResponse, UpdateIPSDto } from '../types';

const IPS_KEYS = {
  all: ['ips'] as const,
  lists: () => [...IPS_KEYS.all, 'list'] as const,
  list: (filters: IPSQueryParams) => [...IPS_KEYS.lists(), filters] as const,
  details: () => [...IPS_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...IPS_KEYS.details(), id] as const,
};

// GET - Fetch IPS events with filters
export const useIPSEvents = (params: IPSQueryParams = {}) => {
  return useQuery({
    queryKey: IPS_KEYS.list(params),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<PaginatedResponse<IPS>>>('/assets/ips', { params });
      console.log('Fetched IPS events:', data);
      return data.data;
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
};

// GET - Fetch single IPS event
export const useIPSEvent = (id: string) => {
  return useQuery({
    queryKey: IPS_KEYS.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<IPS>>(`/assets/ips/${id}`);
      console.log('Fetched IPS event:', data);
      return data.data;
    },
    enabled: !!id,
  });
};

// POST - Create new IPS event
export const useCreateIPS = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newIPS: CreateIPSDto) => {
      const { data } = await apiClient.post<ApiResponse<IPS>>('/assets/ips', newIPS);
      console.log('Created IPS event:', data);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: IPS_KEYS.lists() });
    },
  });
};

// PUT - Update IPS event
export const useUpdateIPS = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateIPSDto & { id: string }) => {
      const { data } = await apiClient.put<ApiResponse<IPS>>(`/assets/ips/${id}`, updateData);
      console.log('Updated IPS event:', data);
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: IPS_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: IPS_KEYS.lists() });
    },
  });
};

// DELETE - Delete IPS event
export const useDeleteIPS = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<ApiResponse<void>>(`/assets/ips/${id}`);
      console.log('Deleted IPS event:', id);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: IPS_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: IPS_KEYS.lists() });
    },
  });
};
