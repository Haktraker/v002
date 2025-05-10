export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalItems?: number; // Use a generic term like totalItems
      limit: number;
    };
  }

// ================= Reports Security Posture Score Types =================

export interface ReportsSecurityPostureScore {
    _id: string;
    percentage: string;
    score: string;
    year: string;
    month: string;
    createdAt?: string; // From timestamps: true
    updatedAt?: string; // From timestamps: true
  }
  
  export interface CreateReportsSecurityPostureScoreDto {
    percentage: string;
    score: string;
    year: string;
    month: string;
  }
  
  export interface UpdateReportsSecurityPostureScoreDto {
    percentage?: string;
    score?: string;
    year?: string;
    month?: string;
  }
  
  export interface ReportsSecurityPostureScoreQueryParams {
    month?: string;
    year?: string;
    // Add other relevant query params like page, limit if needed
    page?: number;
    limit?: number;
  }

// ================= Reports Incident and Alert Volume Types =================

export interface ReportsIncidentAlertVolume {
    _id: string;
    month: string; // Unique
    score: string; // Represents volume
    year: string;
    createdAt?: string; // From timestamps: true
    updatedAt?: string; // From timestamps: true
}

export interface CreateReportsIncidentAlertVolumeDto {
    month: string;
    score: string;
    year: string;
}

export interface UpdateReportsIncidentAlertVolumeDto {
    month?: string;
    score?: string;
    year?: string;
}

export interface ReportsIncidentAlertVolumeQueryParams {
    month?: string;
    year?: string;
    page?: number;
    limit?: number;
}

// ================= Reports Threat Composition Overview Types =================

export enum ReportsSeverityLevel {
    LOW = "Low",
    MEDIUM = "Medium",
    HIGH = "High",
    CRITICAL = "Critical",
}

export enum ReportsThreatType {
    PHISHING_ATTEMPTS = "Phishing Attempts",
    INTRUSION_ATTEMPTS = "Intrusion Attempts",
    INSIDER_THREATS = "Insider Threats",
    ATO = "ATO",
    TROJAN_MALWARE = "Trojan and Malware",
    THIRD_PARTY_LEAKS = "3rd Party leaks",
    ATTACK_SURFACES = "Attack Surfaces",
}

export enum ReportsAttackVector {
    EMAIL = "Email",
    NETWORK_PORTS = "Network Ports",
    SOCIAL_ENGINEERING = "Social Engineering",
    APPLICATIONS = "Applications",
    REMOVABLE_MEDIA = "Removable Media",
}

export enum ReportsBusinessUnit {
    HO_DR = "HO/DR",
    CWC = "CWC",
    RAMAT = "RAMAT",
    EFS = "EFS",
    ETS = "ETS",
    ALRASHED_FOOD = "Alrashed Food",
    ALRASHED_TIRES = "Alrashed Tires",
    JANA_MARINE_TANAJIB = "Jana Marine / Tanajib",
    INDUSTRIALS_STEEL_FAST = "Industrials (Steel, Fast)",
    ALRASHED_WOOD = "Alrashed Wood",
    ADMIRALS = "Admirals",
    YAUMI = "YAUMI",
    BMD = "BMD",
    SAUDI_FILTER = "Saudi Filter",
    CEMENT = "cement",
    INSUWRAP = "Insuwrap",
    EFS_ETS = "EFS/ETS", // Note: EFS and ETS also exist separately, clarify if this combined one is distinct
    UBMKSA = "Ubmksa",
    POLYSTYRENE = "Polystyrene",
}

export interface ReportsThreatCompositionOverview {
    _id: string;
    month: string;
    year: string;
    severityLevel: ReportsSeverityLevel;
    threatType: ReportsThreatType;
    attackVector: ReportsAttackVector;
    bu: ReportsBusinessUnit;
    affectedAsset: string;
    incidentCount: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateReportsThreatCompositionOverviewDto {
    month: string;
    year: string;
    severityLevel: ReportsSeverityLevel;
    threatType: ReportsThreatType;
    attackVector: ReportsAttackVector;
    bu: ReportsBusinessUnit;
    affectedAsset: string;
    incidentCount: number;
}

export interface UpdateReportsThreatCompositionOverviewDto {
    month?: string;
    year?: string;
    severityLevel?: ReportsSeverityLevel;
    threatType?: ReportsThreatType;
    attackVector?: ReportsAttackVector;
    bu?: ReportsBusinessUnit;
    affectedAsset?: string;
    incidentCount?: number;
}

export interface ReportsThreatCompositionOverviewQueryParams {
    month?: string;
    year?: string;
    severityLevel?: ReportsSeverityLevel;
    threatType?: ReportsThreatType;
    attackVector?: ReportsAttackVector;
    bu?: ReportsBusinessUnit;
    page?: number;
    limit?: number;
}

// Add other report-specific types below this line
