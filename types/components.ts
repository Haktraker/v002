import { ChartDataPoint, Employee, MalwareDataPoint as DashboardMalwareDataPoint } from './dashboard'

export interface SecurityGaugeProps {
  value: number
  isLoading?: boolean
}

export interface MetricsCardProps {
  title: string
  value: number
  change: number
  isLoading?: boolean
}

export interface MentionsOverviewProps {
  data: ChartDataPoint[]
  isLoading?: boolean
}

export interface EmployeeData {
  name: string
  value: number
  color: string
}

export interface EmployeesDonutChartProps {
  data: EmployeeData[]
  isLoading?: boolean
}

export interface CompromisedEmployeesProps {
  data: Employee[]
  isLoading?: boolean
}

export interface StatusData {
  name: string
  value: number
  color: string
}

export interface StatusDonutProps {
  data: StatusData[]
  isLoading?: boolean
}

export interface SourcesBarChartProps {
  data: ChartDataPoint[]
  isLoading?: boolean
}

export type MalwareDataPoint = DashboardMalwareDataPoint

export interface TopMalwareProps {
  data: MalwareDataPoint[]
  isLoading?: boolean
}
