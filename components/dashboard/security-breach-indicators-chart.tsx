'use client';

import { useMemo } from 'react';
import { useTheme } from 'next-themes';
import ApexChart from '@/components/ui/apex-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetSecurityBreachIndicators } from '@/lib/api/endpoints/executive-dashboard/security-breach-indicators';
import { SecurityBreachIndicatorsQueryParams, SecurityBreachIndicatorType } from '@/lib/api/executive-dashboard-types/types';
import { useGlobalFilter } from '@/lib/context/GlobalFilterContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Define interfaces for component props
interface SecurityBreachIndicatorsChartProps {
  // Props can be added if customization is needed
}

// Define a color map for indicator types
const indicatorColorMap: Record<SecurityBreachIndicatorType, string> = {
  "Compromised Employees": "#EF4444", // Red
  "Account Take Over": "#F97316", // Orange
  "3rd Party Leaked Credentials": "#F59E0B", // Amber
  "Brand Reputation": "#8B5CF6", // Violet
};

// Function to get color, defaulting if type not found
const getColorForIndicatorType = (indicatorType: SecurityBreachIndicatorType): string => {
  return indicatorColorMap[indicatorType] || '#6B7280'; // Default Gray
};

// --- COMPONENT START ---
const SecurityBreachIndicatorsChart = ({}: SecurityBreachIndicatorsChartProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { selectedMonth, selectedYear } = useGlobalFilter();

  // Prepare query params based on global filters
  const queryParams: SecurityBreachIndicatorsQueryParams = useMemo(() => ({
    month: selectedMonth === 'All' ? undefined : selectedMonth,
    year: selectedYear === 'All' ? undefined : selectedYear,
  }), [selectedMonth, selectedYear]);

  // Fetch data using the hook and filters
  const { data: apiResponse, isLoading, error } = useGetSecurityBreachIndicators(queryParams);

  // Process data for the chart
  const chartData = useMemo(() => {
    if (!apiResponse?.data) {
      return { categories: [], series: [], colors: [] };
    }

    // Aggregate scores by indicator type
    const indicatorScores = apiResponse.data.reduce((acc, item) => {
      const scoreValue = parseFloat(item.score); // Convert score string to number
      if (!isNaN(scoreValue)) {
        acc[item.indicator] = (acc[item.indicator] || 0) + scoreValue;
      }
      return acc;
    }, {} as { [key in SecurityBreachIndicatorType]: number });

    const categories = Object.keys(indicatorScores) as SecurityBreachIndicatorType[];
    const seriesData = categories.map(type => indicatorScores[type]);
    const colors = categories.map(type => getColorForIndicatorType(type));

    return {
      categories: categories,
      series: [{ name: 'Score', data: seriesData }],
      colors: colors
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
        // Rotate labels if they overlap
        rotate: -45,
        rotateAlways: chartData.categories.length > 5, // Rotate only if many categories
        trim: true,
        maxHeight: 60,
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
        formatter: (val) => val.toFixed(0)
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      shared: true,
      intersect: false,
      theme: isDark ? 'dark' : 'light',
      y: {
        formatter: function (val, { dataPointIndex, w }) {
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
        show: false
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
          Error loading Security Breach Indicators: {error.message}
        </div>
      );
    }

    if (!chartData || chartData.series.length === 0 || chartData.series[0].data.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-8">
          No security breach indicator data available for the selected period.
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
          <CardTitle>Security Breach Indicators</CardTitle>
          <CardDescription>Score distribution by indicator for {selectedMonth === 'All' ? 'All Months' : selectedMonth}, {selectedYear === 'All' ? 'All Years' : selectedYear}</CardDescription>
        </div>
        <Link href="/dashboard/executive-dashboard/security-breach-indicators">
          <Button variant="outline" size="sm">Manage All</Button>
        </Link>
      </CardHeader>
      <CardContent className="pt-2">
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default SecurityBreachIndicatorsChart;
