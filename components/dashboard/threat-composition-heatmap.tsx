'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { ThreatComposition } from '@/lib/api/types';
import { useTheme } from '@/components/theme-provider';

// Dynamically import ApexCharts to avoid SSR issues
const ApexChart = dynamic(() => import('@/components/ui/apex-chart'), { ssr: false });

interface ThreatCompositionHeatmapProps {
  data: ThreatComposition[];
  isLoading?: boolean;
  className?: string;
}

export function ThreatCompositionHeatmap({ 
  data, 
  isLoading = false,
  className = '' 
}: ThreatCompositionHeatmapProps) {
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  
  // Extract unique years and months from data
  const years = useMemo(() => {
    const uniqueYears = Array.from(new Set(data.map(item => item.year)));
    return ['all', ...uniqueYears.sort()];
  }, [data]);
  
  const months = useMemo(() => {
    const uniqueMonths = Array.from(new Set(data.map(item => item.month)));
    return ['all', ...uniqueMonths.sort()];
  }, [data]);

  // Filter data based on selected year and month
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const yearMatch = selectedYear === 'all' || item.year === selectedYear;
      const monthMatch = selectedMonth === 'all' || item.month === selectedMonth;
      return yearMatch && monthMatch;
    });
  }, [data, selectedYear, selectedMonth]);

  // Process data for heatmap
  const processHeatmapData = () => {
    if (!filteredData.length) return { series: [] };

    // Group by threat type and attack vector
    const threatTypes = Array.from(new Set(filteredData.map(item => item.threatType)));
    const attackVectors = Array.from(new Set(filteredData.map(item => item.attackVector)));
    
    // Create series data for heatmap
    const series = threatTypes.map(threatType => {
      const data = attackVectors.map(attackVector => {
        // Sum incident counts for this threat type and attack vector
        const incidents = filteredData
          .filter(item => item.threatType === threatType && item.attackVector === attackVector)
          .reduce((sum, item) => sum + item.incidentCount, 0);
        
        return {
          x: attackVector,
          y: incidents
        };
      });
      
      return {
        name: threatType,
        data
      };
    });
    
    return { series };
  };

  const heatmapData = processHeatmapData();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const chartOptions = {
    chart: {
      type: 'heatmap',
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: false
        }
      },
      fontFamily: 'inherit',
      background: 'transparent'
    },
    dataLabels: {
      enabled: false
    },
    colors: ['#008FFB'],
    title: {
      text: 'Threat Composition Heatmap',
      align: 'left',
      style: {
        fontSize: '16px',
        fontWeight: 600,
        fontFamily: 'inherit',
        color: isDark ? '#fff' : '#333'
      }
    },
    plotOptions: {
      heatmap: {
        radius: 0,
        enableShades: true,
        shadeIntensity: 0.5,
        colorScale: {
          ranges: isDark ? [
            {
              from: 0,
              to: 10,
              name: 'Low',
              color: '#00A100'
            },
            {
              from: 11,
              to: 20,
              name: 'Medium',
              color: '#FFB200'
            },
            {
              from: 21,
              to: 50,
              name: 'High',
              color: '#FF4560'
            },
            {
              from: 51,
              to: 1000,
              name: 'Critical',
              color: '#7F0000'
            }
          ] : [
            {
              from: 0,
              to: 10,
              name: 'Low',
              color: '#4CAF50'
            },
            {
              from: 11,
              to: 20,
              name: 'Medium',
              color: '#FF9800'
            },
            {
              from: 21,
              to: 50,
              name: 'High',
              color: '#F44336'
            },
            {
              from: 51,
              to: 1000,
              name: 'Critical',
              color: '#B71C1C'
            }
          ]
        }
      }
    },
    tooltip: {
      y: {
        formatter: function(value: number) {
          return value + ' incidents';
        }
      }
    },
    xaxis: {
      labels: {
        style: {
          colors: isDark ? '#fff' : '#333'
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: isDark ? '#fff' : '#333'
        }
      }
    },
    theme: {
      mode: isDark ? 'dark' : 'light'
    }
  };

  return (
    <div className={`p-4 rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}>
      <div className="mb-4 flex flex-wrap gap-4 items-center justify-between">
        <h3 className="text-lg font-semibold">Threat Composition Heatmap</h3>
        <div className="flex gap-4">
          <div>
            <label htmlFor="year-filter" className="block text-sm font-medium mb-1">
              Year
            </label>
            <select
              id="year-filter"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year === 'all' ? 'All Years' : year}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="month-filter" className="block text-sm font-medium mb-1">
              Month
            </label>
            <select
              id="month-filter"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {months.map((month) => (
                <option key={month} value={month}>
                  {month === 'all' ? 'All Months' : month}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="h-[400px] w-full">
        {isLoading ? (
          <div className="h-full w-full flex items-center justify-center">
            <p>Loading...</p>
          </div>
        ) : heatmapData.series.length > 0 ? (
          <ApexChart
            options={chartOptions}
            series={heatmapData.series}
            type="heatmap"
            height="100%"
            width="100%"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <p>No data available for the selected filters</p>
          </div>
        )}
      </div>
    </div>
  );
}