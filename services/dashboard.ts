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
      securityScore: 85,
      securityGrade: "B+",
      activeThreats: 24,
      threatChange: 5,
      compromisedAssets: 12,
      assetChange: -3,
      employeesData: [
        { name: "High Risk", value: 24, color: "#FF5050" },
        { name: "Medium Risk", value: 38, color: "#FFBB28" },
        { name: "Low Risk", value: 86, color: "#4CAF50" },
        { name: "No Risk", value: 42, color: "#607D8B" },
      ],
      compromisedEmployees: [
        { id: "1", name: "John Smith", email: "john.smith@company.com", department: "Engineering", attackCount: 2435, riskLevel: "high", lastIncident: "2024-03-23" },
        { id: "2", name: "Emma Johnson", email: "emma.j@company.com", department: "C-Suite", attackCount: 1325, riskLevel: "medium", lastIncident: "2024-03-22" },
        { id: "3", name: "Michael Brown", email: "m.brown@company.com", department: "Operations", attackCount: 735, riskLevel: "low", lastIncident: "2024-03-21" },
      ],
      sourcesData: [
        { name: "Phishing", value: 40, color: "#FF5050" },
        { name: "Malware", value: 68, color: "#FFBB28" },
        { name: "Access", value: 45, color: "#4CAF50" },
        { name: "Breach", value: 55, color: "#607D8B" },
      ],
      statusData: [
        { name: "Normal", value: 2145, color: "#4CAF50" },
        { name: "Warning", value: 567, color: "#FFBB28" },
        { name: "Error", value: 235, color: "#FF5050" },
        { name: "Unknown", value: 87, color: "#607D8B" },
      ],
      mentionsData: [
        { name: "Negative", value: 30, color: "#FF5050" },
        { name: "Neutral", value: 30, color: "#607D8B" },
        { name: "Positive", value: 60, color: "#4CAF50" },
      ],
      malwareData: [
        { name: "Ransomware", value: 45, trend: "up" },
        { name: "Trojan", value: 32, trend: "down" },
        { name: "Spyware", value: 28, trend: "stable" },
        { name: "Adware", value: 22, trend: "down" },
        { name: "Worm", value: 18, trend: "up" },
      ]
    }
  }
}

export const dashboardService = DashboardService.getInstance()
