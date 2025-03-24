export interface SecurityMetric {
  score: number
  grade: string
  trend: 'up' | 'down' | 'stable'
  changePercentage: number
}

export interface Employee {
  id: string
  name: string
  email: string
  department: string
  attackCount: number
  riskLevel?: 'high' | 'medium' | 'low'
  lastIncident?: string
}

export interface ChartDataPoint {
  name: string
  value: number
  color: string
}

export interface MalwareDataPoint {
  name: string
  value: number
  trend: 'up' | 'down' | 'stable'
}

export interface StatusData {
  name: string
  value: number
  color: string
}

export interface DashboardData {
  securityScore: number
  securityGrade: string
  activeThreats: number
  threatChange: number
  compromisedAssets: number
  assetChange: number
  employeesData: ChartDataPoint[]
  compromisedEmployees: Employee[]
  sourcesData: ChartDataPoint[]
  statusData: StatusData[]
  mentionsData: ChartDataPoint[]
  malwareData: MalwareDataPoint[]
}

export type TimeRange = '24h' | '7d' | '30d'
