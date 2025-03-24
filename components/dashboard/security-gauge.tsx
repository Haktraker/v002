"use client"

import { Card, CardContent } from "@/components/ui/card"
import ApexChart from "@/components/ui/apex-chart"
import { Skeleton } from "@/components/ui/skeleton"

interface SecurityGaugeProps {
  value: number
  isLoading?: boolean
}

export function SecurityGauge({ value, isLoading = false }: SecurityGaugeProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-[200px] w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 mx-auto" />
              <Skeleton className="h-6 w-32 mx-auto" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Color spectrum: red -> orange -> yellow -> green
  const colorScale = [
    "#FF0000", // 0-25: Red (F)
    "#FF4500", // 25-50: Orange (D)
    "#FFA500", // 50-60: Orange-Yellow (C)
    "#FFFF00", // 60-70: Yellow (C+/B-)
    "#9ACD32", // 70-80: Yellow-Green (B)
    "#00FF00", // 80-90: Light Green (A-)
    "#008000", // 90-100: Dark Green (A+)
  ]

  // Determine color based on value
  const getColor = (value: number) => {
    if (value < 25) return colorScale[0]
    if (value < 50) return colorScale[1]
    if (value < 60) return colorScale[2]
    if (value < 70) return colorScale[3]
    if (value < 80) return colorScale[4]
    if (value < 90) return colorScale[5]
    return colorScale[6]
  }

  // Get grade based on value
  const getGrade = (value: number) => {
    if (value < 25) return "F"
    if (value < 50) return "D"
    if (value < 60) return "C"
    if (value < 70) return "C+"
    if (value < 80) return "B"
    if (value < 90) return "A-"
    return "A+"
  }

  const scoreColor = getColor(value)
  const grade = getGrade(value)

  // ApexCharts options for radial gauge
  const options = {
    chart: {
      type: 'radialBar',
      offsetY: -20,
      sparkline: {
        enabled: true
      },
      background: 'transparent',
    },
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        track: {
          background: "rgba(255,255,255,0.1)",
          strokeWidth: '97%',
          margin: 5,
        },
        dataLabels: {
          name: {
            show: false
          },
          value: {
            offsetY: -2,
            fontSize: '22px',
            color: scoreColor,
            formatter: function (val: number) {
              return val.toFixed(0)
            }
          }
        }
      }
    },
    grid: {
      padding: {
        top: -10
      }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        shadeIntensity: 0.4,
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 50, 100],
        colorStops: [
          {
            offset: 0,
            color: scoreColor,
            opacity: 1
          },
          {
            offset: 100,
            color: scoreColor,
            opacity: 1
          }
        ]
      },
    },
    stroke: {
      lineCap: 'round'
    },
    labels: ['Security Score'],
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center">
          <ApexChart
            type="radialBar"
            height={200}
            options={options}
            series={[value]}
          />
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">Security Grade</p>
            <h3 className="text-2xl font-bold" style={{ color: scoreColor }}>{grade}</h3>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}