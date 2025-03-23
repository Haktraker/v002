"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import type { EmployeeGroup } from "@/lib/data/dashboard-service"
import { useTheme } from "@/components/theme-provider"

interface EmployeesDonutChartProps {
  data: EmployeeGroup[]
}

export function EmployeesDonutChartRecharts({ data }: EmployeesDonutChartProps) {
  const { isDarkMode } = useTheme()

  // Theme-aware tooltip styles
  const tooltipBg = isDarkMode ? "#0A0E17" : "#FFFFFF"
  const tooltipBorder = isDarkMode ? "#1E2A45" : "#E2E8F0"
  const tooltipText = isDarkMode ? "#E5E7EB" : "#1F2937"
  const legendText = isDarkMode ? "#E5E7EB" : "#1F2937"

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" fontSize={12}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={80}
            innerRadius={40}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              borderColor: tooltipBorder,
              color: tooltipText,
            }}
            formatter={(value: number, name: string) => [`${value}`, name]}
          />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            formatter={(value, entry, index) => <span style={{ color: legendText }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

