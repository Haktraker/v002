'use client';

import React, { useMemo } from 'react';
import { CompanyRiskScore } from '@/lib/api/types';
import dynamic from 'next/dynamic'; // Use dynamic import for ApexCharts
import { ApexOptions } from 'apexcharts';
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from 'next-themes'; // Import useTheme
// Import Card components and Link/Button
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'; // Import Alert for error/no data
import { Info, Terminal } from 'lucide-react'; // Import icons

// Dynamically import ReactApexChart to avoid SSR issues
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface CompanyRiskScoresChartProps {
  data: CompanyRiskScore[];
  isLoading?: boolean;
  error?: Error | null;
}

// Helper function to aggregate data by BU
const aggregateDataForChart = (data: CompanyRiskScore[]) => {
  const buScores: { [key: string]: number } = {};

  data.forEach(record => {
    record.bus.forEach(bu => {
      if (buScores[bu.name]) {
        buScores[bu.name] += bu.count;
      } else {
        buScores[bu.name] = bu.count;
      }
    });
  });

  return Object.entries(buScores).map(([name, count]) => ({
    name,
    count,
  }));
};

const CompanyRiskScoresChart: React.FC<CompanyRiskScoresChartProps> = ({ data, isLoading, error }) => {
  const { theme } = useTheme(); // Get theme
  const isDark = theme === 'dark';

  const chartData = useMemo(() => aggregateDataForChart(data || []), [data]);
  
  // Configure chart options using useMemo for theme dependency
  const options = useMemo((): ApexOptions => {
      const textColor = `hsl(var(--muted-foreground))`;
      const gridBorderColor = `hsl(var(--border))`;
      const dataLabelColor = isDark ? '#fff' : '#304758'; // Theme-aware data label color
      const chartThemeMode = isDark ? 'dark' : 'light';
      const primaryColor = `hsl(var(--primary))`; // Use primary theme color for bars

    return {
        chart: {
          type: 'bar',
          height: '100%',
          toolbar: { show: false },
          background: 'transparent', // Transparent background
          foreColor: textColor, // Use theme text color
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '55%',
            borderRadius: 4,
            dataLabels: {
              position: 'top', 
            },
          },
        },
        dataLabels: {
          enabled: true,
          offsetY: -20,
          style: {
            fontSize: '12px',
            colors: [dataLabelColor], // Use theme-aware color
            fontFamily: 'inherit',
          },
          // Optional: Add shadow like in the reference chart
          dropShadow: {
            enabled: true,
            top: 1,
            left: 1,
            blur: 1,
            color: '#000',
            opacity: 0.45
          }
        },
        colors: [primaryColor], // Use primary theme color
        stroke: {
          show: true,
          width: 2,
          colors: ['transparent']
        },
        xaxis: {
          categories: chartData.map(item => item.name),
          labels: {
            show: true,
            trim: true,
            style: {
                colors: textColor, // Use theme text color
                fontSize: '11px',
                fontFamily: 'inherit',
            },
          },
          axisBorder: { show: false, color: gridBorderColor },
          axisTicks: { show: false, color: gridBorderColor },
        },
        yaxis: {
           labels: {
              show: true,
              style: {
                  colors: textColor, // Use theme text color
                  fontFamily: 'inherit',
              }
           }
        },
        fill: {
          opacity: 1
        },
        tooltip: {
          theme: chartThemeMode, // Set theme for tooltip
          shared: true,       // Show data for all series at that x-axis point
          intersect: false,   // Trigger tooltip based on x-axis category hover
          y: {
            formatter: function (val) {
              return val + " risks"
            }
          },
           style: { fontFamily: 'inherit' },
        },
        grid: { 
            show: true, // Show grid lines like reference
            borderColor: gridBorderColor, // Theme-aware grid border
            strokeDashArray: 3,
            yaxis: {
                lines: {
                    show: true // Show horizontal lines
                }
            },
            xaxis: {
                lines: {
                    show: false // Hide vertical lines
                }
            }, 
            padding: {
              left: 5,
              right: 15
            }
        }
      };
   }, [isDark, chartData]); // Depend on theme and chartData

  const renderContent = () => {
    if (isLoading) {
      return <Skeleton className="h-[350px] w-full" />; // Match height expectation
    }

    if (error) {
      return (
        <Alert variant="destructive" className="h-[350px] flex flex-col justify-center">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error Loading Chart</AlertTitle>
          <AlertDescription>
            Failed to load data: {error?.message || 'Unknown error'}
          </AlertDescription>
        </Alert>
      );
    }

    if (!data || data.length === 0 || chartData.length === 0) {
      return (
        <Alert className="border-none h-[350px] flex flex-col justify-center">
          <Info className="h-4 w-4" />
          <AlertTitle>No Data Available</AlertTitle>
          <AlertDescription>
            No Company Risk Score data available for the selected filters.
          </AlertDescription>
        </Alert>
      );
    }

    // Prepare series data *after* checks
    const series = [{
       name: 'Risk Count',
       data: chartData.map(item => item.count)
     }];

    return (
      <div className=""> {/* Set explicit height for chart container */}
         <ReactApexChart options={options} series={series} type="bar" />
      </div>
    );
  };

  return (
    <Card className={`flex-1 flex flex-col ${isDark ? "bg-[#171727] border-0" : "bg-white"}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex flex-col space-y-1.5">
                <CardTitle className="text-base font-medium">Company Risk Score</CardTitle>
                <CardDescription>Total risk count per Business Unit</CardDescription>
            </div>
            <Link href="/dashboard/business-units-security/company-risk-scores">
                <Button variant="outline" size="sm">
                    Manage All
                </Button>
            </Link>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-center pt-4">
            {renderContent()}
        </CardContent>
    </Card>
  );
};

export default CompanyRiskScoresChart;
