'use client';

import { useMemo } from 'react';
import { useTheme } from 'next-themes';
import ApexChart from '@/components/ui/apex-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetIncidentAlertVolumes } from '@/lib/api/endpoints/executive-dashboard/incident-and-alert-volume';
import { IncidentAndAlertVolumeQueryParams } from '@/lib/api/executive-dashboard-types/types';
import { useGlobalFilter } from '@/lib/context/GlobalFilterContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface IncidentAndAlertVolumeChartProps {
  // Props can be added if customization is needed
}

// Helper to format month/year for labels
const formatLabel = (year: string, month: string): string => {
  const monthNum = parseInt(month, 10);
  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) return `${year}-${month}`;
  const monthName = new Date(Number(year), monthNum - 1).toLocaleString('default', { month: 'short' });
  return `${monthName} ${year}`;
};

const IncidentAndAlertVolumeChart = ({}: IncidentAndAlertVolumeChartProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { selectedMonth, selectedYear } = useGlobalFilter();

  const queryParams: IncidentAndAlertVolumeQueryParams = useMemo(() => ({
    month: selectedMonth === 'All' ? undefined : selectedMonth,
    year: selectedYear === 'All' ? undefined : selectedYear,
  }), [selectedMonth, selectedYear]);

  const { data: apiResponse, isLoading, error } = useGetIncidentAlertVolumes(queryParams);

  const chartData = useMemo(() => {
    if (!apiResponse?.data) {
      return { categories: [], series: [] };
    }
    // Sort data chronologically
    const sortedData = [...apiResponse.data].sort((a, b) => {
        const dateA = new Date(parseInt(a.year, 10), parseInt(a.month, 10) - 1);
        const dateB = new Date(parseInt(b.year, 10), parseInt(b.month, 10) - 1);
        return dateA.getTime() - dateB.getTime();
    });

    const categories = sortedData.map(item => formatLabel(item.year, item.month));
    const seriesData = sortedData.map(item => parseFloat(item.score) || 0);

    return {
      categories: categories,
      series: [{ name: 'Volume', data: seriesData }]
    };
  }, [apiResponse]);

  const chartOptions: ApexCharts.ApexOptions = useMemo(() => ({
    chart: {
      type: 'area', // Changed to area chart
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
      curve: 'smooth'
    },
    xaxis: {
      type: 'category', // Use category for month/year labels
      categories: chartData.categories,
      labels: {
        style: {
          colors: isDark ? '#9ca3af' : '#6b7280',
          fontSize: '12px',
          fontFamily: 'inherit',
        },
        // rotate: -45, // Optionally rotate if needed
        // rotateAlways: false,
        // trim: true,
        // maxHeight: 60,
      },
      axisBorder: { color: isDark ? '#374151' : '#e5e7eb' },
      axisTicks: { color: isDark ? '#374151' : '#e5e7eb' },
    },
    yaxis: {
      title: {
        text: 'Volume / Score',
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
        formatter: (val) => val.toFixed(0) // Format y-axis
      },
    },
    fill: {
      opacity: 0.3, // Area chart fill opacity
      type: 'gradient',
       gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.9,
        stops: [0, 90, 100]
      }
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      x: {
        // formatter: function (val, { dataPointIndex, w }) {
        //     // If using datetime type on x-axis, format it here
        //     return new Date(val).toLocaleDateString(); 
        // },
      },
      y: {
        formatter: function (val) {
          return val.toFixed(0) + " incidents/alerts";
        }
      },
      style: { fontFamily: 'inherit', fontSize: '12px' }
    },
    grid: {
        show: false
    },
    legend: {
        show: false
    }
  }), [isDark, chartData]);

  const renderContent = () => {
    if (isLoading) return <Skeleton className="h-[350px] w-full" />;
    if (error) return <div className="text-destructive-foreground bg-destructive p-4 rounded-md">Error: {error.message}</div>;
    if (!chartData || chartData.series[0]?.data.length === 0) return <div className="text-center text-muted-foreground py-8">No volume data available.</div>;
    return <ApexChart type="area" height={350} options={chartOptions} series={chartData.series} />;
  };

  return (
    <Card className={`flex-1 ${isDark ? "bg-[#171727] border-0" : "bg-white"}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col space-y-1.5">
          <CardTitle>Incident & Alert Volume</CardTitle>
          <CardDescription>Volume trend over selected period</CardDescription>
        </div>
        <Link href="/dashboard/executive-dashboard/incident-and-alert-volume">
          <Button variant="outline" size="sm">Manage All</Button>
        </Link>
      </CardHeader>
      <CardContent className="pt-2">
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default IncidentAndAlertVolumeChart;
