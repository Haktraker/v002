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
  
  