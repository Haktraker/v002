"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { SourceData } from "@/lib/data/dashboard-service"
import { useTheme } from "@/components/theme-provider"

interface SourcesBarChartProps {
  data: SourceData[]
}

export function SourcesBarChartRecharts({ data }: SourcesBarChartProps) {
  const { isDarkMode } = useTheme()

  // Theme-aware colors
  const gridColor = isDarkMode ? "#1E2A45" : "#E2E8F0"
  const textColor = isDarkMode ? "#6B7280" : "#4B5563"
  const barColor = "#06B6D4" // Cyan stays the same in both themes
  const tooltipBg = isDarkMode ? "#0A0E17" : "#FFFFFF"
  const tooltipBorder = isDarkMode ? "#1E2A45" : "#E2E8F0"
  const tooltipText = isDarkMode ? "#E5E7EB" : "#1F2937"

  return (
    <div className="w-full h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="name" stroke={textColor} tick={{ fill: textColor }} />
          <YAxis stroke={textColor} tick={{ fill: textColor }} />
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              borderColor: tooltipBorder,
              color: tooltipText,
            }}
          />
          <Bar dataKey="value" fill={barColor} radius={[4, 4, 0, 0]} background={{ fill: gridColor }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

