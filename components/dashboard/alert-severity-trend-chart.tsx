'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, Terminal } from 'lucide-react';
import { AlertSeverityTrend } from '@/lib/api/types'; 
import { MONTHS } from '@/lib/constants/months-list'; // For sorting x-axis

// Dynamically import ApexCharts wrapper
const ApexChart = dynamic(() => import('@/components/ui/apex-chart'), { ssr: false });

type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';
const SEVERITY_LEVELS: SeverityLevel[] = ["critical", "high", "medium", "low"];
const SEVERITY_COLORS: { [key in SeverityLevel]: string } = {
  critical: '#dc2626', // Red
  high: '#f97316',     // Orange
  medium: '#facc15',   // Yellow
  low: '#3b82f6'       // Blue
};

interface AlertSeverityTrendChartProps {
  data?: AlertSeverityTrend[];
  isLoading?: boolean;
  error?: Error | null;
}

const AlertSeverityTrendChart: React.FC<AlertSeverityTrendChartProps> = ({ 
  data: trendData,
  isLoading,
  error
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Process data for line chart
  const chartData = useMemo(() => {
    if (!trendData || trendData.length === 0) {
      return { series: [], categories: [] };
    }

    // Assuming data is for a single year, group by month for x-axis
    // If multiple years are possible, filtering/grouping needs adjustment
    const monthlyData: { [month: string]: { [key in SeverityLevel]: number } } = {};
    const monthSet = new Set<string>();

    trendData.forEach(item => {
        monthSet.add(item.month);
        if (!monthlyData[item.month]) {
            monthlyData[item.month] = { critical: 0, high: 0, medium: 0, low: 0 };
        }
        // Sum counts for each severity level per month (aggregating across BUs if necessary)
        monthlyData[item.month].critical += item.critical || 0;
        monthlyData[item.month].high += item.high || 0;
        monthlyData[item.month].medium += item.medium || 0;
        monthlyData[item.month].low += item.low || 0;
    });

    // Sort months chronologically
    const categories = Array.from(monthSet).sort((a, b) => MONTHS.indexOf(a) - MONTHS.indexOf(b));

    const series = SEVERITY_LEVELS.map(level => ({
      name: level.charAt(0).toUpperCase() + level.slice(1),
      data: categories.map(month => monthlyData[month]?.[level] || 0) // Get count for the month, default to 0
    }));

    return { series, categories };
  }, [trendData]);

  // Configure chart options
  const chartOptions = useMemo((): ApexCharts.ApexOptions => {
    const textColor = `hsl(var(--muted-foreground))`;
    const gridBorderColor = `hsl(var(--border))`;
    const dataLabelColor = `hsl(var(--foreground))`;
    const chartThemeMode = isDark ? 'dark' : 'light';

    return {
      chart: {
        type: 'line',
        height: 350,
        stacked: false, // Line chart, not stacked
        toolbar: { show: true, tools: { download: false } }, // Show toolbar, hide download
        zoom: { enabled: false }, // Disable zoom for simplicity
        background: 'transparent',
        foreColor: textColor,
      },
      stroke: {
        width: 3,
        curve: 'smooth'
      },
      markers: {
        size: 5,
        hover: { sizeOffset: 2 }
      },
      xaxis: {
        categories: chartData.categories,
        title: { text: 'Month', style: { color: textColor, fontFamily: 'inherit' } },
        labels: { 
            style: { colors: textColor, fontFamily: 'inherit' },
            hideOverlappingLabels: true,
        },
        axisBorder: { color: gridBorderColor },
        axisTicks: { color: gridBorderColor },
        tooltip: { enabled: false } // Disable x-axis tooltip
      },
      yaxis: {
        title: { 
            text: 'Total Alert Count', 
            style: { color: textColor, fontFamily: 'inherit' }
        },
        labels: { 
            style: { colors: textColor, fontFamily: 'inherit' },
            formatter: (val) => val.toFixed(0) // Format y-axis labels
        },
        min: 0 // Start y-axis at 0
      },
      colors: SEVERITY_LEVELS.map(level => SEVERITY_COLORS[level]),
      fill: {
        opacity: 1
      },
      legend: {
        position: 'top',
        horizontalAlign: 'center',
        fontFamily: 'inherit',
        labels: { colors: dataLabelColor },
      },
      tooltip: {
        theme: chartThemeMode,
        shared: true, // Show tooltip for all lines at that point
        intersect: false,
        y: {
          formatter: (val: number) => val.toFixed(0) + " alerts"
        },
        style: { fontFamily: 'inherit', fontSize: '12px' },
      },
      grid: { 
        show: true, // Show grid lines for line chart
        borderColor: gridBorderColor,
        strokeDashArray: 4, // Optional: dashed lines
        yaxis: { lines: { show: true } },
        xaxis: { lines: { show: false } }
      },
      dataLabels: { // Disable data labels on lines
        enabled: false
      }
    };
  }, [isDark, chartData.categories]);

  const renderContent = () => {
    if (isLoading) {
      return <Skeleton className="h-[350px] w-full" />;
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error Loading Chart</AlertTitle>
          <AlertDescription>
            Failed to load Alert Severity Trend data: {error?.message || 'Unknown error'}
          </AlertDescription>
        </Alert>
      );
    }

    if (chartData.series.length === 0 || chartData.categories.length === 0) {
      return (
        <Alert className="border-none">
          <Info className="h-4 w-4" />
          <AlertTitle>No Data Available</AlertTitle>
          <AlertDescription>
            No Alert Severity Trend data available to display for the selected filters.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <ApexChart
        options={chartOptions}
        series={chartData.series}
        type="line"
        height={350}
      />
    );
  };

  return (
    <Card className={`flex-1 flex flex-col ${isDark ? "bg-[#171727] border-0" : "bg-white"}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col space-y-1.5">
          <CardTitle className="text-base font-medium">Alert Severity Trend</CardTitle>
          <CardDescription>Monthly trend of alert counts by severity</CardDescription>
        </div>
        {/* Link to the table page */}
        <Link href="/dashboard/business-units-security/alert-severity-trend">
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

export default AlertSeverityTrendChart;
