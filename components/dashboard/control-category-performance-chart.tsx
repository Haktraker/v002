'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ControlCategoryPerformance, ControlCategoryName } from '@/lib/api/types';
import Link from 'next/link';
import { Button } from '../ui/button';

// Dynamically import ApexCharts to avoid SSR issues
const ApexChart = dynamic(() => import('@/components/ui/apex-chart'), { ssr: false });

// Define the order and names of categories for the radar chart axes
const CONTROL_CATEGORIES: ControlCategoryName[] = [
  "Access Control",
  "Data Protection",
  "Network Security",
  "Asset Management",
  "Incident Response",
  "Business Continuity"
];

interface ControlCategoryPerformanceChartProps {
  // Data might be an array if API returns multiple entries (e.g., per month)
  // We'll likely visualize the first/latest entry for the radar chart
  data?: ControlCategoryPerformance[]; 
  isLoading?: boolean;
  error?: any;
}

const ControlCategoryPerformanceChart = ({ 
  data, 
  isLoading, 
  error 
}: ControlCategoryPerformanceChartProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const chartData = useMemo(() => {
    const performanceData = data?.[0];

    if (!performanceData || !performanceData.bu || performanceData.bu.length === 0) {
      return { series: [], labels: [] };
    }

    const labels = CONTROL_CATEGORIES;
    const numBUs = performanceData.bu.length;

    // Calculate average score for each category across all BUs
    const averageScores = labels.map(categoryName => {
      let totalScore = 0;
      let validBuCount = 0; // Count BUs that actually have this category
      
      performanceData.bu.forEach(bu => {
        const categoryDetail = bu.categories.find(c => c.category === categoryName);
        if (categoryDetail?.score !== undefined && categoryDetail.score !== null) {
          totalScore += categoryDetail.score;
          validBuCount++;
        }
      });
      
      // Calculate average, default to 0 if no BUs had a score for this category
      return validBuCount > 0 ? totalScore / validBuCount : 0;
    });

    // Create a single series representing the average
    const series = [{
      name: 'Average Performance', // Series name for the average
      data: averageScores,
    }];

    return { series, labels };
  }, [data]);

  const chartOptions = useMemo(() => ({
    chart: {
      type: 'radar',
      height: 350,
      background: 'transparent',
      foreColor: isDark ? '#f8fafc' : '#334155',
      toolbar: { show: false, tools: { download: true } }, // Show download tool
    },
    // Use category names as labels for the axes
    labels: chartData.labels,
    xaxis: {
      categories: chartData.labels, // Redundant but often needed for tooltip/consistency
      labels: {
         show: true,
         style: {
           colors: Array(chartData.labels.length).fill(isDark ? '#9ca3af' : '#6b7280'), // Muted colors for axis labels
           fontSize: '11px',
           fontFamily: 'inherit',
         },
      }
    },
    yaxis: {
      show: true, // Show score values on the spokes
      tickAmount: 4, // Example: Adjust based on typical score range
      min: 0,
      max: 100, // Assuming scores are percentages or out of 100
      labels: {
        style: {
          colors: isDark ? '#9ca3af' : '#6b7280',
          fontFamily: 'inherit',
        },
        formatter: (val: number) => val.toFixed(0) // Format as integer
      }
    },
    stroke: {
      show: true,
      width: 2,
      // colors: [], // Optional: define colors per series, otherwise uses theme/default
      dashArray: 0
    },
    fill: {
      opacity: 0.25, // Semi-transparent fill for better overlap visibility
      // colors: [] // Optional: define colors per series
    },
    markers: {
      size: 4,
      hover: {
        size: 6
      }
    },
    plotOptions: {
      radar: {
        polygons: {
          // Style the background web/polygons
          strokeColors: isDark ? '#4b5563' : '#e5e7eb', // Border color of polygons
          connectorColors: isDark ? '#4b5563' : '#e5e7eb', // Color of lines connecting axis labels to chart
          fill: {
              colors: isDark ? ['#374151', '#4b5563'] : ['#f9fafb', '#f3f4f6'] // Alternating background fill
          }
        }
      }
    },
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      fontSize: '13px',
      fontFamily: 'inherit',
      labels: { colors: isDark ? '#f8fafc' : '#334155' },
      itemMargin: { horizontal: 10, vertical: 5 },
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: {
        formatter: (val: number) => `${val?.toFixed(0)}%` // Show score in tooltip
      }
    },
    // Add theme colors if needed, otherwise ApexCharts uses defaults
    // colors: ['#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0', ...], 
  }), [isDark, chartData.labels]);

  const renderContent = () => {
    if (isLoading) {
      return <Skeleton className="h-[350px] w-full" />;
    }

    if (error) {
      return (
        <div className="text-destructive-foreground bg-destructive p-4 rounded-md text-sm">
          Error loading performance data: {error.message || 'Unknown error'}
        </div>
      );
    }

    if (!chartData || chartData.series.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-8 text-sm h-[350px] flex items-center justify-center">
          No control category performance data available to display.
        </div>
      );
    }

    return (
      <ApexChart
        options={chartOptions}
        series={chartData.series}
        type="radar"
        height={350}
      />
    );
  };

  return (
    <Card className={`flex-1 flex flex-col ${isDark ? 'bg-[#171727] border-0' : 'bg-white'}`}>
      <CardHeader className="flex flex-row justify-between items-center">
       <div className="flex flex-col">
       <CardTitle className="text-base font-medium">Control Category Performance</CardTitle>
       <CardDescription>Performance scores across different control categories.</CardDescription>
       </div>
        <Link href="/dashboard/cybersecurity-compliance-dashboard">
        <Button variant="outline" size="sm">Manage All</Button>
        </Link>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center pt-4">
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default ControlCategoryPerformanceChart;
