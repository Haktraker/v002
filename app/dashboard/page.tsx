"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle } from "lucide-react"

// Import all components via relative paths to fix TypeScript issues
import { SecurityGauge } from "../../components/dashboard/security-gauge"
import { MetricsCard } from "../../components/dashboard/metrics-card"
import { MentionsOverview } from "../../components/dashboard/mentions-overview"
import { EmployeesDonutChart } from "../../components/dashboard/employees-donut-chart" 
import { CompromisedEmployees } from "../../components/dashboard/compromised-employees"
import { SourcesBarChart } from "../../components/dashboard/sources-bar-chart"
import { StatusDonut } from "../../components/dashboard/status-donut"
import { TopMalware } from "../../components/dashboard/top-malware"

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<"quarter" | "month" | "week" | "custom">("month")

  // Sample data for demonstration
  const securityScore = 58
  const securityGrade = "C"
  
  const employeesData = [
    { name: "New", value: 24, color: "#4CAF50" },
    { name: "Pending", value: 38, color: "#00BCD4" },
    { name: "Resolved", value: 86, color: "#9C27B0" },
    { name: "False Positive", value: 42, color: "#FF5050" },
  ]
  
  const compromisedEmployees = [
    { id: "1", name: "John Smith", email: "bentayson@gmail.com", department: "Engineering", attackCount: 2435 },
    { id: "2", name: "Emma Johnson", email: "bentayson@gmail.com", department: "C-Suite", attackCount: 1325 },
    { id: "3", name: "Michael Brown", email: "bentayson@gmail.com", department: "Operations", attackCount: 735 },
    { id: "4", name: "Sarah Williams", email: "bentayson@gmail.com", department: "Engineering", attackCount: 580 },
    { id: "5", name: "Robert Wilson", email: "bentayson@gmail.com", department: "Management", attackCount: 428 },
  ]
  
  const sourcesData = [
    { name: "Source 1", value: 40 },
    { name: "Source 2", value: 68 },
    { name: "Source 3", value: 45 },
    { name: "Source 4", value: 55 },
  ]
  
  const logsData = [
    { name: "Normal", value: 2145, color: "#4CAF50" },
    { name: "Warning", value: 567, color: "#FFBB28" },
    { name: "Error", value: 235, color: "#FF5050" },
    { name: "Unknown", value: 87, color: "#607D8B" },
  ]
  
  const findingsData = [
    { name: "Low", value: 58, color: "#4CAF50" },
    { name: "Medium", value: 32, color: "#FFBB28" },
    { name: "High", value: 14, color: "#FF5050" },
    { name: "Critical", value: 6, color: "#9C27B0" },
  ]
  
  const malwareData = [
    { date: "Jan", "Type 1": 1000, "Type 2": 1200, "Type 3": 1300 },
    { date: "Feb", "Type 1": 1200, "Type 2": 1100, "Type 3": 1400 },
    { date: "Mar", "Type 1": 800, "Type 2": 1500, "Type 3": 1300 },
    { date: "Apr", "Type 1": 1500, "Type 2": 1250, "Type 3": 1700 },
    { date: "May", "Type 1": 1800, "Type 2": 1600, "Type 3": 2000 },
    { date: "Jun", "Type 1": 1700, "Type 2": 1400, "Type 3": 1800 },
  ]

  return (
    <div className="dashboard-section">
      {/* Main Dashboard */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold tracking-tight dashboard-text-primary">Main Dashboard</h1>
        </div>
        <div className="flex items-center mt-4 sm:mt-0">
          <Tabs value={timeRange} onValueChange={(value: any) => setTimeRange(value)} className="mr-4">
            <TabsList className="bg-[hsl(var(--muted))]">
              <TabsTrigger value="quarter" className="data-[state=active]:bg-primary data-[state=active]:text-white">Quarter</TabsTrigger>
              <TabsTrigger value="month" className="data-[state=active]:bg-primary data-[state=active]:text-white">Month</TabsTrigger>
              <TabsTrigger value="week" className="data-[state=active]:bg-primary data-[state=active]:text-white">Week</TabsTrigger>
              <TabsTrigger value="custom" className="data-[state=active]:bg-primary data-[state=active]:text-white">Custom</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button className="bg-primary text-white hover:bg-primary/90">
            <PlusCircle className="h-4 w-4 mr-2" /> Add Dashboard
          </Button>
        </div>
      </div>

      {/* First row - Overview section */}
      <div className="dashboard-grid mb-6">
        {/* Security Overview - First Column */}
        <div className="md:col-span-1">
          <h2 className="text-xl font-semibold mb-3 dashboard-text-primary">Security Overview</h2>
          <SecurityGauge score={securityScore} grade={securityGrade} />
        </div>

        {/* Metrics Overview - Second and Third Column */}
        <div className="md:col-span-3">
          <h2 className="text-xl font-semibold mb-3 dashboard-text-primary">Overview</h2>
          <div className="grid grid-cols-2 gap-4">
            <MetricsCard
              value={120}
              label="New"
              trend="up"
              trendValue={80}
              trendLabel="More than last month"
              iconColor="text-primary"
            />
            <MetricsCard
              value={30}
              label="Pending"
              trend="up"
              trendValue={80}
              trendLabel="More than last month"
              iconColor="text-cyan-400"
            />
            <MetricsCard
              value={12}
              label="Resolved"
              trend="neutral"
              trendLabel="No Change"
              iconColor="text-primary"
            />
            <MetricsCard
              value={16}
              label="False Positive"
              trend="down"
              trendValue={80}
              trendLabel="less than last month"
              iconColor="text-red-500"
            />
          </div>
        </div>

        {/* Mentions Overview - Fourth Column */}
        <div className="md:col-span-2">
          <h2 className="text-xl font-semibold mb-3 dashboard-text-primary">Mentions Overview</h2>
          <MentionsOverview 
            totalMentions={120} 
            negativeMentions={30} 
            positiveMentions={60} 
            neutralMentions={30} 
          />
          <div className="space-y-3 mt-4">
            <MetricsCard
              value={120}
              label="Total Mentions"
              trend="up"
              trendValue={80}
              trendLabel="More than last month"
              iconColor="text-red-500"
              variant="minimal"
            />
            <MetricsCard
              value={120}
              label="Surface Web"
              trend="up"
              trendValue={80}
              trendLabel="More than last month"
              iconColor="text-red-500"
              variant="minimal"
            />
            <MetricsCard
              value={120}
              label="Dark Web"
              trend="up"
              trendValue={80}
              trendLabel="More than last month"
              iconColor="text-red-500"
              variant="minimal"
            />
          </div>
        </div>
      </div>

      {/* Second row - Employee and Sources section */}
      <div className="dashboard-grid-thirds mb-6">
        {/* Employees Donut Chart */}
        <div>
          <h2 className="text-xl font-semibold mb-3 dashboard-text-primary">Employees</h2>
          <EmployeesDonutChart data={employeesData} />
        </div>

        {/* Most Compromised Employees */}
        <div>
          <h2 className="text-xl font-semibold mb-3 dashboard-text-primary">Most Compromised Employees</h2>
          <CompromisedEmployees employees={compromisedEmployees} />
        </div>

        {/* Top Sources */}
        <div>
          <h2 className="text-xl font-semibold mb-3 dashboard-text-primary">Top Sources</h2>
          <SourcesBarChart data={sourcesData} />
        </div>
      </div>

      {/* Third row - Status and Logs section */}
      <div className="dashboard-grid-thirds">
        {/* Logs Status */}
        <div>
          <h2 className="text-xl font-semibold mb-3 dashboard-text-primary">Logs Status</h2>
          <StatusDonut 
            data={logsData} 
            title="Logs Status" 
            total={4930}
          />
        </div>

        {/* Findings */}
        <div>
          <h2 className="text-xl font-semibold mb-3 dashboard-text-primary">Findings</h2>
          <StatusDonut 
            data={findingsData} 
            title="Findings" 
          />
        </div>

        {/* Top Malware */}
        <div>
          <h2 className="text-xl font-semibold mb-3 dashboard-text-primary">Top Malware</h2>
          <TopMalware 
            data={malwareData} 
            malwareNames={["Type 1", "Type 2", "Type 3"]} 
          />
        </div>
      </div>
    </div>
  )
}

