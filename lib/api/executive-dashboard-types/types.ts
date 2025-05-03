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
  
  