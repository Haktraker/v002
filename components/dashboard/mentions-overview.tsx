"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import ApexChart from "@/components/ui/apex-chart"

interface MentionsOverviewProps {
  totalMentions: number
  negativeMentions: number
  positiveMentions: number
  neutralMentions: number
}

export function MentionsOverview({
  totalMentions = 842,
  negativeMentions = 256,
  positiveMentions = 428,
  neutralMentions = 158
}: MentionsOverviewProps) {
  const negativePercentage = Math.round((negativeMentions / totalMentions) * 100)
  const positivePercentage = Math.round((positiveMentions / totalMentions) * 100)
  const neutralPercentage = Math.round((neutralMentions / totalMentions) * 100)

  // Configure the ApexCharts options for the semi-circle gauge
  const options = {
    chart: {
      type: 'radialBar',
      background: 'transparent',
    },
    plotOptions: {
      radialBar: {
        startAngle: -180,
        endAngle: 0,
        hollow: {
          size: '65%',
        },
        track: {
          background: 'rgba(255, 255, 255, 0.1)',
          strokeWidth: '97%',
        },
        dataLabels: {
          name: {
            show: false,
          },
          value: {
            show: false,
          },
        }
      },
    },
    colors: ['#FF5050', '#FFBB28', '#4CAF50'],
    labels: ['Negative', 'Neutral', 'Positive'],
    legend: {
      show: false,
    },
    stroke: {
      lineCap: 'round'
    },
  }

  const series = [negativePercentage, neutralPercentage, positivePercentage]

  const mentionTypes = [
    { type: "Negative", count: negativeMentions, color: "#FF5050", percentage: negativePercentage },
    { type: "Neutral", count: neutralMentions, color: "#FFBB28", percentage: neutralPercentage },
    { type: "Positive", count: positiveMentions, color: "#4CAF50", percentage: positivePercentage },
  ]

  return (
    <Card className="dashboard-card h-full">
      <CardHeader className="pb-0">
        <CardTitle className="dashboard-text-primary">Mentions Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-[180px] w-full flex items-center justify-center">
          <ApexChart
            options={options}
            series={series}
            type="radialBar"
            height={180}
          />
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center">
            <div className="text-2xl font-bold dashboard-text-primary">{totalMentions}</div>
            <div className="text-xs dashboard-text-muted">Total Mentions</div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mt-4">
          {mentionTypes.map((item) => (
            <div key={item.type} className="flex flex-col items-center">
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-1" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs dashboard-text-secondary">{item.type}</span>
              </div>
              <div className="text-lg font-medium mt-1 dashboard-text-primary">{item.count}</div>
              <div className="text-xs dashboard-text-muted">{item.percentage}%</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 