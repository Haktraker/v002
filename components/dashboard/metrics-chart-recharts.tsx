"use client"

import { RadialBarChart, RadialBar, Legend, ResponsiveContainer, Tooltip } from "recharts"
import type { MetricData } from "@/lib/data/dashboard-service"
import { useTheme } from "@/components/theme-provider"

interface MetricsChartProps {
  data: MetricData[]
}

export function MetricsChartRecharts({ data }: MetricsChartProps) {
  const { isDarkMode } = useTheme()

  // Theme-aware tooltip styles
  const tooltipBg = isDarkMode ? "#0A0E17" : "#FFFFFF"
  const tooltipBorder = isDarkMode ? "#1E2A45" : "#E2E8F0"
  const tooltipText = isDarkMode ? "#E5E7EB" : "#1F2937"
  const legendText = isDarkMode ? "#E5E7EB" : "#1F2937"

  // Prepare data for RadialBarChart
  const chartData = data.map((item, index) => ({
    ...item,
    fill: item.color,
    // Adjust the value to make it visually appealing in the chart
    // We'll scale all values to be between 0-100 for the chart
    value: 100 - index * 10, // This creates a cascading effect
    actualValue: item.value, // Keep the actual value for display
  }))

  // Custom legend that shows the actual values
  const renderLegend = () => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {chartData.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center">
            <div className="w-3 h-3 mr-2" style={{ backgroundColor: entry.color }} />
            <span className="text-sm" style={{ color: legendText }}>
              {entry.name}: {entry.actualValue}
            </span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="20%"
          outerRadius="80%"
          barSize={20}
          data={chartData}
          startAngle={180}
          endAngle={-180}
        >
          <RadialBar background dataKey="value" cornerRadius={10} label={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              borderColor: tooltipBorder,
              color: tooltipText,
            }}
            formatter={(value: number, name: string, props: any) => [props.payload.actualValue, name]}
          />
          <Legend content={renderLegend} verticalAlign="bottom" align="center" />
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  )
}

