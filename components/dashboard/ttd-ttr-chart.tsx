'use client';

import { useMemo } from 'react';
import { useTheme } from 'next-themes';
import ApexChart from '@/components/ui/apex-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetTtdTtrRecords } from '@/lib/api/endpoints/executive-dashboard/ttd-ttr';
import { TtdTtrQueryParams, TtdTtr } from '@/lib/api/executive-dashboard-types/types';
import { useGlobalFilter } from '@/lib/context/GlobalFilterContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Helper to format month/year for labels
const formatLabel = (year: string, month: string): string => {
  const monthNum = parseInt(month, 10);
  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) return `${year}-${month}`;
  const monthName = new Date(Number(year), monthNum - 1).toLocaleString('default', { month: 'short' });
  return `${monthName} ${year}`;
};

const TtdTtrChart = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { selectedMonth, selectedYear } = useGlobalFilter();

  const queryParams: TtdTtrQueryParams = useMemo(() => ({
    month: selectedMonth === 'All' ? undefined : selectedMonth,
    year: selectedYear === 'All' ? undefined : selectedYear,
    // No need to filter by indicator here, we want both TTD and TTR
  }), [selectedMonth, selectedYear]);

  // Data is pre-sorted chronologically by the API hook
  const { data: apiResponse, isLoading, error } = useGetTtdTtrRecords(queryParams);

  const chartData = useMemo(() => {
    if (!apiResponse?.data) {
      return { categories: [], series: [] };
    }

    const dataMap: Record<string, { ttd?: number; ttr?: number }> = {};
    const categoriesSet = new Set<string>();

    // Group data by month/year and separate TTD/TTR
    apiResponse.data.forEach(item => {
      const label = formatLabel(item.year, item.month);
      categoriesSet.add(label);
      if (!dataMap[label]) {
        dataMap[label] = {};
      }
      const score = parseFloat(item.score);
      if (!isNaN(score)) {
          if (item.indicator === 'TTD') {
            dataMap[label].ttd = score;
          } else if (item.indicator === 'TTR') {
            dataMap[label].ttr = score;
          }
      }
    });

    // Ensure categories are sorted chronologically (Set maintains insertion order, which is already sorted by hook)
    const categories = Array.from(categoriesSet);

    const ttdSeriesData = categories.map(cat => dataMap[cat]?.ttd ?? null); // Use null for missing data points
    const ttrSeriesData = categories.map(cat => dataMap[cat]?.ttr ?? null); // Use null for missing data points

    // Only include series if they have at least one non-null data point
    const series = [];
    if (ttdSeriesData.some(d => d !== null)) {
        series.push({ name: 'TTD (Time To Detect)', data: ttdSeriesData });
    }
    if (ttrSeriesData.some(d => d !== null)) {
        series.push({ name: 'TTR (Time To Resolve)', data: ttrSeriesData });
    }

    return {
      categories: categories,
      series: series
    };
  }, [apiResponse]);

  const chartOptions: ApexCharts.ApexOptions = useMemo(() => ({
    chart: {
      type: 'line', // Changed to line chart
      height: 350,
      toolbar: { show: false },
      background: 'transparent',
      foreColor: isDark ? '#f8fafc' : '#334155',
      zoom: { enabled: false },
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 3, // Slightly thicker lines
    },
    xaxis: {
      type: 'category', 
      categories: chartData.categories,
      labels: {
        style: {
          colors: isDark ? '#9ca3af' : '#6b7280',
          fontSize: '12px',
          fontFamily: 'inherit',
        },
        trim: true,
      },
      axisBorder: { color: isDark ? '#374151' : '#e5e7eb' },
      axisTicks: { color: isDark ? '#374151' : '#e5e7eb' },
    },
    yaxis: {
      title: {
        text: 'Time (e.g., hours)', // Adjust unit as needed
        style: {
            color: isDark ? '#9ca3af' : '#6b7280',
            fontSize: '12px',
            fontWeight: 500,
            fontFamily: 'inherit',
        }
      },
      labels: {
        style: {
          colors: isDark ? '#9ca3af' : '#6b7280',
          fontSize: '12px',
          fontFamily: 'inherit',
        },
        formatter: (val) => val !== null ? val.toFixed(1) : '' // Format y-axis, handle null
      },
      min: 0, // Start y-axis at 0
    },
    // Removed fill as it's a line chart
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      x: {
          formatter: function (val, { dataPointIndex, w }) {
              // Use the category label directly
              return w.globals.categoryLabels[dataPointIndex];
          }
      },
      y: {
        formatter: function (val, { seriesIndex, w }) {
            if (val === null) return 'N/A';
            const seriesName = w.globals.seriesNames[seriesIndex]?.split(' (')[0]; // Get TTD or TTR
            return `${val.toFixed(1)} hours`; // Adjust unit as needed
        },
        title: {
            formatter: (seriesName: string) => seriesName + ':'
        }
      },
      style: { fontFamily: 'inherit', fontSize: '12px' }
    },
    grid: {
        show: false,
    },
    legend: {
        show: chartData.series.length > 1, // Show legend only if both TTD and TTR data exist
        position: 'top',
        horizontalAlign: 'left',
        fontFamily: 'inherit',
        fontSize: '12px',
        markers: {
            radius: 12,
            size: 6,
        },
        itemMargin: {
            horizontal: 10,
        }
    },
    colors: ['#3b82f6', '#ef4444'], // Colors for TTD (Blue) and TTR (Red)
    markers: {
      size: 5,
      hover: {
        size: 7
      }
    }
  }), [isDark, chartData]);

  const renderContent = () => {
    if (isLoading) return <Skeleton className="h-[350px] w-full" />;
    if (error) return <div className="text-destructive-foreground bg-destructive p-4 rounded-md">Error: {error.message}</div>;
    if (!chartData || chartData.series.length === 0 || chartData.categories.length === 0) {
      return <div className="text-center text-muted-foreground py-8">No TTD/TTR data available.</div>;
    }
    return <ApexChart type="line" height={350} options={chartOptions} series={chartData.series} />;
  };

  return (
    <Card className={`flex-1 ${isDark ? "bg-[#171727] border-0" : "bg-white"}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col space-y-1.5">
          <CardTitle>TTD & TTR Trends</CardTitle>
          <CardDescription>Time To Detect vs Time To Resolve</CardDescription>
        </div>
        <Link href="/dashboard/executive-dashboard/ttd-ttr">
          <Button variant="outline" size="sm">Manage All</Button>
        </Link>
      </CardHeader>
      <CardContent className="pt-2">
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default TtdTtrChart;
