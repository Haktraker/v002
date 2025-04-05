"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

type MentionData = {
  type: string
  percentage: number
  count: number
  change: number
}

interface MentionsOverviewProps {
  data: MentionData[]
  isLoading?: boolean
}

export function MentionsOverview({ data, isLoading }: MentionsOverviewProps) {
  if (isLoading) {
    return (
      <Card className="">
        <CardHeader>
          <CardTitle>Mentions Overview</CardTitle>
        </CardHeader>
        <CardContent className="">
          <Skeleton className=" w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="">
      <CardHeader>
        <CardTitle>Mentions Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between">
          {/* Arc Chart */}
          <div className="relative">
            {data.map((item, index) => {
              const radius = 70 - index * 20 // Decreasing radius for each arc
              const circumference = 2 * Math.PI * radius
              const dashArray = (item.percentage / 100) * circumference
              const rotation = -90 // Start from top

              return (
                <svg
                  key={item.type}
                  className="absolute top-0 left-0"
                  width="180"
                  height="180"
                  viewBox="0 0 180 180"
                >
                  <circle
                    cx="90"
                    cy="90"
                    r={radius}
                    fill="none"
                    stroke={
                      item.type === 'Total Mentions' ? '#EF4444' :
                      item.type === 'Surface Web' ? '#F59E0B' : '#6366F1'
                    }
                    strokeWidth="12"
                    strokeDasharray={`${dashArray} ${circumference}`}
                    transform={`rotate(${rotation} 90 90)`}
                    style={{
                      transition: 'stroke-dasharray 0.5s ease'
                    }}
                  />
                </svg>
              )
            })}
          </div>

          {/* Stats */}
          <div className="flex flex-col ">
            {data.map((item) => (
              <div key={item.type} className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-red-500">{item.count}</span>
                  <span className="text-sm text-muted-foreground">
                    {item.change > 0 ? `+${item.change} More than last mo` : `${item.change} Less than last mo`}
                  </span>
                </div>
                <span className="text-sm font-medium mt-1">{item.type}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}