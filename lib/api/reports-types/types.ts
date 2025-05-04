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

// Add other report-specific types below this line
