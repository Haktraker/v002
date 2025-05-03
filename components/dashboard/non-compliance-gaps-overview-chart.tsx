'use client';

import { useMemo } from 'react';
import { useTheme } from 'next-themes';
import ApexChart from '@/components/ui/apex-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetNonComplianceGapsOverviews } from '@/lib/api/endpoints/executive-dashboard/non-compliance-gaps-overview';
import { NonComplianceGapsOverviewQueryParams, ComplianceFrameworkType } from '@/lib/api/executive-dashboard-types/types';
import { useGlobalFilter } from '@/lib/context/GlobalFilterContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface NonComplianceGapsOverviewChartProps {
  // Props can be added if customization is needed
}

// Define a color map for compliance frameworks
const complianceColorMap: Record<ComplianceFrameworkType, string> = {
  "MITRE ATT&CK": "#10B981", // Emerald
  "ISO 27001": "#3B82F6",    // Blue
  "NIST CSF": "#F59E0B",     // Amber
  "PDPL": "#8B5CF6",        // Violet
  "CIS": "#EF4444",         // Red
};

const getColorForCompliance = (complianceType: ComplianceFrameworkType): string => {
  return complianceColorMap[complianceType] || '#6B7280'; // Default Gray
};

const NonComplianceGapsOverviewChart = ({}: NonComplianceGapsOverviewChartProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { selectedMonth, selectedYear } = useGlobalFilter();

  const queryParams: NonComplianceGapsOverviewQueryParams = useMemo(() => ({
    month: selectedMonth === 'All' ? undefined : selectedMonth,
    year: selectedYear === 'All' ? undefined : selectedYear,
  }), [selectedMonth, selectedYear]);

  const { data: apiResponse, isLoading, error } = useGetNonComplianceGapsOverviews(queryParams);

  const chartData = useMemo(() => {
    if (!apiResponse?.data) {
      return { categories: [], series: [], colors: [] };
    }

    const complianceScores = apiResponse.data.reduce((acc, item) => {
      const scoreValue = parseFloat(item.score);
      if (!isNaN(scoreValue)) {
        acc[item.compliance] = (acc[item.compliance] || 0) + scoreValue;
      }
      return acc;
    }, {} as { [key in ComplianceFrameworkType]: number });

    const categories = Object.keys(complianceScores) as ComplianceFrameworkType[];
    const seriesData = categories.map(type => complianceScores[type]);
    const colors = categories.map(type => getColorForCompliance(type));

    return {
      categories: categories,
      series: [{ name: 'Score', data: seriesData }],
      colors: colors
    };
  }, [apiResponse]);

  const chartOptions: ApexCharts.ApexOptions = useMemo(() => ({
    chart: {
      type: 'bar',
      height: 350,
      toolbar: { show: false },
      background: 'transparent',
      foreColor: isDark ? '#f8fafc' : '#334155',
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        endingShape: 'rounded',
        distributed: true,
      },
    },
    colors: chartData.colors,
    dataLabels: {
      enabled: false
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
    },
    xaxis: {
      categories: chartData.categories,
      labels: {
        style: {
          colors: isDark ? '#9ca3af' : '#6b7280',
          fontSize: '12px',
          fontFamily: 'inherit',
        },
        rotate: -45,
        rotateAlways: chartData.categories.length > 4,
        trim: true,
        maxHeight: 60,
      },
      axisBorder: { color: isDark ? '#374151' : '#e5e7eb' },
      axisTicks: { color: isDark ? '#374151' : '#e5e7eb' },
    },
    yaxis: {
      title: { text: 'Score' },
      labels: {
        style: {
          colors: isDark ? '#9ca3af' : '#6b7280',
          fontSize: '12px',
          fontFamily: 'inherit',
        },
        formatter: (val) => val.toFixed(0)
      },
    },
    fill: { opacity: 1 },
    tooltip: {
      shared: true,
      intersect: false,
      theme: isDark ? 'dark' : 'light',
      y: {
        formatter: (val, { dataPointIndex, w }) => {
          const category = w.globals.labels[dataPointIndex];
          return `${category}: ${val.toFixed(0)} points`;
        }
      },
      style: { fontFamily: 'inherit', fontSize: '12px' }
    },
    grid: { show: false },
    legend: { show: false }
  }), [isDark, chartData]);

  const renderContent = () => {
    if (isLoading) return <Skeleton className="h-[350px] w-full" />;
    if (error) return <div className="text-destructive-foreground bg-destructive p-4 rounded-md">Error: {error.message}</div>;
    if (!chartData || chartData.series[0]?.data.length === 0) return <div className="text-center text-muted-foreground py-8">No data available.</div>;
    return <ApexChart type="bar" height={350} options={chartOptions} series={chartData.series} />;
  };

  return (
    <Card className={`flex-1 ${isDark ? "bg-[#171727] border-0" : "bg-white"}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col space-y-1.5">
          <CardTitle>Non-Compliance Gaps Overview</CardTitle>
          <CardDescription>Score distribution by compliance framework</CardDescription>
        </div>
        <Link href="/dashboard/executive-dashboard/non-compliance-gaps-overview">
          <Button variant="outline" size="sm">Manage All</Button>
        </Link>
      </CardHeader>
      <CardContent className="pt-2">
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default NonComplianceGapsOverviewChart;
