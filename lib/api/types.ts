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

export interface ThreatIntelligenceQueryParams {
  status?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  threatType?: string;
  severityLevel?: string;
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
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  length: number;
}

// Network Anomaly Types
export interface NetworkAnomalyDay {
  dayNumber: number;
  score: number;
}

export interface NetworkAnomaly {
  _id: string;
  month: string;
  year: string;
  days: NetworkAnomalyDay[];
  createdAt?: string;
  updatedAt?: string;
}

// Threat Intelligence Types

// Threat Composition
export interface ThreatComposition {
  _id: string;
  month: string;
  year: string;
  severityLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  threatType: 'Phishing Attempts' | 'Intrusion Attempts' | 'Insider Threats' | 'ATO' | 'Trojan and Malware' | '3rd Party leaks' | 'Attack Surfaces';
  attackVector: 'Email' | 'Network Ports' | 'Social Engineering' | 'Applications' | 'Removable Media';
  bu: string;
  affectedAsset: string;
  incidentCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateThreatCompositionDto {
  month: string;
  year: string;
  severityLevel: string;
  threatType: string;
  attackVector: string;
  bu: string;
  affectedAsset: string;
  incidentCount: number;
}

export interface UpdateThreatCompositionDto {
  month?: string;
  year?: string;
  severityLevel?: string;
  threatType?: string;
  attackVector?: string;
  bu?: string;
  affectedAsset?: string;
  incidentCount?: number;
}

// Suspicious IPs
export interface SuspiciousIP {
  _id: string;
  value: string;
  source: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSuspiciousIPDto {
  value: string;
  source: string;
  description: string;
  time: string;
}

export interface UpdateSuspiciousIPDto {
  value?: string;
  source?: string;
  description?: string;
}

// IOCs (Indicators of Compromise)
export interface IOC {
  _id: string;
  iOCType: string;
  indicatorValue: string;
  threatType: string;
  source: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateIOCDto {
  iOCType: string;
  indicatorValue: string;
  threatType: string;
  source: string;
  description: string;
  time: string;
}

export interface UpdateIOCDto {
  iOCType?: string;
  indicatorValue?: string;
  threatType?: string;
  source?: string;
  description?: string;
}

// APT Feeds
export interface APTFeed {
  _id: string;
  aptGroupName: string;
  threatType: string;
  ttps: string;
  targetSectors: string;
  geographicFocus: string;
  iocs: string;
  source: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAPTFeedDto {
  aptGroupName: string;
  threatType: string;
  ttps: string;
  targetSectors: string;
  geographicFocus: string;
  iocs: string;
  source: string;
  description: string;
  time: string;
}

export interface UpdateAPTFeedDto {
  aptGroupName?: string;
  threatType?: string;
  ttps?: string;
  targetSectors?: string;
  geographicFocus?: string;
  iocs?: string;
  source?: string;
  description?: string;
}

// Threat Intelligence Feeds
export interface ThreatIntelligenceFeed {
  _id: string;
  threatType: string;
  severity: string;
  source: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateThreatIntelligenceFeedDto {
  threatType: string;
  severity: string;
  source: string;
  description: string;
  time: string;
}

export interface UpdateThreatIntelligenceFeedDto {
  threatType?: string;
  severity?: string;
  source?: string;
  description?: string;
}

// Threat News
export interface ThreatNews {
  _id: string;
  threatType: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateThreatNewsDto {
  threatType: string;
  description: string;
  time: string;
}

export interface UpdateThreatNewsDto {
  threatType?: string;
  description?: string;
}

// Geo Watch
export interface GeoWatch {
  _id: string;
  eventType: string;
  location: string;
  country: string;
  region: string;
  time: string;
  source: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  assetAffected: string;
  customAlertsTriggered: boolean;
  status: 'unresolved' | 'resolved' | 'investigating';
  actionTaken: string;
  commentsNotes: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateGeoWatchDto {
  eventType: string;
  location: string;
  country: string;
  region: string;
  time: string;
  source: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  assetAffected: string;
  customAlertsTriggered: boolean;
  status: 'unresolved' | 'resolved' | 'investigating';
  actionTaken: string;
  commentsNotes: string;
}

export interface UpdateGeoWatchDto {
  eventType?: string;
  location?: string;
  country?: string;
  region?: string;
  time?: string;
  source?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  assetAffected?: string;
  customAlertsTriggered?: boolean;
  status?: 'unresolved' | 'resolved' | 'investigating';
  actionTaken?: string;
  commentsNotes?: string;
}

// Query params for threat intelligence
export interface ThreatIntelligenceQueryParams {
  page?: number;
  limit?: number;
}

// Dark Web Mentions
export type DarkWebMentionType = "credentials" | "corporate assets" | "brand mentions";
export type DarkWebMentionStatus = "investigating" | "resolved" | "unresolved";
export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface DarkWebMentionDetail {
  user?: string;
  password?: string;
  timestamp?: Date;
  riskLevel?: RiskLevel;
  dataType?: string;
  url?: string;
}

export interface DarkWebMention {
  _id: string;
  month: string;
  year: string;
  mention: string;
  source: string;
  chronologyTags: string;
  impactEvaluation: string;
  threatGeolocation: string;
  asset: string;
  mitigationSteps: string;
  type: DarkWebMentionType;
  status: DarkWebMentionStatus;
  details: DarkWebMentionDetail[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDarkWebMentionDto {
  month: string;
  year: string;
  mention: string;
  source: string;
  chronologyTags: string;
  impactEvaluation: string;
  threatGeolocation: string;
  asset: string;
  mitigationSteps: string;
  type: DarkWebMentionType;
  status?: DarkWebMentionStatus;
  details: DarkWebMentionDetail[];
}

export interface UpdateDarkWebMentionDto {
  month?: string;
  year?: string;
  mention?: string;
  source?: string;
  chronologyTags?: string;
  impactEvaluation?: string;
  threatGeolocation?: string;
  asset?: string;
  mitigationSteps?: string;
  type?: DarkWebMentionType;
  status?: DarkWebMentionStatus;
  details?: DarkWebMentionDetail[];
}

export interface DarkWebMentionQueryParams {
  type?: DarkWebMentionType;
  status?: DarkWebMentionStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// Compliance Scores
export interface ComplianceScore {
  _id: string;
  month: string;
  year: string;
  bu: {
    buName: string;
    compliances: {
      complianceName: string;
      count: number;
    }[];
  }[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateComplianceScoreDto {
  month: string;
  year: string;
  bu: {
    buName: string;
    compliances: {
      complianceName: string;
      count: number;
    }[];
  }[];
}

export interface UpdateComplianceScoreDto {
  month?: string;
  year?: string;
  bu?: {
    buName: string;
    compliances: {
      complianceName: string;
      count: number;
    }[];
  }[];
}

export interface ComplianceScoreQueryParams {
  month?: string;
  year?: string;
  page?: number;
  limit?: number;
}

// User Risk Distribution
export interface UserRiskDistribution {
  _id: string;
  month: string;
  year: string;
  bu: {
    buName: string;
    severities: {
      severity: "Critical" | "High" | "Low" | "Medium";
      count: number;
    }[];
  }[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserRiskDistributionDto {
  month: string;
  year: string;
  bu: {
    buName: string;
    severities: {
      severity: "Critical" | "High" | "Low" | "Medium";
      count: number;
    }[];
  }[];
}

export interface UpdateUserRiskDistributionDto {
  month?: string;
  year?: string;
  bu?: {
    buName: string;
    severities: {
      severity: "Critical" | "High" | "Low" | "Medium";
      count: number;
    }[];
  }[];
}

export interface UserRiskDistributionQueryParams {
  month?: string;
  year?: string;
  page?: number;
  limit?: number;
}

// Network Anomalies Types
export interface NetworkAnomalyDay {
  dayNumber: number;
  score: number;
}

export interface NetworkAnomaly {
  _id: string;
  year: string;
  month: string;
  days: NetworkAnomalyDay[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateNetworkAnomalyDto {
  year: string;
  month: string;
  days: NetworkAnomalyDay[];
}

export interface UpdateNetworkAnomalyDto {
  year?: string;
  month?: string;
  days?: NetworkAnomalyDay[];
}

export interface NetworkAnomalyQueryParams {
  year?: string;
  month?: string;
  page?: number;
  limit?: number;
}

export type IncidentName = "Malware" | "Phishing" | "DDos" | "Data Breach" | "Ransomware";

export interface Incident {
  incident_name: IncidentName;
  incident_score: number;
}

export interface BusinessUnitIncidents {
  bu_name: string;
  incidents: Incident[];
}

export interface SecurityIncidentTrend {
  _id: string;
  month: string;
  year: string;
  bu: BusinessUnitIncidents[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSecurityIncidentTrendDto {
  month: string;
  year: string;
  bu: {
    bu_name: string;
    incidents: {
      incident_name: IncidentName;
      incident_score: number;
    }[];
  }[];
}

export interface UpdateSecurityIncidentTrendDto {
  month?: string;
  year?: string;
  bu?: {
    bu_name: string;
    incidents: {
      incident_name: IncidentName;
      incident_score: number;
    }[];
  }[];
}

export interface SecurityIncidentTrendQueryParams {
  month?: string;
  year?: string;
  page?: number;
  limit?: number;
}

// Security Issue Types
export interface SecurityIssueBu { // Renamed from 'bu' in schema to avoid conflict and be more descriptive
  buName: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  vendor: string;
  issue: string;
  daysOpen: number;
  description: string;
  affectedSystems: string[];
  recommendedAction: string;
  lastUpdated: string; // Consider using Date type if applicable
}

export interface SecurityIssue {
  _id: string;
  month: string;
  year: string;
  bu: SecurityIssueBu[];
  createdAt?: string; // from timestamps: true
  updatedAt?: string; // from timestamps: true
}

// Query params for Security Issues (optional, add if needed for filtering/pagination)
export interface SecurityIssueQueryParams {
  month?: string;
  year?: string;
  severity?: 'Critical' | 'High' | 'Medium' | 'Low';
  buName?: string;
  page?: number;
  limit?: number;
}

// DTO for creating a new Security Issue
export interface CreateSecurityIssueDto {
  month: string;
  year: string;
  bu: SecurityIssueBu[]; // Array of business unit security issues
}

// DTO for updating an existing Security Issue
// Note: Mongoose schema suggests updating the whole document or specific 'bu' items.
// This DTO allows updating top-level fields or replacing the 'bu' array.
// For more granular updates (e.g., updating a single item within the 'bu' array),
// a different approach/endpoint might be needed on the backend.
export interface UpdateSecurityIssueDto {
  month?: string;
  year?: string;
  bu?: SecurityIssueBu[];
}


export interface UpdateSecurityIncidentTrendDto {
  month?: string;
  year?: string;
  bu?: {
    bu_name: string;
    incidents: {
      incident_name: IncidentName;
      incident_score: number;
    }[];
  }[];
}

export interface SecurityIncidentTrendQueryParams {
  month?: string;
  year?: string;
  page?: number;
  limit?: number;
}
