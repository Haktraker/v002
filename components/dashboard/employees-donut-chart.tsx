"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "next-themes"
import dynamic from "next/dynamic"

const ApexChart = dynamic(() => import("@/components/ui/apex-chart"), { ssr: false })

interface EmployeeData {
  name: string
  value: number
  color: string
}

interface EmployeesDonutChartProps {
  data: EmployeeData[]
}

export function EmployeesDonutChart({ data }: EmployeesDonutChartProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const series = data.map(item => item.value)
  const colors = [
    "#4CAF50",  // New - Green
    "#00BCD4",  // Pending - Cyan
    "#9C27B0",  // Resolved - Purple
    "#FF5050",  // False Positive - Red
  ]

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
    colors: colors,
    labels: data.map(item => item.name),
    stroke: {
      width: 0
    },
    plotOptions: {
      pie: {
        donut: {
          size: '85%',
          background: 'transparent',
          labels: {
            show: false
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
      horizontalAlign: 'left',
      fontSize: '14px',
      fontFamily: 'Inter, sans-serif',
      labels: {
        colors: isDark ? '#fff' : '#1F2937'
      },
      markers: {
        width: 8,
        height: 8,
        radius: 12
      },
      itemMargin: {
        horizontal: 15,
        vertical: 8
      }
    },
    tooltip: {
      enabled: true,
      theme: isDark ? 'dark' : 'light',
      style: {
        fontSize: '14px',
        fontFamily: 'Inter, sans-serif'
      }
    },
    states: {
      hover: {
        filter: {
          type: 'darken',
          value: 0.8
        }
      }
    }
  }

  return (
    <Card className={isDark ? "bg-[#171727] border-0" : "bg-white"}>
      <CardHeader>
        <CardTitle className={isDark ? "text-white" : "text-gray-900"}>Employees</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ApexChart
            type="donut"
            options={options}
            series={series}
            height="100%"
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: colors[index] }}
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
