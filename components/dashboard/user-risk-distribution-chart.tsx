"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "next-themes"
import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

const ApexChart = dynamic(() => import("@/components/ui/apex-chart"), { ssr: false })

interface RiskDataPoint {
  businessUnit: string
  critical: number
  high: number
  medium: number
  low: number
}

interface UserRiskDistributionChartProps {
  data: RiskDataPoint[]
  isLoading?: boolean
  error: Error | null;
}

export function UserRiskDistributionChart({ data, isLoading = false }: UserRiskDistributionChartProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Risk Distribution</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  const series = [
    {
      name: 'Critical',
      data: data.map(item => item.critical),
      color: '#FF4444'
    },
    {
      name: 'High',
      data: data.map(item => item.high),
      color: '#FFA500'
    },
    {
      name: 'Medium',
      data: data.map(item => item.medium),
      color: '#FFD700'
    },
    {
      name: 'Low',
      data: data.map(item => item.low),
      color: '#4CAF50'
    }
  ]

  const options = {
    chart: {
      type: 'bar',
      stacked: true,
      background: 'transparent',
      toolbar: {
        show: false
      },
      animations: {
        enabled: true,
        speed: 500
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '50%',
        borderRadius: 4
      }
    },
    xaxis: {
      categories: data.map(item => item.businessUnit),
      labels: {
        style: {
          colors: isDark ? '#A1A1AA' : '#71717A'
        }
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: isDark ? '#A1A1AA' : '#71717A'
        }
      }
    },
    grid: {
      borderColor: isDark ? '#27272A' : '#E4E4E7',
      xaxis: {
        lines: {
          show: false
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      },
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      labels: {
        colors: isDark ? '#FFFFFF' : '#000000'
      }
    },
    dataLabels: {
      enabled: false
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Risk Distribution</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ApexChart
          type="bar"
          height={300}
          options={options}
          series={series}
        />
      </CardContent>
    </Card>
  )
}