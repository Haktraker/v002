"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "next-themes"
import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

const ApexChart = dynamic(() => import("@/components/ui/apex-chart"), { ssr: false })

interface EmployeeData {
  name: string
  value: number
  color: string
}

interface EmployeesDonutChartProps {
  data: EmployeeData[]
  isLoading?: boolean
}

export function EmployeesDonutChart({ data, isLoading = false }: EmployeesDonutChartProps) {
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
            <Skeleton className="h-[200px] w-full rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 mx-auto" />
              <Skeleton className="h-4 w-32 mx-auto" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const series = data.map(item => item.value)
  const total = series.reduce((sum, val) => sum + val, 0)

  const options = {
    chart: {
      type: 'donut',
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
    colors: [
      '#10B981', // Active - Emerald
      '#F59E0B', // At Risk - Amber
      '#EF4444', // Compromised - Red
      '#6B7280'  // Inactive - Gray
    ],
    labels: data.map(item => item.name),
    stroke: {
      width: 0
    },
    plotOptions: {
      pie: {
        donut: {
          size: '75%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '14px',
              fontFamily: 'inherit',
              color: isDark ? '#e5e7eb' : '#374151'
            },
            value: {
              show: true,
              fontSize: '16px',
              fontFamily: 'inherit',
              color: isDark ? '#e5e7eb' : '#374151',
              formatter: function(val: any) {
                const numVal = Number(val);
                return isNaN(numVal) ? '0' : numVal.toFixed(0);
              }
            },
            total: {
              show: true,
              label: 'Total',
              fontSize: '14px',
              fontFamily: 'inherit',
              color: isDark ? '#e5e7eb' : '#374151'
            }
          }
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    legend: {
      show: true,
      position: 'bottom',
      fontSize: '14px',
      fontFamily: 'inherit',
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
          return Math.round(val).toString()
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
    <Card className={isDark ? "bg-[#171727] border-0" : "bg-white"}>
      <CardHeader>
        <CardTitle className={isDark ? "text-white" : "text-gray-900"}>Employee Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ApexChart
            type="donut"
            height="100%"
            options={options}
            series={series}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className={isDark ? "text-sm text-gray-400" : "text-sm text-gray-600"}>{item.name}</span>
              <span className={isDark ? "text-sm text-white font-medium ml-auto" : "text-sm text-gray-900 font-medium ml-auto"}>{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
