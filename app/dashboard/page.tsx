"use client"

import { useState, useEffect } from "react"
import { Eye, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock } from "@/components/dashboard/clock"
import { SecurityScoreGaugeRecharts } from "@/components/dashboard/security-score-gauge-recharts"
import { CompromisedEmployees } from "@/components/dashboard/compromised-employees"
import { SourcesBarChartRecharts } from "@/components/dashboard/sources-bar-chart-recharts"
import { EmployeesDonutChartRecharts } from "@/components/dashboard/employees-donut-chart-recharts"
import { MetricsChartRecharts } from "@/components/dashboard/metrics-chart-recharts"
import {
  DashboardService,
  type CompromisedEmployee,
  type SourceData,
  type EmployeeGroup,
  type MetricData,
} from "@/lib/data/dashboard-service"
import { toast } from "sonner"

export default function DashboardPage() {
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [isLoading, setIsLoading] = useState(true)

  // State for all our data
  const [securityScore, setSecurityScore] = useState(0)
  const [compromisedEmployees, setCompromisedEmployees] = useState<CompromisedEmployee[]>([])
  const [sourcesData, setSourcesData] = useState<SourceData[]>([])
  const [employeesData, setEmployeesData] = useState<EmployeeGroup[]>([])
  const [metricsData, setMetricsData] = useState<MetricData[]>([])

  // Function to fetch all data
  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      // Fetch all data in parallel
      const [score, employees, sources, empData, metrics] = await Promise.all([
        DashboardService.getSecurityScore(),
        DashboardService.getCompromisedEmployees(),
        DashboardService.getSourcesData(),
        DashboardService.getEmployeesData(),
        DashboardService.getMetricsData(),
      ])

      // Update state with fetched data
      setSecurityScore(score)
      setCompromisedEmployees(employees)
      setSourcesData(sources)
      setEmployeesData(empData)
      setMetricsData(metrics)

      // Update last updated timestamp
      setLastUpdated(new Date())

      toast.success("Dashboard data refreshed")
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast.error("Failed to refresh dashboard data")
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch data on initial load
  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleRefresh = () => {
    fetchDashboardData()
  }

  return (
    <div className="space-y-6 py-2">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Overview of your organization's security posture</p>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <div className="flex items-center">
            <Clock />
          </div>

          <Tabs defaultValue="all" className="w-[300px]">
            <TabsList className="grid grid-cols-2 h-9">
              <TabsTrigger value="all">All Organizations</TabsTrigger>
              <TabsTrigger value="custom">Custom View</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-9 bg-card/50 border-border">
              <Eye className="h-4 w-4 mr-2" />
              Data Range
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 bg-primary/10 border-primary text-foreground"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "Loading..." : "Get Dashboard"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Score */}
        <Card className="bg-card transition-colors duration-200">
          <CardHeader>
            <CardTitle>Organization Risk Score</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-6">
            <SecurityScoreGaugeRecharts score={securityScore} />
          </CardContent>
        </Card>

        {/* Most Compromised Employees */}
        <Card className="bg-card transition-colors duration-200">
          <CardHeader>
            <CardTitle>Most Compromised Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <CompromisedEmployees employees={compromisedEmployees} />
          </CardContent>
        </Card>

        {/* Top Sources */}
        <Card className="bg-card transition-colors duration-200">
          <CardHeader>
            <CardTitle>Top Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <SourcesBarChartRecharts data={sourcesData} />
          </CardContent>
        </Card>

        {/* Employees Chart */}
        <Card className="bg-card transition-colors duration-200">
          <CardHeader>
            <CardTitle>Employees</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-6">
            <EmployeesDonutChartRecharts data={employeesData} />
          </CardContent>
        </Card>

        {/* Recent Findings */}
        <Card className="bg-card transition-colors duration-200 lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Findings</CardTitle>
          </CardHeader>
          <CardContent>
            <MetricsChartRecharts data={metricsData} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

