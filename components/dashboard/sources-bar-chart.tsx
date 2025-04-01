"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "next-themes"
import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

const ApexChart = dynamic(() => import("@/components/ui/apex-chart"), { ssr: false })

interface ChartDataPoint {
  name: string
  value: number
  color?: string
}

interface SourcesBarChartProps {
  data: ChartDataPoint[]
  isLoading?: boolean
}

export function SourcesBarChart({ data, isLoading = false }: SourcesBarChartProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-[200px] w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Sort data in descending order
  const sortedData = [...data].sort((a, b) => b.value - a.value)
  
  // Default colors
  const colors = [
    "#845EFF", // Purple
    "#FF9500", // Orange
    "#FF5050", // Red
    "#FFCC00", // Yellow
    "#4CAF50", // Green
  ]
  
  const dataWithColors = sortedData.map((item, index) => ({
    ...item,
    color: item.color || colors[index % colors.length],
  }))
  
  const series = [{
    name: 'Count',
    data: dataWithColors.map(item => item.value)
  }]
  
  const options = {
    chart: {
      type: 'bar',
      background: 'transparent',
      toolbar: {
        show: false
      },
      animations: {
        enabled: true,
        speed: 500,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '40%',
        borderRadius: 4,
        distributed: true
      }
    },
    colors: dataWithColors.map(item => item.color),
    dataLabels: {
      enabled: false
    },
    legend: {
      show: false
    },
    grid: {
      show: true,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
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
    xaxis: {
      categories: dataWithColors.map(item => item.name),
      labels: {
        style: {
          colors: isDark ? '#fff' : '#374151',
          fontSize: '12px'
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
          colors: isDark ? '#e5e7eb' : '#374151',
          fontSize: '12px'
        },
        formatter: function(val: number) {
          return Math.round(val).toString()
        }
      }
    },
    tooltip: {
      enabled: true,
      theme: isDark ? 'dark' : 'light',
      y: {
        formatter: function(val: number) {
          return Math.round(val).toString()
        }
      }
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          height: 300
        }
      }
    }]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sources Overview</CardTitle>
      </CardHeader>
      <CardContent>
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
