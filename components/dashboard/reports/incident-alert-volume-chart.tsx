'use client';

import { useMemo } from 'react';
import { useTheme } from 'next-themes';
import ApexChart from '@/components/ui/apex-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ReportsIncidentAlertVolume } from '@/lib/api/reports-types/types'; 
import { useGetReportsIncidentAlertVolumes } from '@/lib/api/endpoints/reports/incident-alert-volume';
import { useGlobalFilter } from '@/lib/context/GlobalFilterContext'; // Assuming global filters are used
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MONTHS } from '@/lib/constants/months-list';

// Helper function to sort data chronologically
const sortData = (data: ReportsIncidentAlertVolume[]): ReportsIncidentAlertVolume[] => {
    return data.sort((a, b) => {
      const yearComparison = parseInt(a.year) - parseInt(b.year);
      if (yearComparison !== 0) return yearComparison;
      return MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month);
    });
  };

// --- COMPONENT START ---
const ReportsIncidentAlertVolumeChart = () => {
  const { theme } = useTheme();
  const { selectedMonth, selectedYear } = useGlobalFilter(); // Use global filters
  const isDark = theme === 'dark';

  const queryParams = {
    month: selectedMonth === 'All' ? undefined : selectedMonth,
    year: selectedYear === 'All' ? undefined : selectedYear,
  };

  // Fetch data using the hook and global filters
  const { data: apiResponse, isLoading, error } = useGetReportsIncidentAlertVolumes(queryParams);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!apiResponse?.data || apiResponse.data.length === 0) {
      return { categories: [], seriesData: [] };
    }

    // Sort data by year then month
    const sortedData = sortData(apiResponse.data);

    const categories = sortedData.map(item => `${item.month.substring(0, 3)} ${item.year}`);
    const seriesData = sortedData.map(item => parseInt(item.score || '0', 10)); // Convert score string to number

    return { categories, seriesData };
  }, [apiResponse?.data]);

  // --- Chart Configuration (Bar Chart Example) ---
  const chartOptions: ApexCharts.ApexOptions = useMemo(() => ({
    chart: {
      type: 'bar',
      height: 350,
      toolbar: {
        show: false,
      },
      background: 'transparent',
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        // endingShape: 'rounded',
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent'],
    },
    xaxis: {
      categories: chartData.categories,
      labels: {
        style: {
          colors: isDark ? '#9ca3af' : '#6b7280',
        },
      },
    },
    yaxis: {
      title: {
        text: 'Volume',
        style: {
          color: isDark ? '#9ca3af' : '#6b7280',
        },
      },
      labels: {
        style: {
          colors: isDark ? '#9ca3af' : '#6b7280',
        },
      },
    },
    fill: {
      opacity: 1,
      colors: [isDark ? '#38bdf8' : '#0ea5e9'] // Example color
    },
    tooltip: {
      shared: true,
      intersect: false,
    },
    grid: {
      show: false,
    },
    theme: {
      mode: isDark ? 'dark' : 'light',
    },
  }), [isDark, chartData]);

  const series = useMemo(() => [
    {
      name: 'Volume',
      data: chartData.seriesData,
    },
  ], [chartData]);

  // --- Render Logic ---
  const renderContent = () => {
    if (isLoading) {
      return <Skeleton className="h-[350px] w-full rounded-lg" />;
    }

    if (error) {
      return (
        <div className="text-destructive-foreground bg-destructive p-4 rounded-md">
          Error loading incident/alert volume: {error.message}
        </div>
      );
    }

    if (!apiResponse?.data || apiResponse.data.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-8">
          No incident/alert volume data available for the selected period.
        </div>
      );
    }

    return (
      <ApexChart
        type="bar"
        height={350}
        options={chartOptions}
        series={series}
      />
    );
  };

  return (
    <Card className={isDark ? "bg-card border" : "bg-card"}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col space-y-1.5">
          <CardTitle className="text-base font-medium">Incident & Alert Volume (Report)</CardTitle>
          <CardDescription>Monthly volume trend</CardDescription>
        </div>
        <Link href="/dashboard/reports/incident-alert-volume"> 
          <Button variant="outline" size="sm">Manage All</Button>
        </Link>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default ReportsIncidentAlertVolumeChart;
