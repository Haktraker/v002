import { useState, useEffect } from 'react'
import { DashboardData, TimeRange } from '@/types/dashboard'
import { dashboardService } from '@/services/dashboard'

export function useDashboard(initialTimeRange: TimeRange = '24h') {
  const [timeRange, setTimeRange] = useState<TimeRange>(initialTimeRange)
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const newData = await dashboardService.fetchDashboardData(timeRange)
      setData(newData)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch dashboard data'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [timeRange])

  return {
    data,
    isLoading,
    error,
    timeRange,
    setTimeRange,
    refresh: fetchData
  }
}
