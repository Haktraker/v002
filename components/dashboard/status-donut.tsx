"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import ApexChart from "@/components/ui/apex-chart"

interface StatusData {
  name: string
  value: number
  color: string
}

interface StatusDonutProps {
  data: StatusData[]
  title: string
  description?: string
  total?: number
}

export function StatusDonut({ 
  data, 
  title, 
  description, 
  total 
}: StatusDonutProps) {
  // Extract values and colors for ApexCharts
  const series = data.map(item => item.value)
  const labels = data.map(item => item.name)
  const colors = data.map(item => item.color)
  
  // Calculate total if not provided
  const calculatedTotal = total || series.reduce((sum, value) => sum + value, 0)

  const options = {
    chart: {
      type: 'donut',
      background: 'transparent',
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            name: {
              show: false,
            },
            value: {
              show: false,
            },
            total: {
              show: true,
              label: 'Total',
              formatter: function() {
                return calculatedTotal
              },
              color: '#ffffff',
              fontSize: '22px',
              fontWeight: 600,
            }
          }
        }
      }
    },
    dataLabels: {
      enabled: false,
    },
    fill: {
      opacity: 1,
    },
    legend: {
      show: false,
    },
    states: {
      hover: {
        filter: {
          type: 'none',
        }
      },
      active: {
        filter: {
          type: 'none',
        }
      }
    },
    stroke: {
      width: 3,
      colors: ['#171727'],
    },
    tooltip: {
      enabled: true,
      fillSeriesColor: false,
      theme: 'dark',
      style: {
        fontSize: '12px',
      },
      y: {
        formatter: function(value: number) {
          return value.toString()
        }
      }
    },
    colors: colors,
    labels: labels,
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          height: 250
        }
      }
    }]
  }
  
  return (
    <Card className="dashboard-card h-full">
      <CardHeader>
        <CardTitle className="dashboard-text-primary">{title}</CardTitle>
        {description && <p className="text-sm dashboard-text-secondary">{description}</p>}
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ApexChart 
            options={options}
            series={series}
            type="donut"
            height={200}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: item.color }}
              />
              <div className="flex justify-between w-full">
                <span className="text-sm dashboard-text-secondary">{item.name}</span>
                <span className="text-sm font-medium dashboard-text-primary">{item.value}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 