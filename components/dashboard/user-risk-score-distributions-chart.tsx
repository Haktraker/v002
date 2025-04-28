'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
import { useTheme } from 'next-themes';
import { useGetRiskScoreDistributions } from '@/lib/api/endpoints/user-behavior-analytics/user-risk-score-distributions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useGlobalFilter } from '@/lib/context/GlobalFilterContext';
import { cn } from '@/lib/utils';

// Dynamically import ApexCharts with SSR disabled
const Chart = dynamic(() => import('react-apexcharts'), { 
    ssr: false, 
    loading: () => <Skeleton className="h-[300px] w-full" /> 
});

// Define colors for each severity level (ensure keys match data keys)
const SEVERITY_COLORS = {
  low: '#22c55e',    // green-500
  medium: '#facc15',  // yellow-400
  high: '#f97316',    // orange-500
  critical: '#ef4444', // red-500
};

// Helper function to generate chart options based on theme (Aligned with UserBehaviorAnalyticsChart)
const getChartOptions = (categories: string[], isDark: boolean): ApexOptions => {
    const textColor = isDark ? '#e2e8f0' : '#475569'; // slate-200 / slate-600 (from reference)
    const gridBorderColor = isDark ? '#374151' : '#e5e7eb'; // gray-700 / gray-200 (from reference)
    const chartThemeMode = isDark ? 'dark' : 'light';

    return {
        chart: {
            type: 'bar',
            stacked: true,
            height: 300,
            toolbar: {
                show: false, // Keep toolbar hidden
            },
            background: 'transparent',
            foreColor: textColor, // Apply foreColor for general text
            animations: {
                enabled: true,
                speed: 400
            }
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '60%',
                borderRadius: 4,
            },
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
            categories: categories,
            labels: {
                style: {
                    colors: textColor, // Use themed text color
                    fontSize: '12px',
                    fontFamily: 'inherit' // Match reference
                }
            },
            axisBorder: { color: gridBorderColor }, // Use themed grid color
            axisTicks: { color: gridBorderColor }, // Use themed grid color
        },
        yaxis: {
            title: {
                text: 'Count',
                style: {
                    color: textColor, // Use themed text color
                    fontWeight: 500,
                    fontFamily: 'inherit' // Match reference
                }
            },
            labels: {
                style: {
                    colors: textColor, // Use themed text color
                    fontSize: '12px',
                    fontFamily: 'inherit' // Match reference
                },
                formatter: function (val: number) {
                    return val % 1 === 0 ? val.toFixed(0) : val.toFixed(2);
                }
            }
        },
        fill: {
            opacity: 1
        },
        tooltip: {
            theme: chartThemeMode, // Use themed tooltip
            y: {
                formatter: function (val) {
                    // Add check for valid number
                    if (typeof val !== 'number') return 'N/A'; 
                    return val + " records";
                }
            },
            style: { fontFamily: 'inherit' }, // Match reference
        },
        legend: {
            position: 'top',
            horizontalAlign: 'right',
            offsetY: -5,
            fontFamily: 'inherit', // Match reference
            labels: {
                colors: textColor // Use themed text color
            },
            markers: {
                size: 10 // Keep marker size
            },
            itemMargin: {
                horizontal: 8,
                vertical: 2
            },
        },
        grid: {
            borderColor: gridBorderColor, // Use themed grid color
            strokeDashArray: 3, // Match reference
             yaxis: {
                lines: { show: true } // Match reference
            },
            xaxis: {
                lines: { show: false } // Match reference
            }, 
        },
        colors: [SEVERITY_COLORS.low, SEVERITY_COLORS.medium, SEVERITY_COLORS.high, SEVERITY_COLORS.critical]
    };
};

export default function UserRiskScoreDistributionsChart() {
  const { theme } = useTheme(); // Use theme, not resolvedTheme, similar to reference
  const isDark = theme === 'dark';
  const { selectedMonth, selectedYear } = useGlobalFilter(); // Get filters from context

  // Prepare query params based on global filters
  const queryParams = useMemo(() => ({
      month: selectedMonth === 'All' ? undefined : selectedMonth,
      year: selectedYear === 'All' ? undefined : selectedYear,
      limit: 1000 // Keep fetching more data for chart aggregation
  }), [selectedMonth, selectedYear]);

  // Fetch data using query params
  const { data: paginatedData, isLoading, error, isError } = useGetRiskScoreDistributions(queryParams);

  // Transform data for ApexCharts (remains the same structure)
  const categories = useMemo(() => 
    paginatedData?.data?.map(item => `${item.month.substring(0,3)} ${item.year}`) || [],
    [paginatedData]
  ); 
  
  const series = useMemo(() => [
    {
      name: 'Low',
      data: paginatedData?.data?.map(item => item.low) || [],
    },
    {
      name: 'Medium',
      data: paginatedData?.data?.map(item => item.medium) || [],
    },
    {
      name: 'High',
      data: paginatedData?.data?.map(item => item.high) || [],
    },
    {
      name: 'Critical',
      data: paginatedData?.data?.map(item => item.critical) || [],
    }
  ], [paginatedData]);

  // Memoize chart options based on theme and categories
  const chartOptions = useMemo(() => getChartOptions(categories, isDark), [categories, isDark]);

  // --- Loading State (Align with reference using div/Skeleton) --- 
  if (isLoading) {
    return (
      <Card className={cn("w-full")}> 
        <CardHeader>
          <Skeleton className="h-6 w-3/5 mb-2" /> {/* Skeleton for title */} 
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // --- Error State (Align with reference using Alert) --- 
  if (isError) {
    return (
      <Card className={cn("w-full")}>
        <CardHeader>
          <CardTitle>User Risk Score Distributions</CardTitle>
        </CardHeader>
        <CardContent>
            <Alert variant="destructive" className="mx-auto my-4 max-w-lg"> 
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Loading Chart</AlertTitle>
                <AlertDescription>
                    Failed to load user risk score distribution data: {error instanceof Error ? error.message : 'Unknown error'}
                </AlertDescription>
            </Alert>
        </CardContent>
      </Card>
    );
  }

  // --- Empty State (Align with reference using Alert) --- 
  const totalDataPoints = series.reduce((sum, s) => sum + s.data.reduce((acc, val) => acc + (val || 0), 0), 0);
  if (!totalDataPoints || totalDataPoints === 0) {
    return (
       <Card className={cn("w-full")}>
        <CardHeader>
          <CardTitle>User Risk Score Distributions</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
           <Alert className="max-w-md border-none text-center">
            <Info className="h-4 w-4 mx-auto mb-2" />
            <AlertTitle>No Data Available</AlertTitle>
            <AlertDescription>
              There is no user risk score distribution data to display for the selected period.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

 // --- Render Chart --- 
  return (
     <Card className={cn("w-full")}>
      <CardHeader>
        <CardTitle>User Risk Score Distributions</CardTitle>
        {/* Add description if desired */} 
        {/* <CardDescription>Distribution of user risk scores over time.</CardDescription> */} 
      </CardHeader>
      <CardContent className="pt-4 pr-2 pb-2 pl-2"> {/* Match reference padding */}
          <Chart
            options={chartOptions}
            series={series}
            type="bar"
            height={300}
            width="100%"
          />
      </CardContent>
    </Card>
  );
}
