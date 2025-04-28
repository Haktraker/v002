export interface BusinessUnitPerformance {
  businessUnitName: string;
  rate: number;
}

export interface SocTeam {
  teamName: string;
  rate: number;
  bu: BusinessUnitPerformance[];
}

export interface SocTeamPerformance {
  year: number;
  month: number;
  socTeam: SocTeam[];
} 