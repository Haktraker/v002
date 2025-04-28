'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { UserBehaviorAnalytics } from '@/lib/api/types';
import { useGetUserBehaviorAnalytics } from '@/lib/api/endpoints/user-behavior-analytics/user-behavior-analytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ApexOptions } from 'apexcharts';
import { MONTHS } from '@/lib/constants/months-list'; // Assuming this exists for sorting
import { useGlobalFilter } from '@/lib/context/GlobalFilterContext'; // Import global filter context

// Dynamically import ApexCharts
const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface UserBehaviorAnalyticsChartProps {
  className?: string;
  // Removed props for data, isLoading, error as chart fetches its own based on context
}

// Helper to convert month name to number for sorting
const monthNameToNumber = (monthName: string): number => {
  return MONTHS.indexOf(monthName);
};

const UserBehaviorAnalyticsChart: React.FC<UserBehaviorAnalyticsChartProps> = ({
  className,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { selectedMonth, selectedYear } = useGlobalFilter(); // Get filters from context

  // Prepare query params based on global filters
  const queryParams = useMemo(() => ({
      month: selectedMonth === 'All' ? undefined : selectedMonth,
      year: selectedYear === 'All' ? undefined : selectedYear,
  }), [selectedMonth, selectedYear]);

  // Fetch data using query params
  const { 
    data: analyticsData, 
    isLoading, 
    error 
  } = useGetUserBehaviorAnalytics(queryParams);

  // Process and sort data
  const processedData = useMemo(() => {
    if (!analyticsData) return null;

    // Sort data chronologically by year, then month
    const sortedData = [...analyticsData].sort((a, b) => {
      const yearComparison = parseInt(a.year) - parseInt(b.year);
      if (yearComparison !== 0) return yearComparison;
      return monthNameToNumber(a.month) - monthNameToNumber(b.month);
    });

    const categories = sortedData.map(d => `${d.month.substring(0, 3)} ${d.year}`);
    const series = [
      {
        name: 'Critical Alerts',
        data: sortedData.map(d => d.criticalAlerts),
      },
      {
        name: 'Avg Risk Score',
        data: sortedData.map(d => d.AvgRiskScore),
      },
      {
        name: 'Suspicious Users',
        data: sortedData.map(d => d.suspiciousUsers),
      },
      {
        name: 'Data Access Anomalies',
        data: sortedData.map(d => d.dataAccessAnomalies),
      },
        {
        name: 'Network Anomalies',
        data: sortedData.map(d => d.networkAnomalies),
      },
         {
        name: 'Response Time (ms)', // Assuming ms
        data: sortedData.map(d => d.responseTime),
      },
    ];

    return { categories, series };

  }, [analyticsData]);

  // Chart Options
  const chartOptions = useMemo((): ApexOptions => {
    const textColor = isDark ? '#e2e8f0' : '#475569'; // slate-200 / slate-600
    const gridBorderColor = isDark ? '#374151' : '#e5e7eb'; // gray-700 / gray-200
    const chartThemeMode = isDark ? 'dark' : 'light';

    return {
      chart: {
        type: 'line',
        height: 350,
        zoom: {
          enabled: false
        },
        toolbar: {
          show: false,
           tools: { download: true, selection: false, zoom: false, zoomin: false, zoomout: false, pan: false, reset: true }
        },
        background: 'transparent',
        foreColor: textColor,
      },
      stroke: {
        curve: 'smooth',
        width: 2,
      },
      markers: {
        size: 4,
        hover: { sizeOffset: 2 }
      },
      xaxis: {
        categories: processedData?.categories || [],
        title: {
          text: 'Month & Year',
          style: { color: textColor, fontFamily: 'inherit' }
        },
        labels: { 
            style: { colors: textColor, fontFamily: 'inherit' }
        },
        axisBorder: { color: gridBorderColor }, 
        axisTicks: { color: gridBorderColor }, 
      },
      yaxis: {
        title: {
          text: 'Metric Value',
          style: { color: textColor, fontFamily: 'inherit' }
        },
         labels: {
            style: { colors: textColor, fontFamily: 'inherit' }
        },
      },
      tooltip: {
        theme: chartThemeMode,
        shared: true,
        intersect: false,
        y: {
          formatter: function (val: number, { seriesIndex, w }) {
            // Add check for valid number
            if (typeof val !== 'number') {
              return 'N/A'; // Return placeholder if value is not a number
            }
            
            // Existing formatting logic
            const seriesName = w.globals.seriesNames[seriesIndex];
            if (seriesName === 'Response Time (ms)') return `${val.toFixed(0)} ms`;
            if (seriesName === 'Avg Risk Score') return val.toFixed(1);
            return val.toFixed(0); // Default formatting
          }
        },
        style: { fontFamily: 'inherit' },
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        fontFamily: 'inherit',
        labels: { colors: textColor }
      },
      grid: {
        borderColor: gridBorderColor,
        strokeDashArray: 3,
         yaxis: {
            lines: { show: true }
        },
        xaxis: {
            lines: { show: false }
        }, 
      },
       // Define colors if desired, otherwise ApexCharts defaults will be used
      // colors: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6']
    };
  }, [processedData, isDark]);

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
            Failed to load User Behavior Analytics data: {error instanceof Error ? error.message : 'Unknown error'}
          </AlertDescription>
        </Alert>
      );
    }

    if (!processedData || processedData.series.every(s => s.data.length === 0)) {
      return (
        <Alert className="mx-6 my-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Data Available</AlertTitle>
          <AlertDescription>
            There is no User Behavior Analytics data to display for the selected period.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <ApexChart
        options={chartOptions}
        series={processedData.series}
        type="line"
        height={350}
      />
    );
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>User Behavior Analytics Trends</CardTitle>
        <CardDescription>
          Monthly trends of key UBA metrics.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 pr-2 pb-2 pl-2"> {/* Adjust padding if needed */}
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default UserBehaviorAnalyticsChart;
