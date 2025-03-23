// This is a mock service that simulates fetching data from an API
// In a real application, this would make actual API calls

// Types for our data
export interface CompromisedEmployee {
  id: string
  email: string
  attacks: number
}

export interface SourceData {
  name: string
  value: number
}

export interface EmployeeGroup {
  name: string
  value: number
  color: string
}

export interface MetricData {
  name: string
  value: number
  color: string
}

// Mock data
const mockCompromisedEmployees: CompromisedEmployee[] = [
  { id: "1", email: "ben@example.com", attacks: 350 },
  { id: "2", email: "jen@example.com", attacks: 200 },
  { id: "3", email: "sam@example.com", attacks: 150 },
  { id: "4", email: "kim@example.com", attacks: 150 },
  { id: "5", email: "alex@example.com", attacks: 50 },
]

const mockSourcesData: SourceData[] = [
  { name: "Source 1", value: 45 },
  { name: "Source 2", value: 25 },
  { name: "Source 3", value: 75 },
  { name: "Source 4", value: 65 },
]

const mockEmployeesData: EmployeeGroup[] = [
  { name: "IT", value: 35, color: "#06B6D4" }, // Cyan
  { name: "Marketing", value: 25, color: "#8A2CE2" }, // Purple
  { name: "Operations", value: 30, color: "#22C55E" }, // Green
  { name: "Sales", value: 10, color: "#F97316" }, // Orange
]

const mockMetricsData: MetricData[] = [
  { name: "Threats", value: 1000, color: "#8A2CE2" },
  { name: "Emails", value: 234, color: "#06B6D4" },
  { name: "Customers", value: 240, color: "#22C55E" },
  { name: "Passwords", value: 240, color: "#F97316" },
  { name: "Devices", value: 234, color: "#EF4444" },
]

// Simulated API calls with delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const DashboardService = {
  async getSecurityScore(): Promise<number> {
    await delay(500)
    return 94
  },

  async getCompromisedEmployees(): Promise<CompromisedEmployee[]> {
    await delay(700)
    return [...mockCompromisedEmployees]
  },

  async getSourcesData(): Promise<SourceData[]> {
    await delay(600)
    return [...mockSourcesData]
  },

  async getEmployeesData(): Promise<EmployeeGroup[]> {
    await delay(800)
    return [...mockEmployeesData]
  },

  async getMetricsData(): Promise<MetricData[]> {
    await delay(500)
    return [...mockMetricsData]
  },
}

