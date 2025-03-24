"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"
import ApexChart from "@/components/ui/apex-chart"

interface MetricsCardProps {
  metric: {
    score: number
    grade?: string
    trend: "up" | "down" | "stable"
    changePercentage: number
  }
  label?: string
  iconColor?: string
  variant?: "default" | "minimal"
}

export function MetricsCard({
  metric,
  label = "Security Score",
  iconColor = "text-primary",
  variant = "default"
}: MetricsCardProps) {
  const { score, grade, trend, changePercentage } = metric
  
  // Determine if the trend is good or bad based on the metric type
  const isPositive = trend === 'up'
  const isNeutral = trend === 'stable'
  
  // Default to treating upward trends as good for security scores
  const isGood = isNeutral ? true : isPositive

  return (
    <Card className={`dashboard-card overflow-hidden ${variant === 'minimal' ? 'bg-transparent border-none shadow-none' : ''}`}>
      <CardContent className="dashboard-card-padding">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              {variant === "minimal" ? (
                <div className={`h-3 w-3 rounded-full ${iconColor}`}></div>
              ) : null}
              <span className="text-sm dashboard-text-secondary">{label}</span>
            </div>
            <div className="text-2xl font-bold mt-1 dashboard-text-primary">{score}</div>
            {grade && <p className="text-sm font-medium">Grade: {grade}</p>}
            
            {trend && changePercentage ? (
              <div className={`flex items-center mt-1 ${isGood ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? (
                  <TrendingUp className={`h-4 w-4 mr-1 ${iconColor}`} />
                ) : (
                  <TrendingDown className={`h-4 w-4 mr-1 ${iconColor}`} />
                )}
                <span className={`text-xs ${isGood ? "text-green-500" : "text-red-500"}`}>
                  {changePercentage}% 
                </span>
              </div>
            ) : (
              <div className="text-xs dashboard-text-muted mt-1"></div>
            )}
          </div>
          
          {variant !== "minimal" && (
            <div className="h-16 w-24">
              <ApexChart
                type="line"
                options={{
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
                }}
                series={[
                  {
                    name: label,
                    data: [10, 25, 30, 40, 25, 45, 35, 55, 25, 35, 60, 45]
                  }
                ]}
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