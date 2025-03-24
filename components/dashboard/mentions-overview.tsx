"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "next-themes"
import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

const ApexChart = dynamic(() => import("@/components/ui/apex-chart"), { ssr: false })

interface ChartDataPoint {
  name: string
  value: number
}

interface MentionsOverviewProps {
  data: ChartDataPoint[]
  isLoading?: boolean
}

export function MentionsOverview({ data, isLoading = false }: MentionsOverviewProps) {
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
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const total = data.reduce((sum, item) => sum + item.value, 0)
  const series = data.map(item => Math.round((item.value / total) * 100))

  // Configure the ApexCharts options
  const options = {
    chart: {
      type: 'radialBar',
      background: 'transparent',
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
      radialBar: {
        startAngle: -180,
        endAngle: 0,
        hollow: {
          size: '65%',
        },
        track: {
          background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          strokeWidth: '97%',
        },
        dataLabels: {
          name: {
            show: true,
            fontSize: '14px',
            color: isDark ? '#e5e7eb' : '#374151',
            offsetY: -10
          },
          value: {
            show: true,
            fontSize: '16px',
            fontWeight: 600,
            color: isDark ? '#e5e7eb' : '#374151',
            formatter: function(val: number) {
              return val.toFixed(0) + '%'
            }
          }
        }
      }
    },
    colors: ['#FF5050', '#FFBB28', '#4CAF50'],
    labels: data.map(item => item.name),
    legend: {
      show: true,
      position: 'bottom',
      fontSize: '14px',
      labels: {
        colors: isDark ? '#e5e7eb' : '#374151'
      },
      markers: {
        width: 12,
        height: 12,
        radius: 6
      },
      itemMargin: {
        horizontal: 10,
        vertical: 5
      }
    },
    tooltip: {
      enabled: true,
      theme: isDark ? 'dark' : 'light',
      y: {
        formatter: function(val: number) {
          return val.toFixed(0) + '%'
        }
      }
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          height: 300
        },
        legend: {
          position: 'bottom'
        }
      }
    }]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mentions Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <ApexChart
          type="radialBar"
          height={300}
          options={options}
          series={series}
        />
        <div className="grid grid-cols-3 gap-4 mt-4">
          {data.map((item, index) => (
            <div key={index} className="text-center">
              <p className="text-sm text-muted-foreground">{item.name}</p>
              <p className="text-xl font-semibold mt-1">{item.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}