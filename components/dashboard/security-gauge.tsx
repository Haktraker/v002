"use client"

import { Card, CardContent } from "@/components/ui/card"
import ApexChart from "@/components/ui/apex-chart"

interface SecurityGaugeProps {
  score: number
  grade: string
}

export function SecurityGauge({ score, grade }: SecurityGaugeProps) {
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

  // Determine color based on score
  const getColor = (score: number) => {
    if (score < 25) return colorScale[0]
    if (score < 50) return colorScale[1]
    if (score < 60) return colorScale[2]
    if (score < 70) return colorScale[3]
    if (score < 80) return colorScale[4]
    if (score < 90) return colorScale[5]
    return colorScale[6]
  }

  const scoreColor = getColor(score)

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
          dropShadow: {
            enabled: false,
          }
        },
        dataLabels: {
          name: {
            show: false
          },
          value: {
            offsetY: -2,
            fontSize: '0px',
            color: scoreColor,
          }
        },
        hollow: {
          margin: 15,
          size: '65%'
        }
      }
    },
    colors: [scoreColor],
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'horizontal',
        shadeIntensity: 0.5,
        gradientToColors: [scoreColor],
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 100]
      }
    },
    stroke: {
      lineCap: 'round'
    },
  }

  const series = [score]

  return (
    <Card className="dashboard-card">
      <CardContent className="pt-6">
        <div className="relative h-[250px] w-full flex items-center justify-center">
          <ApexChart 
            options={options}
            series={series}
            type="radialBar"
            height={250}
          />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="text-6xl font-bold" style={{ color: scoreColor }}>
              {grade}
            </div>
            <div className="text-sm dashboard-text-secondary mt-1">Your Security Rank</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 