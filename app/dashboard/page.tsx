"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, RefreshCw } from "lucide-react"
import AOS from "aos"
import "aos/dist/aos.css"

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

  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      easing: 'ease-out-cubic'
    })
  }, [])

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
    <div className="space-y-4">
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

      {/* Dashboard Grid */}
      <div className="grid gap-4">
        {/* Top Row */}
          <div className=" grid md:grid-cols-1 xl:grid-cols-3 gap-4 bg-background rounded-lg gap-2">
            <SecurityGauge value={data?.securityScore ?? 0} isLoading={isLoading} />
            
          <div className="grid  md:grid-cols-1 gap-4 bg-background rounded-lg gap-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <IPsCard />
              <MetricsCard
                title="Pending"
                value={30}
                change={80}
                isLoading={isLoading}
              />
              <MetricsCard
                title="Resolved"
                value={12}
                change={0}
                isLoading={isLoading}
              />
              <MetricsCard
                title="False Positive"
                value={16}
                change={-50}
                isLoading={isLoading}
              />
            </div>
          </div>
          <div className="bg-background rounded-lg h-full">
            <MentionsOverview 
              data={[
                { type: 'Total Mentions', percentage: 62.2, count: 120, change: 80 },
                { type: 'Surface Web', percentage: 30, count: 120, change: 80 },
                { type: 'Dark Web', percentage: 54, count: 120, change: 80 }
              ]} 
              isLoading={isLoading} 
            />
          </div>
          </div>



        {/* Middle Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-background rounded-lg h-full">
            <EmployeesDonutChart data={data?.employeesData ?? []} isLoading={isLoading} />
          </div>

          <div className="bg-background rounded-lg h-full ">
            <CompromisedEmployees data={data?.compromisedEmployees ?? []} isLoading={isLoading} />
          </div>

          <div className="bg-background rounded-lg h-full">
            <SourcesBarChart data={data?.sourcesData ?? []} isLoading={isLoading} />
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-background rounded-lg h-full">
            <StatusDonut data={data?.statusData ?? []} isLoading={isLoading} />
          </div>

          <div className="bg-background rounded-lg h-full">
            <TopMalware data={data?.malwareData ?? []} isLoading={isLoading} />
          </div>

        </div>
      </div>
    </div>
  )
}
