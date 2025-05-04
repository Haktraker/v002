export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalAssets?: number;
      totalDetections?: number;
      limit: number;
    };
  }

// ================= Security Posture Score Types =================

export interface SecurityPostureScore {
    _id: string;
    percentage: string;
    score: string;
    year: string;
    month: string;
    quarter: number;
    createdAt?: string; // From timestamps: true
    updatedAt?: string; // From timestamps: true
  }
  
  export interface CreateSecurityPostureScoreDto {
    percentage: string;
    score: string;
    year: string;
    month: string;
    quarter: number;
  }
  
  export interface UpdateSecurityPostureScoreDto {
    percentage?: string;
    score?: string;
    year?: string;
    month?: string;
    quarter?: number;
  }
  
  export interface SecurityPostureScoreQueryParams {
    month?: string;
    year?: string;
    quarter?: number;
    page?: number;
    limit?: number;
  }
  
// ================= Threat Composition Overview Types =================

export type ThreatCompositionOverviewType = 
  | "ATO"
  | "Insider Threats"
  | "Trojan and Malware"
  | "3rd Party leaks"
  | "Attack Surfaces";

export interface ThreatCompositionOverview {
  _id: string;
  month: string;
  year: string;
  score: string; // Consider number if score is numeric
  threatType: ThreatCompositionOverviewType;
  quarter: number;
  createdAt?: string; // From timestamps: true
  updatedAt?: string; // From timestamps: true
}

export interface CreateThreatCompositionOverviewDto {
  month: string;
  year: string;
  score: string;
  threatType: ThreatCompositionOverviewType;
  quarter: number;
}

export interface UpdateThreatCompositionOverviewDto {
  month?: string;
  year?: string;
  score?: string;
  threatType?: ThreatCompositionOverviewType;
  quarter?: number;
}

export interface ThreatCompositionOverviewQueryParams {
  month?: string;
  year?: string;
  threatType?: ThreatCompositionOverviewType;
  quarter?: number;
  page?: number;
  limit?: number;
}

// ================= Security Breach Indicators Types =================

export type SecurityBreachIndicatorType = 
  | "Compromised Employees"
  | "Account Take Over"
  | "3rd Party Leaked Credentials"
  | "Brand Reputation";

export interface SecurityBreachIndicators {
  _id: string;
  month: string;
  year: string;
  quarter: number;
  score: string; // Consider number if score is numeric
  indicator: SecurityBreachIndicatorType;
  createdAt?: string; // From timestamps: true
  updatedAt?: string; // From timestamps: true
}

export interface CreateSecurityBreachIndicatorsDto {
  month: string;
  year: string;
  quarter: number;
  score: string;
  indicator: SecurityBreachIndicatorType;
}

export interface UpdateSecurityBreachIndicatorsDto {
  month?: string;
  year?: string;
  quarter?: number;
  score?: string;
  indicator?: SecurityBreachIndicatorType;
}

export interface SecurityBreachIndicatorsQueryParams {
  month?: string;
  year?: string;
  indicator?: SecurityBreachIndicatorType;
  quarter?: number;
  page?: number;
  limit?: number;
}

// ================= Non-Compliance Gaps Overview Types =================

export type ComplianceFrameworkType = 
  | "MITRE ATT&CK"
  | "ISO 27001"
  | "NIST CSF"
  | "PDPL"
  | "CIS";

export interface NonComplianceGapsOverview {
  _id: string;
  month: string;
  year: string;
  quarter: number;
  score: string; // Consider number if score is numeric
  compliance: ComplianceFrameworkType;
  createdAt?: string; // From timestamps: true
  updatedAt?: string; // From timestamps: true
}

export interface CreateNonComplianceGapsOverviewDto {
  month: string;
  year: string;
  quarter: number;
  score: string;
  compliance: ComplianceFrameworkType;
}

export interface UpdateNonComplianceGapsOverviewDto {
  month?: string;
  year?: string;
  quarter?: number;
  score?: string;
  compliance?: ComplianceFrameworkType;
}

export interface NonComplianceGapsOverviewQueryParams {
  month?: string;
  year?: string;
  compliance?: ComplianceFrameworkType;
  quarter?: number;
  page?: number;
  limit?: number;
}

// ================= Incident and Alert Volume Types =================

export interface IncidentAndAlertVolume {
  _id: string;
  month: string; // Should be unique per the schema, handled by backend
  year: string;
  quarter: number;
  score: string; // Represents volume, consider number if applicable
  createdAt?: string; // From timestamps: true
  updatedAt?: string; // From timestamps: true
}

export interface CreateIncidentAndAlertVolumeDto {
  month: string;
  year: string;
  quarter: number;
  score: string;
}

export interface UpdateIncidentAndAlertVolumeDto {
  month?: string;
  year?: string;
  quarter?: number;
  score?: string;
}

export interface IncidentAndAlertVolumeQueryParams {
  month?: string;
  year?: string;
  quarter?: number;
  page?: number;
  limit?: number;
}
  
  