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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Tabs defaultValue={timeRange} className="w-full sm:w-auto">
          <TabsList className="grid w-full sm:w-auto grid-cols-3">
            <TabsTrigger value="24h" onClick={() => setTimeRange("24h" as TimeRange)}>24h</TabsTrigger>
            <TabsTrigger value="7d" onClick={() => setTimeRange("7d" as TimeRange)}>7d</TabsTrigger>
            <TabsTrigger value="30d" onClick={() => setTimeRange("30d" as TimeRange)}>30d</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Widget
          </Button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Row 1 */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4">
          <SecurityGauge value={data?.securityScore ?? 0} isLoading={isLoading} />
        </div>

        {/* Row 2 */}
        <div className="col-span-1">
          <IPsCard />
        </div>
        <div className="col-span-1">
          <MetricsCard
            title="Active Threats"
            value={data?.activeThreats ?? 0}
            change={data?.threatChange ?? 0}
            isLoading={isLoading}
          />
        </div>
        <div className="col-span-1">
          <MetricsCard
            title="Compromised Assets"
            value={data?.compromisedAssets ?? 0}
            change={data?.assetChange ?? 0}
            isLoading={isLoading}
          />
        </div>
        <div className="col-span-1">
          <StatusDonut data={data?.statusData ?? []} isLoading={isLoading} />
        </div>

        {/* Row 3 */}
        <div className="col-span-1 md:col-span-2">
          <MentionsOverview data={data?.mentionsData ?? []} isLoading={isLoading} />
        </div>
        <div className="col-span-1 md:col-span-2">
          <SourcesBarChart data={data?.sourcesData ?? []} isLoading={isLoading} />
        </div>

        {/* Row 4 */}
        <div className="col-span-1 md:col-span-2">
          <EmployeesDonutChart data={data?.employeesData ?? []} isLoading={isLoading} />
        </div>
        <div className="col-span-1 md:col-span-2">
          <TopMalware data={data?.malwareData ?? []} isLoading={isLoading} />
        </div>

        {/* Row 5 */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4">
          <CompromisedEmployees data={data?.compromisedEmployees ?? []} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}
