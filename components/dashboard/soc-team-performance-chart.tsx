'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes'; // Import useTheme
// Import only the necessary base types
import { 
  SocTeamPerformance, 
  SocTeamPerformanceTeam, 
  SocTeamPerformanceBuDetail, 
} from '@/lib/api/types'; // Corrected import comment
import { useGetSocTeamPerformances } from '@/lib/api/endpoints/business-units-security/soc-team-performance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ApexOptions } from 'apexcharts';

// Dynamically import ApexCharts to prevent SSR issues
const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

// Remove props for data, isLoading, error as the component fetches its own data
interface SocTeamPerformanceChartProps {
  className?: string;
  // Add any other specific props needed, like query params if filtering is reintroduced
}

// Define the local interface for the flattened data structure used by the chart
interface FlatChartData {
  id: string; // Unique identifier for the flat row (e.g., recordId-teamName-buName)
  recordId: string; // Original _id of the SocTeamPerformance record
  month: string;
  year: string;
  teamName: string;
  buName: string;
  resolutionRate: number;
  accuracy: number;
  incidentsHandled: number;
  createdAt?: string; 
  updatedAt?: string; 
}

const SocTeamPerformanceChart: React.FC<SocTeamPerformanceChartProps> = ({
  className,
}) => {
  const { theme } = useTheme(); // Get the current theme
  const isDark = theme === 'dark';

  // Fetch data within the component
  const {
    data: performanceData, // Nested data: SocTeamPerformance[]
    isLoading,
    error,
  } = useGetSocTeamPerformances(); // Add queryParams here if needed

  // Transform the nested data into a flat structure for the chart
  const flatChartData = useMemo<FlatChartData[]>(() => { // Use the local FlatChartData type
    if (!performanceData || performanceData.length === 0) return [];
    
    const flatData: FlatChartData[] = []; // Use the local FlatChartData type
    
    performanceData.forEach(record => {
      record.socTeam.forEach((team: SocTeamPerformanceTeam) => {
        team.bu.forEach((bu: SocTeamPerformanceBuDetail) => {
          flatData.push({
            id: `${record._id}-${team.teamName}-${bu.buName}`, 
            recordId: record._id,
            month: record.month,
            year: record.year,
            teamName: team.teamName,
            buName: bu.buName,
            resolutionRate: bu.resolutionRate,
            accuracy: bu.accuracy,
            incidentsHandled: bu.incidentsHandled,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt
          });
        });
      });
    });
    
    return flatData;
  }, [performanceData]);

  // Use the flattened data for chart processing
  const processedChartData = useMemo(() => flatChartData || [], [flatChartData]);
  
  // Derive categories from the flat data (Team - BU Name)
  const chartCategories = useMemo(() => {
    const categories = Array.from(
      new Set(processedChartData.map(item => `${item.teamName} - ${item.buName}`))
    );
    return categories.sort(); 
  }, [processedChartData]);

  // Derive series data from the flat data
  const chartSeries = useMemo(() => {
    return [
      {
        name: 'Resolution Rate',
        data: chartCategories.map(category => {
          const [team, bu] = category.split(' - ');
          const point = processedChartData.find(
            item => item.teamName === team && item.buName === bu.trim()
          );
          return point?.resolutionRate ?? 0;
        }),
      },
      {
        name: 'Accuracy',
        data: chartCategories.map(category => {
          const [team, bu] = category.split(' - ');
          const point = processedChartData.find(
            item => item.teamName === team && item.buName === bu.trim()
          );
          return point?.accuracy ?? 0;
        }),
      },
      {
        name: 'Incidents Handled',
        data: chartCategories.map(category => {
          const [team, bu] = category.split(' - ');
          const point = processedChartData.find(
            item => item.teamName === team && item.buName === bu.trim()
          );
          return point?.incidentsHandled ?? 0;
        }),
      },
    ];
  }, [processedChartData, chartCategories]);

  // Define chart options with theme awareness
  const chartOptions = useMemo((): ApexOptions => {
    const categoryCount = chartCategories.length;
    const dynamicHeight = Math.max(300, 200 + categoryCount * 30);
    const textColor = `hsl(var(--muted-foreground))`;
    const gridBorderColor = `hsl(var(--border))`;
    const dataLabelColor = isDark ? '#fff' : '#333';
    const chartThemeMode = isDark ? 'dark' : 'light';

    return {
      chart: {
        type: 'bar',
        height: dynamicHeight,
        stacked: false, 
        toolbar: {
          show: true, // Keep toolbar for download
          tools: { download: true, selection: false, zoom: false, zoomin: false, zoomout: false, pan: false, reset: true }
        },
        background: 'transparent',
        foreColor: textColor,
      },
      plotOptions: {
        bar: {
          horizontal: true, 
          dataLabels: {
            position: 'top',
          },
        }
      },
      dataLabels: {
        enabled: false 
      },
      stroke: {
        width: 1,
        colors: ['#fff']
      },
      xaxis: {
        categories: chartCategories,
        title: {
          text: 'Performance Metrics',
          style: { color: textColor, fontFamily: 'inherit' } // Apply theme color
        },
        labels: {
            formatter: function (value: string | undefined) {
                return value || '';
            },
            style: { colors: textColor, fontFamily: 'inherit' } // Apply theme color
        },
        axisBorder: { color: gridBorderColor }, // Apply theme color
        axisTicks: { color: gridBorderColor }, // Apply theme color
      },
      yaxis: {
        title: {
          text: 'Teams by Business Units',
          style: { color: textColor, fontFamily: 'inherit' } // Apply theme color
        },
        labels: { 
            style: { colors: textColor, fontFamily: 'inherit' }, // Apply theme color
        },
      },
      tooltip: {
        theme: chartThemeMode, // Set tooltip theme
        shared: false,
        intersect: true,
        y: {
          formatter: function (val: number, { seriesIndex }: { seriesIndex: number }) {
            if (seriesIndex === 0 || seriesIndex === 1) {
              return val.toFixed(1) + '%';
            }
            return val.toString();
          }
        },
        style: { fontFamily: 'inherit' },
      },
      fill: {
        opacity: 1
      },
      legend: {
        position: 'bottom',
        horizontalAlign: 'center',
        fontFamily: 'inherit',
        labels: { colors: dataLabelColor }, // Use conditional color
      },
      colors: ['#4f46e5', '#10b981', '#f59e0b'], // Keep specific series colors
      grid: {
        borderColor: gridBorderColor, // Apply theme color
        strokeDashArray: 3,
         yaxis: {
            lines: { show: true }
        },
        xaxis: {
            lines: { show: false }
        }, 
        padding: {
           left: 5,
           right: 15
        } 
      },
      responsive: [
        {
          breakpoint: 768,
          options: {
            chart: {
              height: Math.max(400, 300 + categoryCount * 40)
            },
            plotOptions: {
              bar: {
                horizontal: false 
              }
            },
            legend: {
              position: 'bottom',
            }
          }
        }
      ]
    };
  }, [chartCategories, isDark]); // Add isDark dependency

  // Render logic: Loading, Error, No Data, Chart
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col space-y-3 p-6">
          <Skeleton className="h-8 w-[250px] mb-4" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive" className="mx-6 my-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Chart</AlertTitle>
          <AlertDescription>
            Failed to load SOC Team Performance data: {error instanceof Error ? error.message : 'Unknown error'} {/* Display error message */}
          </AlertDescription>
        </Alert>
      );
    }

    // Use the flattened data length for the check
    if (!processedChartData.length) {
      return (
        <Alert className="mx-6 my-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Data Available</AlertTitle>
          <AlertDescription>
            There is no SOC Team Performance data to display for the current selection.
          </AlertDescription>
        </Alert>
      );
    }

    // Render the chart if data is available
    return (
      <ApexChart
        key={chartCategories.join('-')}
        options={chartOptions}
        series={chartSeries}
        type="bar"
        height={chartOptions.chart?.height}
      />
    );
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>SOC Team Performance</CardTitle>
        <CardDescription>
          Resolution Rate, Accuracy, and Incidents Handled per Team/BU
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 pr-0 pb-2 pl-2">
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default SocTeamPerformanceChart;
