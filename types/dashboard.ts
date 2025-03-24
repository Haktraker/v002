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
  color?: string
}

export interface DashboardData {
  securityMetrics: SecurityMetric
  employeesData: ChartDataPoint[]
  compromisedEmployees: Employee[]
  sourcesData: ChartDataPoint[]
  logsData: ChartDataPoint[]
  findingsData: ChartDataPoint[]
  malwareData: {
    dates: string[]
    values: number[]
  }
}

export type TimeRange = 'quarter' | 'month' | 'week' | 'custom'
