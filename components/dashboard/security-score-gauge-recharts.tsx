"use client"

import { useState, useEffect } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { useTheme } from "@/components/theme-provider"

interface SecurityScoreGaugeProps {
  score: number
}

export function SecurityScoreGaugeRecharts({ score }: SecurityScoreGaugeProps) {
  const { isDarkMode } = useTheme()
  const [animatedScore, setAnimatedScore] = useState(0)

  useEffect(() => {
    // Animate the score from 0 to the actual value
    const timer = setTimeout(() => {
      setAnimatedScore(score)
    }, 100)

    return () => clearTimeout(timer)
  }, [score])

  const data = [
    { name: "Score", value: animatedScore },
    { name: "Remaining", value: 100 - animatedScore },
  ]

  // Theme-aware colors
  const COLORS = [
    "#8A2CE2", // Primary color for the score
    isDarkMode ? "#1E2A45" : "#E2E8F0", // Background color based on theme
  ]

  return (
    <div className="relative w-full h-[300px] flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            startAngle={180}
            endAngle={0}
            innerRadius="60%"
            outerRadius="80%"
            paddingAngle={0}
            dataKey="value"
            stroke="none"
            cornerRadius={5}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute flex flex-col items-center justify-center">
        <p className="text-5xl font-bold">{animatedScore}%</p>
        <p className="text-sm text-muted-foreground mt-2">Your Security Score</p>
      </div>
    </div>
  )
}

