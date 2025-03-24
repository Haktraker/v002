"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ArrowUp, ArrowDown } from "lucide-react"
import ApexChart from "@/components/ui/apex-chart"

interface MetricsCardProps {
  value: number
  label: string
  trend: "up" | "down" | "neutral"
  trendValue?: number
  trendLabel?: string
  icon?: string
  iconColor?: string
  variant?: "default" | "minimal"
  chartData?: number[]
}

export function MetricsCard({
  value,
  label,
  trend,
  trendValue = 0,
  trendLabel = "",
  icon = "alert",
  iconColor = "text-primary",
  variant = "default",
  chartData = [10, 25, 30, 40, 25, 45, 35, 55, 25, 35, 60, 45]
}: MetricsCardProps) {
  const isPositive = trend === "up"
  const isNeutral = trend === "neutral"
  
  // Determine if the trend is good or bad
  const isPositiveGood = label.toLowerCase().includes("resolved") || label.toLowerCase().includes("score")
  const isGood = isNeutral ? true : (isPositiveGood ? isPositive : !isPositive)

  const series = [{
    name: label,
    data: chartData
  }]

  const options = {
    chart: {
      type: 'line',
      sparkline: {
        enabled: true,
      },
      toolbar: {
        show: false,
      },
      background: 'transparent',
    },
    colors: isGood ? ['#4CAF50'] : ['#FF5050'],
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    tooltip: {
      enabled: false,
    },
    grid: {
      show: false,
    },
    xaxis: {
      labels: {
        show: false,
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        show: false,
      },
    },
  }

  return (
    <Card className="dashboard-card overflow-hidden">
      <CardContent className="dashboard-card-padding">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              {variant === "minimal" ? (
                <div className={`h-3 w-3 rounded-full ${iconColor}`}></div>
              ) : null}
              <span className="text-sm dashboard-text-secondary">{label}</span>
            </div>
            <div className="text-2xl font-bold mt-1 dashboard-text-primary">{value}</div>
            
            {!isNeutral && trendValue && trendLabel ? (
              <div className="flex items-center mt-1">
                {isPositive ? (
                  <ArrowUp className={`h-4 w-4 mr-1 ${isGood ? "text-green-500" : "text-red-500"}`} />
                ) : (
                  <ArrowDown className={`h-4 w-4 mr-1 ${isGood ? "text-green-500" : "text-red-500"}`} />
                )}
                <span className={`text-xs ${isGood ? "text-green-500" : "text-red-500"}`}>
                  {trendValue}% {trendLabel}
                </span>
              </div>
            ) : (
              <div className="text-xs dashboard-text-muted mt-1">{trendLabel}</div>
            )}
          </div>
          
          {variant !== "minimal" && (
            <div className="h-16 w-24">
              <ApexChart
                type="line"
                options={options}
                series={series}
                height={65}
                width={96}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 