'use client';

import { useEffect, useState, useMemo } from 'react';
import { useTheme } from 'next-themes';
import ApexChart from '@/components/ui/apex-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetThreatCompositionOverviews } from '@/lib/api/endpoints/executive-dashboard/threat-composition-overview';
import { ThreatCompositionOverview, ThreatCompositionOverviewQueryParams, ThreatCompositionOverviewType } from '@/lib/api/executive-dashboard-types/types';
import { useGlobalFilter } from '@/lib/context/GlobalFilterContext'; // Import global filter context
import Link from 'next/link'; // Import Link
import { Button } from '@/components/ui/button'; // Import Button

// Define interfaces for component props
interface ThreatCompositionOverviewChartProps {
  // Can accept additional props if needed later
}

// Define a color map for threat types
const threatTypeColorMap: Record<ThreatCompositionOverviewType, string> = {
  "ATO": "#3B82F6", // Blue
  "Insider Threats": "#EF4444", // Red
  "Trojan and Malware": "#F59E0B", // Amber
  "3rd Party leaks": "#8B5CF6", // Violet
  "Attack Surfaces": "#10B981", // Emerald
};

// Function to get color, defaulting if type not found
const getColorForThreatType = (threatType: ThreatCompositionOverviewType): string => {
  return threatTypeColorMap[threatType] || '#6B7280'; // Default Gray
};

// --- COMPONENT START ---
const ThreatCompositionOverviewChart = ({}: ThreatCompositionOverviewChartProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { selectedMonth, selectedYear } = useGlobalFilter(); // Get global filters

  // Prepare query params based on global filters
  const queryParams: ThreatCompositionOverviewQueryParams = useMemo(() => ({
    month: selectedMonth === 'All' ? undefined : selectedMonth,
    year: selectedYear === 'All' ? undefined : selectedYear,
    // Add other specific filters if needed, e.g., quarter
  }), [selectedMonth, selectedYear]);

  // Fetch data using the hook and filters
  const { data: apiResponse, isLoading, error } = useGetThreatCompositionOverviews(queryParams);

  // Process data for the chart
  const chartData = useMemo(() => {
    if (!apiResponse?.data) {
      return { categories: [], series: [], colors: [] }; // Added colors array
    }

    // Aggregate scores by threatType for the given period
    const threatScores = apiResponse.data.reduce((acc, item) => {
      const scoreValue = parseFloat(item.score); // Convert score string to number
      if (!isNaN(scoreValue)) {
        acc[item.threatType] = (acc[item.threatType] || 0) + scoreValue;
      }
      return acc;
    }, {} as { [key in ThreatCompositionOverviewType]: number });

    const categories = Object.keys(threatScores) as ThreatCompositionOverviewType[];
    const seriesData = categories.map(type => threatScores[type]);
    const colors = categories.map(type => getColorForThreatType(type)); // Generate colors based on categories

    return {
      categories: categories,
      series: [{ name: 'Score', data: seriesData }],
      colors: colors // Include colors in the returned object
    };
  }, [apiResponse]);

  // --- Chart Configuration ---
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
        distributed: true, // Important: Distribute colors across bars
      },
    },
    colors: chartData.colors, // Use the generated colors
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
      },
      axisBorder: {
        color: isDark ? '#374151' : '#e5e7eb',
      },
      axisTicks: {
        color: isDark ? '#374151' : '#e5e7eb',
      },
    },
    yaxis: {
      title: {
        text: 'Score',
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
        formatter: (val) => val.toFixed(0) // Format y-axis labels
      },
    },
    fill: {
      opacity: 1,
      // Removed static colors here as they are now dynamic
    },
    tooltip: {
      shared: true, // Set to false when using distributed colors for individual tooltips
      intersect: false,
      theme: isDark ? 'dark' : 'light',
      y: {
        formatter: function (val, { seriesIndex, dataPointIndex, w }) {
          // Get the specific category name for the hovered bar
          const category = w.globals.labels[dataPointIndex];
          return `${category}: ${val.toFixed(0)} points`;
        }
      },
      style: { fontFamily: 'inherit', fontSize: '12px' }
    },
    grid: {
      show: false,
    },
    legend: {
        show: false // Keep legend hidden as colors are tied to bars
    }
  }), [isDark, chartData]);

  // --- Render Logic ---
  const renderContent = () => {
    if (isLoading) {
      return <Skeleton className="h-[350px] w-full" />;
    }

    if (error) {
      return (
        <div className="text-destructive-foreground bg-destructive p-4 rounded-md">
          Error loading Threat Composition Overview: {error.message}
        </div>
      );
    }

    if (!chartData || chartData.series.length === 0 || chartData.series[0].data.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-8">
          No threat composition data available for the selected period.
        </div>
      );
    }

    return (
      <ApexChart
        type="bar"
        height={350}
        options={chartOptions}
        series={chartData.series}
      />
    );
  };

  return (
    <Card className={`flex-1 ${isDark ? "bg-[#171727] border-0" : "bg-white"}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col space-y-1.5">
            <CardTitle>Threat Composition Overview</CardTitle>
            <CardDescription>Score distribution by threat type for {selectedMonth === 'All' ? 'All Months' : selectedMonth}, {selectedYear === 'All' ? 'All Years' : selectedYear}</CardDescription>
        </div>
         <Link href="/dashboard/executive-dashboard/threat-composition-overview">
          <Button variant="outline" size="sm">Manage All</Button>
        </Link>
      </CardHeader>
      <CardContent className="pt-2"> {/* Adjusted padding */}
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default ThreatCompositionOverviewChart;
