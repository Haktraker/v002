"use client"

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"

interface RiskScoreGaugeProps {
  score: number
}

export function RiskScoreGauge({ score }: RiskScoreGaugeProps) {
  // Calculate the color based on the score
  const getColor = (score: number) => {
    if (score < 40) return "#00FFAA" // Good (green)
    if (score < 70) return "#FFD600" // Warning (yellow)
    return "#FF3E3E" // Critical (red)
  }

  const color = getColor(score)

  // Create data for the gauge
  const data = [
    { name: "Score", value: score },
    { name: "Remaining", value: 100 - score },
  ]

  return (
    <div className="flex flex-col items-center">
      <div className="h-[150px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              startAngle={180}
              endAngle={0}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={0}
              dataKey="value"
            >
              <Cell key="score" fill={color} />
              <Cell key="remaining" fill="#1E2A45" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="text-center -mt-4">
        <div className="text-4xl font-bold" style={{ color }}>
          {score}
        </div>
        <div className="text-sm text-muted-foreground">Risk Score</div>
      </div>
    </div>
  )
}

