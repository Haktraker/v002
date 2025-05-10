import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/config";
import {
  ReportsThreatCompositionOverview,
  CreateReportsThreatCompositionOverviewDto,
  UpdateReportsThreatCompositionOverviewDto,
  ReportsSeverityLevel,
  ReportsThreatType,
  ReportsAttackVector,
  ReportsBusinessUnit,
  ReportsThreatCompositionOverviewQueryParams,
} from "@/lib/api/reports-types/types";

const THREAT_COMPOSITION_OVERVIEW_QUERY_KEY = "threatCompositionOverview";

// Fetch all Threat Composition Overview records
export const useGetThreatCompositionOverviews = (
  filters?: ReportsThreatCompositionOverviewQueryParams
) => {
  return useQuery<ReportsThreatCompositionOverview[], Error>({
    queryKey: [THREAT_COMPOSITION_OVERVIEW_QUERY_KEY, filters],
    queryFn: async () => {
      const response = await apiClient.get<{ data: ReportsThreatCompositionOverview[]; /* and other pagination fields */ }>("/reports/threat-composition-overview", {
        params: filters,
      });
      return response.data.data;
    },
  });
};

// Fetch a single Threat Composition Overview record by ID
export const useGetThreatCompositionOverviewById = (id: string) => {
  return useQuery<ReportsThreatCompositionOverview, Error>({
    queryKey: [THREAT_COMPOSITION_OVERVIEW_QUERY_KEY, id],
    queryFn: async () => {
      const response = await apiClient.get(`/reports/threat-composition-overview/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

// Create a new Threat Composition Overview record
export const useCreateThreatCompositionOverview = () => {
  const queryClient = useQueryClient();
  return useMutation<
    ReportsThreatCompositionOverview,
    Error,
    CreateReportsThreatCompositionOverviewDto
  >({
    mutationFn: async (newData) => {
      const response = await apiClient.post(
        "/reports/threat-composition-overview",
        newData
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [THREAT_COMPOSITION_OVERVIEW_QUERY_KEY] });
    },
  });
};

// Update an existing Threat Composition Overview record
export const useUpdateThreatCompositionOverview = () => {
  const queryClient = useQueryClient();
  return useMutation<
    ReportsThreatCompositionOverview,
    Error,
    { id: string; updatedData: UpdateReportsThreatCompositionOverviewDto }
  >({
    mutationFn: async ({ id, updatedData }) => {
      const response = await apiClient.patch(
        `/reports/threat-composition-overview/${id}`,
        updatedData
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [THREAT_COMPOSITION_OVERVIEW_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [THREAT_COMPOSITION_OVERVIEW_QUERY_KEY, variables.id] });
    },
  });
};

// Delete a Threat Composition Overview record
export const useDeleteThreatCompositionOverview = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await apiClient.delete(`/reports/threat-composition-overview/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [THREAT_COMPOSITION_OVERVIEW_QUERY_KEY] });
    },
  });
};

// For bulk upload
export const useBulkCreateThreatCompositionOverview = () => {
  const queryClient = useQueryClient();
  return useMutation<
    { count: number },
    Error,
    CreateReportsThreatCompositionOverviewDto[]
  >({
    mutationFn: async (newDataArray) => {
      const response = await apiClient.post(
        "/reports/threat-composition-overview/bulk",
        newDataArray
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [THREAT_COMPOSITION_OVERVIEW_QUERY_KEY] });
    },
  });
};

// Constants for dropdowns, using enum members
export const THREAT_SEVERITY_LEVELS: ReportsSeverityLevel[] = [
  ReportsSeverityLevel.LOW,
  ReportsSeverityLevel.MEDIUM,
  ReportsSeverityLevel.HIGH,
  ReportsSeverityLevel.CRITICAL,
];
export const THREAT_TYPES: ReportsThreatType[] = [
  ReportsThreatType.PHISHING_ATTEMPTS,
  ReportsThreatType.INTRUSION_ATTEMPTS,
  ReportsThreatType.INSIDER_THREATS,
  ReportsThreatType.ATO,
  ReportsThreatType.TROJAN_MALWARE,
  ReportsThreatType.THIRD_PARTY_LEAKS,
  ReportsThreatType.ATTACK_SURFACES,
];
export const ATTACK_VECTORS: ReportsAttackVector[] = [
  ReportsAttackVector.EMAIL,
  ReportsAttackVector.NETWORK_PORTS,
  ReportsAttackVector.SOCIAL_ENGINEERING,
  ReportsAttackVector.APPLICATIONS,
  ReportsAttackVector.REMOVABLE_MEDIA,
];
export const BUSINESS_UNITS_TC: ReportsBusinessUnit[] = [
  ReportsBusinessUnit.HO_DR,
  ReportsBusinessUnit.CWC,
  ReportsBusinessUnit.RAMAT,
  ReportsBusinessUnit.EFS,
  ReportsBusinessUnit.ETS,
  ReportsBusinessUnit.ALRASHED_FOOD,
  ReportsBusinessUnit.ALRASHED_TIRES,
  ReportsBusinessUnit.JANA_MARINE_TANAJIB,
  ReportsBusinessUnit.INDUSTRIALS_STEEL_FAST,
  ReportsBusinessUnit.ALRASHED_WOOD,
  ReportsBusinessUnit.ADMIRALS,
  ReportsBusinessUnit.YAUMI,
  ReportsBusinessUnit.BMD,
  ReportsBusinessUnit.SAUDI_FILTER,
  ReportsBusinessUnit.CEMENT,
  ReportsBusinessUnit.INSUWRAP,
  ReportsBusinessUnit.EFS_ETS,
  ReportsBusinessUnit.UBMKSA,
  ReportsBusinessUnit.POLYSTYRENE,
];
