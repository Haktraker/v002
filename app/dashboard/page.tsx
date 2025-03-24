"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, RefreshCw } from "lucide-react"

// Import components
import { SecurityGauge } from "../../components/dashboard/security-gauge"
import { MetricsCard } from "../../components/dashboard/metrics-card"
import { MentionsOverview } from "../../components/dashboard/mentions-overview"
import { EmployeesDonutChart } from "../../components/dashboard/employees-donut-chart" 
import { CompromisedEmployees } from "../../components/dashboard/compromised-employees"
import { SourcesBarChart } from "../../components/dashboard/sources-bar-chart"
import { StatusDonut } from "../../components/dashboard/status-donut"
import { TopMalware } from "../../components/dashboard/top-malware"
import { IPsCard } from "@/components/dashboard/ips-card"

// Import custom hook and types
import { useDashboard } from "@/hooks/useDashboard"
import { TimeRange } from "@/types/dashboard"
import { EmployeeData, MalwareDataPoint, StatusData } from "@/types/components"

export default function DashboardPage() {
  const {
    data,
    isLoading,
    error,
    timeRange,
    setTimeRange,
    refresh
  } = useDashboard()

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-500 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-500 mb-4">{error.message}</p>
          <Button onClick={refresh} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // Transform data to match component interfaces
  const employeesChartData: EmployeeData[] = data?.employeesData.map(d => ({
    ...d,
    color: d.color || '#808080' // Fallback color
  })) || []

  const logsChartData: StatusData[] = data?.logsData.map(d => ({
    ...d,
    color: d.color || '#808080'
  })) || []

  const findingsChartData: StatusData[] = data?.findingsData.map(d => ({
    ...d,
    color: d.color || '#808080'
  })) || []

  const malwareChartData: MalwareDataPoint[] = data?.malwareData.dates.map((date, i) => ({
    date,
    value: data.malwareData.values[i]
  })) || []

  const mentionsData = {
    totalMentions: 120,
    negativeMentions: 30,
    positiveMentions: 60,
    neutralMentions: 30
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
          <TabsList>
            <TabsTrigger value="week">Last Week</TabsTrigger>
            <TabsTrigger value="month">Last Month</TabsTrigger>
            <TabsTrigger value="quarter">Last Quarter</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2">
          <Button onClick={refresh} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Widget
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card h-64 rounded-lg" />
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SecurityGauge score={data.securityMetrics.score} grade={data.securityMetrics.grade} />
          <MetricsCard 
            metric={data.securityMetrics} 
            label="Security Score" 
            iconColor="text-primary" 
          />
          <MentionsOverview {...mentionsData} />
          <EmployeesDonutChart data={employeesChartData} />
          <CompromisedEmployees employees={data.compromisedEmployees} />
          <SourcesBarChart data={data.sourcesData} />
          <StatusDonut title="Logs Status" data={logsChartData} />
          <StatusDonut title="Findings Status" data={findingsChartData} />
          <TopMalware data={malwareChartData} />
          <IPsCard />
        </div>
      ) : null}
    </div>
  )
}
