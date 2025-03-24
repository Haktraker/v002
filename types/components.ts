import { ChartDataPoint, Employee, SecurityMetric } from './dashboard'

export interface MetricsCardProps {
  metric: SecurityMetric
  label?: string
  iconColor?: string
  variant?: 'default' | 'minimal'
}

export interface MentionsOverviewProps {
  totalMentions: number
  negativeMentions: number
  positiveMentions: number
  neutralMentions: number
}

export interface EmployeeData {
  name: string
  value: number
  color: string
}

export interface CompromisedEmployeesProps {
  employees: Employee[]
}

export interface StatusData {
  name: string
  value: number
  color: string
}

export interface StatusDonutProps {
  title: string
  data: StatusData[]
  total?: number
}

export interface MalwareDataPoint {
  date: string
  value: number
}

export interface TopMalwareProps {
  data: MalwareDataPoint[]
}
