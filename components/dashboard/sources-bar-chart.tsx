"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import ApexChart from "@/components/ui/apex-chart"

interface SourceData {
  name: string
  value: number
  color?: string
}

interface SourcesBarChartProps {
  data: SourceData[]
}

export function SourcesBarChart({ data }: SourcesBarChartProps) {
  // Sort data in descending order
  const sortedData = [...data].sort((a, b) => b.value - a.value)
  
  // Assign colors if not provided
  const colors = [
    "#845EFF", // Purple
    "#FF9500", // Orange
    "#FF5050", // Red
    "#FFCC00", // Yellow
    "#4CAF50", // Green
  ]
  
  const dataWithColors = sortedData.map((item, index) => ({
    ...item,
    color: item.color || colors[index % colors.length],
  }))
  
  const series = [{
    name: 'Count',
    data: dataWithColors.map(item => item.value)
  }]
  
  const options = {
    chart: {
      type: 'bar',
      height: 250,
      background: 'transparent',
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '40%',
        borderRadius: 4,
        endingShape: 'rounded',
        distributed: true,
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
    },
    xaxis: {
      categories: dataWithColors.map(item => item.name),
      labels: {
        style: {
          colors: '#888',
          fontSize: '12px',
        }
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    yaxis: {
      show: false
    },
    fill: {
      opacity: 1
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: function(val: number) {
          return val.toString()
        }
      }
    },
    grid: {
      show: false
    },
    colors: dataWithColors.map(item => item.color),
    legend: {
      show: false
    }
  }
  
  return (
    <Card className="dashboard-card h-full">
      <CardHeader>
        <CardTitle className="dashboard-text-primary">Top Sources</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ApexChart
            options={options}
            series={series}
            type="bar"
            height={250}
          />
        </div>
      </CardContent>
    </Card>
  )
}

