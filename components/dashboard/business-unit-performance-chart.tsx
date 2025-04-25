'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
import { BusinessUnitPerformance, ControlCategoryName } from '@/lib/api/types'; // Import ControlCategoryName if needed elsewhere
import { CATEGORY_LIST } from '@/lib/constants/category-list';
import { Skeleton } from '@/components/ui/skeleton';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '../ui/button';

// Dynamically import ApexCharts to avoid SSR issues
const ApexChart = dynamic(() => import('@/components/ui/apex-chart'), { ssr: false });

interface BusinessUnitPerformanceChartProps {
  data?: BusinessUnitPerformance[];
  title?: string; // Keep title prop for the CardHeader
  isLoading?: boolean;
  error?: any;
}

const BusinessUnitPerformanceChart: React.FC<BusinessUnitPerformanceChartProps> = ({
  data,
  title = "Average Business Unit Performance", // Default title for CardHeader
  isLoading = false,
  error,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Process data to calculate average scores
  const chartData = useMemo(() => {
    const performanceData = data?.[0]; // Use the first entry

    if (!performanceData || !performanceData.bu || performanceData.bu.length === 0) {
      return { series: [], labels: [] };
    }

    const labels = CATEGORY_LIST;

    // Calculate average score for each category across all BUs
    const averageScores = labels.map(categoryName => {
      let totalScore = 0;
      let validBuCount = 0; // Count BUs that actually have this category

      performanceData.bu.forEach(bu => {
        const categoryDetail = bu.categories.find(c => c.category === categoryName);
        // Only include scores that are valid numbers
        if (categoryDetail?.score !== undefined && categoryDetail.score !== null && !isNaN(categoryDetail.score)) {
          totalScore += categoryDetail.score;
          validBuCount++;
        }
      });

      // Calculate average, default to 0 if no BUs had a score for this category
      return validBuCount > 0 ? totalScore / validBuCount : 0;
    });

    // Create a single series representing the average
    const series = [{
      name: 'Average Performance', // Single series name
      data: averageScores,
    }];

    return { series, labels };
  }, [data]);

  // Define chart options
  const chartOptions = useMemo<ApexOptions>(() => ({
    chart: {
      type: 'radar',
      height: 350,
      background: 'transparent',
      foreColor: isDark ? '#f8fafc' : '#334155',
      toolbar: { show: false, tools: { download: true } }, // Toolbar is hidden by default now
        dropShadow: {
           enabled: true,
           blur: 1,
           left: 1,
           top: 1
        }
    },
    // Remove the title property for the chart itself
    // title: { ... }
    colors: ['#FFA500'], // Set series color to orange
    xaxis: {
      categories: chartData.labels,
      labels: {
         show: true,
         style: {
           colors: Array(chartData.labels.length).fill(isDark ? '#9ca3af' : '#6b7280'),
           fontSize: '11px',
           fontFamily: 'inherit',
         },
      }
    },
    yaxis: {
      show: true,
      tickAmount: 4,
      min: 0,
      max: 100,
      labels: {
        style: {
          colors: isDark ? '#9ca3af' : '#6b7280',
          fontFamily: 'inherit',
        },
        formatter: (val: number) => val.toFixed(0)
      }
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['#FFA500'], // Set stroke color to orange
      dashArray: 0
    },
    fill: {
      opacity: 0.25,
      colors: ['#FFA500'] // Set fill color to orange
    },
    markers: {
      size: 4,
      colors: ['#FFA500'], // Set marker color
       strokeColors: '#fff', // White border for markers
       strokeWidth: 2,
      hover: {
        size: 6
      }
    },
    plotOptions: {
      radar: {
        polygons: {
          strokeColors: isDark ? '#4b5563' : '#e5e7eb',
          connectorColors: isDark ? '#4b5563' : '#e5e7eb',
          fill: {
              colors: isDark ? ['#374151', '#4b5563'] : ['#f9fafb', '#f3f4f6']
          }
        }
      }
    },
    legend: {
      show: false // Hide legend as there's only one series
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: {
        formatter: (val: number) => `${val?.toFixed(0)}` // Score tooltip
      }
    },
  }), [isDark, chartData.labels]);

  // Render logic based on state
  const renderContent = () => {
    if (isLoading) {
      return <Skeleton className="h-[350px] w-full" />;
    }

    if (error) {
      return (
        <div className="text-destructive-foreground bg-destructive p-4 rounded-md text-sm h-[350px] flex items-center justify-center">
          Error loading performance data: {error.message || 'Unknown error'}
        </div>
      );
    }

    if (!chartData || chartData.series.length === 0 || chartData.series[0].data.every(score => score === 0)) { // Check if all average scores are 0 too
      return (
        <div className="text-center text-muted-foreground py-8 text-sm h-[350px] flex items-center justify-center">
          No business unit performance data available to display for the selected period.
        </div>
      );
    }

    // Render chart only on client-side when options/series available
    return typeof window !== 'undefined' ? (
        <ApexChart
            options={chartOptions}
            series={chartData.series}
            type="radar"
            height={350}
            width="100%"
        />
    ) : (
        <Skeleton className="h-[350px] w-full" /> // Placeholder during SSR or before hydration
    );
  };

  return (
    <Card className={`flex flex-col ${isDark ? 'bg-[#171727] border-0' : 'bg-white'}`}>
      <CardHeader className="flex flex-row justify-between items-center">
       <div className="flex flex-col">
         {/* Use the static title prop here */}
         <CardTitle className="text-base font-medium">{title}</CardTitle>
         <CardDescription>Average performance across categories.</CardDescription>
       </div>
        {/* Update link when the manage page exists */}
        <Link href="/dashboard/cybersecurity-compliance-dashboard/business-unit-performance"> 
           <Button variant="outline" size="sm">Manage All</Button>
        </Link>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center pt-4 min-h-[382px]">
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default BusinessUnitPerformanceChart;
