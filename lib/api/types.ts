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
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  length: number;
}

// Threat Intelligence Types

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
