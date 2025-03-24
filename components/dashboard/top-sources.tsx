"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface SourceData {
  name: string
  value: number
  color?: string
}

interface TopSourcesProps {
  data: SourceData[]
}

export function TopSources({ data }: TopSourcesProps) {
  // Sort data in descending order
  const sortedData = [...data].sort((a, b) => b.value - a.value)
  
  // Assign colors if not provided
  const dataWithColors = sortedData.map((item, index) => ({
    ...item,
    color: item.color || getColorByIndex(index),
  }))
  
  return (
    <Card className="bg-[#F7F7F7] dark:bg-card h-full">
      <CardHeader>
        <CardTitle>Top Sources</CardTitle>
        <CardDescription>Attack sources by frequency</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={dataWithColors}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={80}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value: number) => [`${value}`, 'Count']}
                labelFormatter={(name) => `${name}`}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {dataWithColors.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mt-4">
          {dataWithColors.map((item, index) => (
            <div key={index} className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: item.color }}
              />
              <div className="flex justify-between w-full">
                <span className="text-sm">{item.name}</span>
                <span className="text-sm font-medium">{item.value}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function getColorByIndex(index: number): string {
  const colors = [
    "#FF5050", // Red
    "#FF9500", // Orange
    "#FFCC00", // Yellow
    "#4CAF50", // Green
    "#2196F3", // Blue
    "#9C27B0", // Purple
    "#795548", // Brown
    "#607D8B", // Gray
  ]
  return colors[index % colors.length]
} 