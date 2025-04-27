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
import { BuAlerts } from '@/lib/api/types'; // Use correct type

// Dynamically import ApexCharts wrapper
const ApexChart = dynamic(() => import('@/components/ui/apex-chart'), { ssr: false });

// Define severity levels and corresponding colors for consistent ordering and display
type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';
const SEVERITY_LEVELS: SeverityLevel[] = ["critical", "high", "medium", "low"];
const SEVERITY_COLORS: { [key in SeverityLevel]: string } = {
  critical: '#dc2626', // Red
  high: '#f97316',     // Orange
  medium: '#facc15',   // Yellow
  low: '#3b82f6'       // Blue
};

interface BusinessUnitsAlertsChartProps {
  data?: BuAlerts[];
  isLoading?: boolean;
  error?: Error | null;
}

const BusinessUnitsAlertsChart: React.FC<BusinessUnitsAlertsChartProps> = ({ 
  data: buAlertsData,
  isLoading,
  error
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Process data for stacked bar chart
  const chartData = useMemo(() => {
    if (!buAlertsData || buAlertsData.length === 0) {
      return { series: [], categories: [] };
    }

    // Assuming the data passed is already filtered by month/year by the parent page
    // Group data by BU for the chart categories
    const categories = Array.from(new Set(buAlertsData.map(alert => alert.bu))).sort();
    
    const series = SEVERITY_LEVELS.map(level => ({
      name: level.charAt(0).toUpperCase() + level.slice(1), // Capitalize level name
      data: categories.map(buName => {
        // Find the alert data for the current BU and sum the count for the current severity level
        // (Although schema suggests one record per BU, summing is safer if data structure varies)
        const totalCount = buAlertsData
          .filter(alert => alert.bu === buName)
          .reduce((sum, alert) => sum + (alert[level]?.count || 0), 0);
        return totalCount;
      })
    }));

    return { series, categories };
  }, [buAlertsData]);

  // Configure chart options
  const chartOptions = useMemo((): ApexCharts.ApexOptions => {
    const textColor = `hsl(var(--muted-foreground))`;
    const gridBorderColor = `hsl(var(--border))`;
    const dataLabelColor = `hsl(var(--foreground))`;
    const chartThemeMode = isDark ? 'dark' : 'light';

    return {
      chart: {
        type: 'bar',
        height: 350,
        stacked: true,
        stackType: "100%", // Optional: make it a 100% stacked bar
        toolbar: { show: false },
        background: 'transparent',
        foreColor: textColor,
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '60%',
          // borderRadius: 5, // Optional: add border radius
        },
      },
      dataLabels: {
        enabled: false, // Keep bars clean
      },
      stroke: {
        show: false,
      },
      xaxis: {
        categories: chartData.categories,
        labels: { 
            style: { colors: textColor, fontFamily: 'inherit' },
            rotate: -45, // Rotate labels if many BUs
            hideOverlappingLabels: true,
        },
        axisBorder: { color: gridBorderColor },
        axisTicks: { color: gridBorderColor },
      },
      yaxis: {
        title: { 
            text: 'Alert Count', 
            style: { color: textColor, fontFamily: 'inherit' }
        },
        labels: { 
            style: { colors: textColor, fontFamily: 'inherit' },
            // formatter: (val) => val.toFixed(0) // Format y-axis labels if needed
        },
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
        y: {
          formatter: (val: number) => val.toFixed(0) + " alerts"
        },
        style: { fontFamily: 'inherit', fontSize: '8px' },
      },
      grid: { 
        show: false,
        borderColor: gridBorderColor,
      },
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
            Failed to load Business Unit Alerts data: {error?.message || 'Unknown error'}
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
            No Business Unit Alerts data available to display for the selected filters.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <ApexChart
        options={chartOptions}
        series={chartData.series}
        type="bar"
        height={350}
      />
    );
  };

  return (
    <Card className={`flex-1 flex flex-col ${isDark ? "bg-[#171727] border-0" : "bg-white"}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col space-y-1.5">
          <CardTitle className="text-base font-medium">Business Unit Alerts</CardTitle>
          <CardDescription>Alert counts by severity per Business Unit</CardDescription>
        </div>
        {/* Link to the future table page */}
        <Link href="/dashboard/business-units-security/business-units-alerts">
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

export default BusinessUnitsAlertsChart;
