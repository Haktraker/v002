"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface MetricsCardProps {
  title: string
  value: number
  change: number
  isLoading?: boolean
}

export function MetricsCard({
  title,
  value,
  change,
  isLoading = false
}: MetricsCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const isPositive = change > 0
  const isNeutral = change === 0

  return (
    <Card>
      <CardContent className="p-6">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className="mt-2 flex items-baseline">
            <h3 className="text-2xl font-semibold">{value}</h3>
            {change !== 0 && (
              <span
                className={`ml-2 text-sm font-medium ${
                  isPositive ? 'text-green-500' : 'text-red-500'
                }`}
              >
                <span className="flex items-center">
                  {isPositive ? (
                    <TrendingUp className="mr-1 h-4 w-4" />
                  ) : (
                    <TrendingDown className="mr-1 h-4 w-4" />
                  )}
                  {Math.abs(change)}%
                </span>
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}