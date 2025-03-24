"use client"

import { ArrowUp, ArrowDown } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface MetricProps {
  title: string
  value: number
  change: number
  period: string
}

function MetricCard({ title, value, change, period }: MetricProps) {
  const isPositive = change >= 0
  // For some metrics, positive change is good (like security score)
  // For others, negative change is good (like vulnerabilities)
  // This can be customized based on the metric type
  const isPositiveGood = title.toLowerCase().includes("score") || title.toLowerCase().includes("protected")
  const isGood = isPositiveGood ? isPositive : !isPositive
  
  return (
    <Card className="bg-[#F7F7F7] dark:bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center mt-1">
          {isPositive ? (
            <ArrowUp className={`h-4 w-4 mr-1 ${isGood ? "text-green-500" : "text-red-500"}`} />
          ) : (
            <ArrowDown className={`h-4 w-4 mr-1 ${isGood ? "text-green-500" : "text-red-500"}`} />
          )}
          <span className={`text-sm font-medium ${isGood ? "text-green-500" : "text-red-500"}`}>
            {Math.abs(change)}%
          </span>
          <span className="text-sm text-muted-foreground ml-1">
            vs {period}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

interface MetricsOverviewProps {
  metrics: MetricProps[]
}

export function MetricsOverview({ metrics }: MetricsOverviewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  )
} 