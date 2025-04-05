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
import { ThreatIntelligenceCard } from "@/components/dashboard/threatIntelligenceCard"
import { PageContainer } from "@/components/layout/page-container"

// Import custom hook and types
import { useDashboard } from "@/hooks/useDashboard"
import { TimeRange } from "@/types/dashboard"
import { AssetsCard } from "@/components/dashboard/assetsCard"

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
    <PageContainer className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
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

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Security Overview Section */}
          <SectionWrapper>
            <SecurityOverview data={data} isLoading={isLoading} />
          </SectionWrapper>

          <SectionWrapper>
            <EmployeesDonutChart data={data?.employeesData ?? []} isLoading={isLoading} />
          </SectionWrapper>

          <SectionWrapper>
            <StatusDonut data={data?.statusData ?? []} isLoading={isLoading} />
          </SectionWrapper>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Mentions Overview Section */}
          <SectionWrapper>
            <MentionsOverview 
              data={[
                { type: 'Total Mentions', percentage: 62.2, count: 120, change: 80 },
                { type: 'Surface Web', percentage: 30, count: 120, change: 80 },
                { type: 'Dark Web', percentage: 54, count: 120, change: 80 }
              ]} 
              isLoading={isLoading} 
            />
          </SectionWrapper>

          {/* Most Compromised Employees Section */}
          <SectionWrapper>
            <CompromisedEmployees data={data?.compromisedEmployees ?? []} isLoading={isLoading} />
          </SectionWrapper>

          {/* Top Sources Section */}
          <SectionWrapper>
            <SourcesBarChart data={data?.sourcesData ?? []} isLoading={isLoading} />
          </SectionWrapper>

          {/* Top Malware Section */}
          <SectionWrapper>
            <TopMalware data={data?.topMalware ?? data?.malwareData ?? []} isLoading={isLoading} />
          </SectionWrapper>
        </div>
      </div>
    </PageContainer>
  )
}

function SectionWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-100 dark:bg-[#1e1e3d] rounded-lg p-4 shadow-SM">
      {children}
    </div>
  )
}

function SecurityOverview({ data, isLoading }: { data: any, isLoading: boolean }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Security Gauge - Left Side */}
      <div className="lg:col-span-5 flex items-center justify-center ">
        <SecurityGauge value={data?.securityScore ?? 0} isLoading={isLoading} />
      </div>
      {/* Metrics Grid - Right Side */}
      <div className="lg:col-span-7">
        <div className="grid grid-cols-2 gap-4">
          <AssetsCard />
          <ThreatIntelligenceCard/>
          <MetricCard title="Resolved" value={12} change={0} changeType="none" color="purple" />
          <MetricCard title="False Positive" value={16} change={-80} changeType="less" color="red" />
        </div>
      </div>
    </div>
  )
}

function MetricCard({ title, value, change, changeType, color }: { title: string, value: number, change: number, changeType: string, color: string }) {
  return (
    <div className="bg-gray-200 dark:bg-[#1e1e5d] rounded-lg">
      <div className="p-3">
        <div className="flex items-center">
          <div className={`bg-${color}-500 rounded-full w-4 h-4 mr-2`}></div>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
          <span className="ml-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 17L9 11L13 15L21 7" stroke="#FFA500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </div>
        <div className="mt-1">
          <p className={`text-sm text-${color}-600 dark:text-${color}-400`}>{title}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">{changeType === 'none' ? 'No Change' : `${change > 0 ? '+' : ''}${change} ${changeType === 'more' ? 'More' : 'less'} than last month`}</p>
        </div>
      </div>
    </div>
  )
}
