"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

const data = [
  { date: "Mar 1", threats: 12, mitigated: 10, critical: 2 },
  { date: "Mar 5", threats: 19, mitigated: 15, critical: 4 },
  { date: "Mar 10", threats: 15, mitigated: 13, critical: 2 },
  { date: "Mar 15", threats: 25, mitigated: 20, critical: 5 },
  { date: "Mar 20", threats: 18, mitigated: 15, critical: 3 },
  { date: "Mar 25", threats: 27, mitigated: 22, critical: 5 },
  { date: "Mar 30", threats: 24, mitigated: 19, critical: 5 },
]

export function ThreatActivityChart() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1E2A45" />
          <XAxis dataKey="date" stroke="#6B7280" tick={{ fill: "#6B7280" }} />
          <YAxis stroke="#6B7280" tick={{ fill: "#6B7280" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0A0E17",
              borderColor: "#1E2A45",
              color: "#E5E7EB",
            }}
          />
          <Legend />
          <Line type="monotone" dataKey="threats" stroke="#FF3E3E" activeDot={{ r: 8 }} strokeWidth={2} />
          <Line type="monotone" dataKey="mitigated" stroke="#00FFAA" strokeWidth={2} />
          <Line type="monotone" dataKey="critical" stroke="#0088FF" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

