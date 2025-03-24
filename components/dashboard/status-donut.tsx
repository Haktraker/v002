"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "next-themes"
import dynamic from "next/dynamic"

const ApexChart = dynamic(() => import("@/components/ui/apex-chart"), { ssr: false })

interface StatusDonutProps {
  title: string
  data: Array<{
    name: string
    value: number
    color: string
  }>
  total?: number
}

export function StatusDonut({ title, data, total }: StatusDonutProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const series = data.map(d => d.value)
  const calculatedTotal = total || series.reduce((sum, val) => sum + val, 0)

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
    colors: data.map(d => d.color),
    labels: data.map(d => d.name),
    stroke: {
      width: 0
    },
    plotOptions: {
      pie: {
        donut: {
          size: '85%',
          background: 'transparent',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '14px',
              color: isDark ? '#fff' : '#1F2937',
              fontFamily: 'Inter, sans-serif',
              offsetY: -10
            },
            value: {
              show: true,
              fontSize: '24px',
              color: isDark ? '#fff' : '#1F2937',
              fontFamily: 'Inter, sans-serif',
              formatter: function(val: number) {
                return val.toLocaleString()
              }
            },
            total: {
              show: true,
              label: 'Total Logs',
              color: isDark ? '#fff' : '#1F2937',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              formatter: function() {
                return calculatedTotal.toLocaleString()
              }
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
        <CardTitle className={isDark ? "text-white" : "text-gray-900"}>{title}</CardTitle>
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
                style={{ backgroundColor: item.color }}
              />
              <span className={isDark ? "text-sm text-gray-400" : "text-sm text-gray-600"}>{item.name}</span>
              <span className={isDark ? "text-sm text-white font-medium ml-auto" : "text-sm text-gray-900 font-medium ml-auto"}>
                {item.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}