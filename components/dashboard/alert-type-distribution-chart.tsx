'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { 
  AlertTypeDistribution, 
  AlertTypeName, 
  AlertTypeDistributionAlert 
} from '@/lib/api/types';
import { useGetAlertTypeDistributions } from '@/lib/api/endpoints/business-units-security/alert-type-distribution';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ApexOptions } from 'apexcharts';
import Link from 'next/link';
import { Button } from '../ui/button';

// Dynamically import ApexCharts
const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface AlertTypeDistributionChartProps {
  className?: string;
  // Add query params props if needed for filtering later
  // e.g., month?: string; year?: string;
}

const AlertTypeDistributionChart: React.FC<AlertTypeDistributionChartProps> = ({
  className,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Fetch data - potentially add params here if filtering is needed
  const { 
    data: distributionData, 
    isLoading, 
    error 
  } = useGetAlertTypeDistributions();

  // Aggregate alert counts across all records and BUs
  const aggregatedData = useMemo(() => {
    if (!distributionData) return null;

    const counts: Record<AlertTypeName, number> = {
      "Malware": 0,
      "Phishing": 0,
      "Auth Failure": 0,
      "Policy Violation": 0,
      "Data Exfil": 0,
    };

    distributionData.forEach(record => {
      record.bu.forEach(bu => {
        bu.alert.forEach(alertItem => {
          if (counts.hasOwnProperty(alertItem.name)) {
            counts[alertItem.name] += alertItem.count;
          }
        });
      });
    });

    // Filter out types with zero count
    const labels = Object.keys(counts).filter(key => counts[key as AlertTypeName] > 0) as AlertTypeName[];
    const series = labels.map(label => counts[label]);

    return { labels, series };

  }, [distributionData]);

  // Chart Options
  const chartOptions = useMemo((): ApexOptions => {
    const textColor = isDark ? '#e2e8f0' : '#475569'; // Tailwind slate-200 / slate-600
    const chartThemeMode = isDark ? 'dark' : 'light';

    return {
      chart: {
        type: 'pie',
        height: 350,
        background: 'transparent',
        foreColor: textColor,
      },
      labels: aggregatedData?.labels || [],
      series: aggregatedData?.series || [],
      legend: {
        position: 'bottom',
        fontFamily: 'inherit',
        labels: { colors: textColor }
      },
      tooltip: {
        theme: chartThemeMode,
        y: {
          formatter: (val: number) => `${val} alerts`,
        },
        style: { fontFamily: 'inherit' },
      },
      dataLabels: {
        enabled: true,
        style: {
          fontFamily: 'inherit',
          // colors: [isDark ? '#fff' : '#333'] // Optional: data label color
        },
        formatter: (val: number, opts) => {
            // Show percentage on the slice
            const seriesIndex = opts.seriesIndex;
            const seriesTotal = opts.w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
            const percentage = (opts.w.globals.series[seriesIndex] / seriesTotal * 100).toFixed(1) + '%';
            return percentage; 
        },
        dropShadow: { // Make labels more readable
           enabled: true,
           top: 1,
           left: 1,
           blur: 1,
           color: '#000',
           opacity: 0.35
        }
      },
      // Example color scheme (adjust as needed)
      colors: [
        '#ef4444', // red-500 (Malware)
        '#f97316', // orange-500 (Phishing)
        '#eab308', // yellow-500 (Auth Failure)
        '#3b82f6', // blue-500 (Policy Violation)
        '#8b5cf6'  // violet-500 (Data Exfil)
      ],
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: '100%'
            },
            legend: {
              position: 'bottom'
            }
          }
        }
      ]
    };
  }, [aggregatedData, isDark]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col space-y-3 p-6">
          <Skeleton className="h-8 w-[200px] mb-4 self-center" />
          <Skeleton className="h-64 w-64 rounded-full self-center" />
          <div className="flex justify-center gap-4 pt-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive" className="mx-6 my-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Chart</AlertTitle>
          <AlertDescription>
            Failed to load Alert Type Distribution data: {error instanceof Error ? error.message : 'Unknown error'}
          </AlertDescription>
        </Alert>
      );
    }

    if (!aggregatedData || aggregatedData.series.length === 0) {
      return (
        <Alert className="mx-6 my-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Data Available</AlertTitle>
          <AlertDescription>
            There is no Alert Type Distribution data to display.
          </AlertDescription>
        </Alert>
      );
    }

    // Ensure the key changes if labels change to force re-render
    const chartKey = aggregatedData.labels.join('-'); 

    return (
      <ApexChart
        key={chartKey}
        options={chartOptions}
        series={aggregatedData.series}
        type="pie"
        height={350}
      />
    );
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className='flex flex-row justify-between items-center flex-row'>
        <div className='flex flex-col'>

        <CardTitle>Alert Type Distribution</CardTitle>
        <CardDescription>
          Distribution of alert types across all business units.
        </CardDescription>
        </div>
        <div className='flex flex-row gap-2'>
            <Link href='/dashboard/business-units-security/alert-type-distribution'>
                <Button variant='outline'>
                    Manage All
                </Button>
            </Link>
        </div>
      </CardHeader>
      <CardContent className="flex justify-center items-center pt-4 pr-0 pb-2 pl-2">
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default AlertTypeDistributionChart;
