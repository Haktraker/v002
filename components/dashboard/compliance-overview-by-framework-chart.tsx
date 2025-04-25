'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ComplianceFrameworkOverview } from '@/lib/api/types';

const ApexChart = dynamic(() => import('@/components/ui/apex-chart'), { ssr: false });

interface ComplianceOverviewByFrameworkChartProps {
  data?: ComplianceFrameworkOverview[];
  isLoading?: boolean;
  error?: any;
}

export function ComplianceOverviewByFrameworkChart({
  data,
  isLoading,
  error,
}: ComplianceOverviewByFrameworkChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const frameworkGroups = useMemo(() => {
    if (!data) return {};
    return data.reduce((acc, item) => {
      item?.bu?.forEach(bu => {
        bu?.framework?.forEach(f => {
          if (!acc[f.frameworkName]) {
            acc[f.frameworkName] = { compliant: 0, nonCompliant: 0 };
          }
          if (f.status === 'Compliant') {
            acc[f.frameworkName].compliant += f.frameworkScore;
          } else {
            acc[f.frameworkName].nonCompliant += f.frameworkScore;
          }
        });
      });
      return acc;
    }, {} as Record<string, { compliant: number; nonCompliant: number }>);
  }, [data]);

  const chartOptions = useMemo((): ApexCharts.ApexOptions => ({
    chart: {
      type: 'bar',
      height: 350,
      stacked: false,
      background: 'transparent',
      foreColor: isDark ? '#f8fafc' : '#334155',
      toolbar: { show: false },
    },
    plotOptions: {
      bar: { horizontal: false, columnWidth: '45%' },
    },
    dataLabels: { enabled: false },
    stroke: { show: false, width: 1, colors: ['transparent'] },
    xaxis: {
      categories: Object.keys(frameworkGroups),
      labels: {
        style: {
          colors: `hsl(var(--muted-foreground))`,
          fontSize: '14px',
          fontFamily: 'inherit',
        },
      },
      axisBorder: { color: `hsl(var(--border))` },
      axisTicks: { color: `hsl(var(--border))` },
    },
    yaxis: {
      title: {
        text: 'Score',
        style: { color: `hsl(var(--muted-foreground))`, fontFamily: 'inherit' },
      },
      labels: {
        style: { colors: `hsl(var(--muted-foreground))`, fontFamily: 'inherit' },
      },
    },
    fill: {
      opacity: 1,
      colors: [
        `hsl(var(--success))`,
        `hsl(var(--destructive))`,
      ],
    },
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      fontSize: '14px',
      fontFamily: 'inherit',
      labels: { colors: `hsl(var(--foreground))` },
      itemMargin: { horizontal: 10, vertical: 5 },
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: {
        formatter: (val: number) => val.toString(),
      },
      style: { fontFamily: 'inherit', fontSize: '14px' },
    },
    grid: {show:false},
  }), [isDark, frameworkGroups]);

  const chartSeries = useMemo(() => [
    {
      name: 'Compliant',
      data: Object.values(frameworkGroups).map(item => item.compliant),
    },
    {
      name: 'Non-Compliant',
      data: Object.values(frameworkGroups).map(item => item.nonCompliant),
    },
  ], [frameworkGroups]);

  const renderContent = () => {
    if (isLoading) {
      return <Skeleton className="h-[350px] w-full" />;
    }

    if (error) {
      return (
        <div className="text-destructive-foreground bg-destructive p-4 rounded-md">
          Error loading framework overview: {error.message}
        </div>
      );
    }

    if (Object.keys(frameworkGroups).length === 0) {
      return (
        <div className="text-center text-muted-foreground py-8">
          No framework compliance data available.
        </div>
      );
    }

    return (
      <ApexChart
        options={chartOptions}
        series={chartSeries}
        type="bar"
        height={350}
      />
    );
  };

  return (
    <Card className={`flex-1 flex flex-col ${isDark ? "bg-[#171727] border-0" : "bg-white"}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col space-y-1.5">
          <CardTitle className="text-base font-medium">Framework Compliance Overview</CardTitle>
          <CardDescription>Compliant vs Non-Compliant Scores</CardDescription>
        </div>
        <Link href="/dashboard/security-breach-indicators/compliance-frameworks">
          <Button variant="outline">
            Manage All
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
