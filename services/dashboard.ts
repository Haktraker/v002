import { DashboardData, TimeRange } from '@/types/dashboard'

class DashboardService {
  private static instance: DashboardService
  private cache: Map<string, { data: DashboardData; timestamp: number }> = new Map()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  public static getInstance(): DashboardService {
    if (!DashboardService.instance) {
      DashboardService.instance = new DashboardService()
    }
    return DashboardService.instance
  }

  async fetchDashboardData(timeRange: TimeRange): Promise<DashboardData> {
    const cacheKey = `dashboard_${timeRange}`
    const cached = this.cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data
    }

    // TODO: Replace with actual API call
    const data = await this.getMockData(timeRange)
    this.cache.set(cacheKey, { data, timestamp: Date.now() })
    return data
  }

  private async getMockData(timeRange: TimeRange): Promise<DashboardData> {
    // Simulated API delay
    await new Promise(resolve => setTimeout(resolve, 800))

    return {
      securityMetrics: {
        score: 58,
        grade: "C",
        trend: "up",
        changePercentage: 5.2
      },
      employeesData: [
        { name: "New", value: 24, color: "#4CAF50" },
        { name: "Pending", value: 38, color: "#00BCD4" },
        { name: "Resolved", value: 86, color: "#9C27B0" },
        { name: "False Positive", value: 42, color: "#FF5050" },
      ],
      compromisedEmployees: [
        { id: "1", name: "John Smith", email: "john.smith@company.com", department: "Engineering", attackCount: 2435, riskLevel: "high", lastIncident: "2024-03-23" },
        { id: "2", name: "Emma Johnson", email: "emma.j@company.com", department: "C-Suite", attackCount: 1325, riskLevel: "medium", lastIncident: "2024-03-22" },
        { id: "3", name: "Michael Brown", email: "m.brown@company.com", department: "Operations", attackCount: 735, riskLevel: "low", lastIncident: "2024-03-21" },
      ],
      sourcesData: [
        { name: "Phishing Attempts", value: 40 },
        { name: "Malware Detected", value: 68 },
        { name: "Unauthorized Access", value: 45 },
        { name: "Data Breaches", value: 55 },
      ],
      logsData: [
        { name: "Normal", value: 2145, color: "#4CAF50" },
        { name: "Warning", value: 567, color: "#FFBB28" },
        { name: "Error", value: 235, color: "#FF5050" },
        { name: "Unknown", value: 87, color: "#607D8B" },
      ],
      findingsData: [
        { name: "Critical", value: 12, color: "#FF5050" },
        { name: "High", value: 28, color: "#FF9800" },
        { name: "Medium", value: 45, color: "#FFEB3B" },
        { name: "Low", value: 89, color: "#4CAF50" },
      ],
      malwareData: {
        dates: ["Jan", "Feb", "Mar", "Apr", "May"],
        values: [30, 40, 35, 50, 49]
      }
    }
  }
}

export const dashboardService = DashboardService.getInstance()
