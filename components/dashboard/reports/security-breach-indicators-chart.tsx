'use client';

import { useMemo } from 'react';
import { useTheme } from 'next-themes';
import ApexChart from '@/components/ui/apex-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ReportsSecurityBreachIndicators,
  SECURITY_BREACH_INDICATOR_NAMES,
  SecurityBreachIndicatorName
} from '@/lib/api/endpoints/reports/security-breach-indicators';
import { useGetReportsSecurityBreachIndicators } from '@/lib/api/endpoints/reports/security-breach-indicators';
import { useGlobalFilter } from '@/lib/context/GlobalFilterContext'; // Assuming global filters context
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MONTHS } from '@/lib/constants/months-list'; // For potential chronological sorting if needed

// Helper to average scores for a specific indicator type from multiple records
const getAverageScore = (data: ReportsSecurityBreachIndicators[], indicatorName: SecurityBreachIndicatorName): number => {
  let totalScore = 0;
  let count = 0;
  data.forEach(record => {
    const indicator = record.indicators.find(ind => ind.indicatorName === indicatorName);
    if (indicator && indicator.score) {
      const score = parseFloat(indicator.score);
      if (!isNaN(score)) {
        totalScore += score;
        count++;
      }
    }
  });
  return count > 0 ? totalScore / count : 0;
};

const ReportsSecurityBreachIndicatorsChart = () => {
  const { theme } = useTheme();
  const { selectedMonth, selectedYear } = useGlobalFilter(); // Use global filters
  const isDark = theme === 'dark';

  const queryParams = {
    month: selectedMonth === 'All' || selectedMonth === '' ? undefined : selectedMonth,
    year: selectedYear === 'All' || selectedYear === '' ? undefined : selectedYear,
  };

  const { data: apiResponse, isLoading, error } = useGetReportsSecurityBreachIndicators(queryParams);

  const chartData = useMemo(() => {
    if (!apiResponse?.data || apiResponse.data.length === 0) {
      return { categories: SECURITY_BREACH_INDICATOR_NAMES as unknown as string[], seriesData: SECURITY_BREACH_INDICATOR_NAMES.map(() => 0) };
    }

    // If data is present, calculate average scores for each indicator type
    const seriesData = SECURITY_BREACH_INDICATOR_NAMES.map(name => 
      getAverageScore(apiResponse.data, name)
    );
    
    return { categories: SECURITY_BREACH_INDICATOR_NAMES as unknown as string[], seriesData };

  }, [apiResponse?.data]);

  const chartOptions: ApexCharts.ApexOptions = useMemo(() => ({
    chart: {
      type: 'bar',
      height: 350,
      toolbar: { show: false },
      background: 'transparent',
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '50%',
        distributed: true, // Different color for each bar if desired
      },
    },
    dataLabels: {
      enabled: true,
      formatter: function (val) {
        return Number(val).toFixed(1); // Format to one decimal place
      },
      offsetY: -20,
      style: {
        fontSize: '12px',
        colors: [isDark ? "#D1D5DB" : "#374151"]
      }
    },
    xaxis: {
      categories: chartData.categories,
      labels: {
        style: {
          colors: Array(chartData.categories.length).fill(isDark ? '#9ca3af' : '#6b7280'),
        },
      },
    },
    yaxis: {
      title: {
        text: 'Average Score',
        style: {
          color: isDark ? '#9ca3af' : '#6b7280',
        },
      },
      labels: {
        style: {
          colors: Array(1).fill(isDark ? '#9ca3af' : '#6b7280'), // For y-axis labels
        },
        formatter: function (val) {
            return val.toFixed(1);
        }
      },
    },
    fill: {
      opacity: 1,
      // Colors can be set here if `distributed: true` is not used or for specific overrides
    },
    tooltip: {
        shared: true,
        intersect: false,
      y: {
        formatter: function (val) {
          return val.toFixed(1) + " avg score";
        }
      }
    },
    grid: {
      show: false,
    },
    legend: {
      show: false // No legend needed if distributed or single series
    },
    theme: {
      mode: isDark ? 'dark' : 'light',
    },
    // Responsive options if needed
  }), [isDark, chartData]);

  const series = useMemo(() => [
    {
      name: 'Average Score',
      data: chartData.seriesData,
    },
  ], [chartData]);

  const renderContent = () => {
    if (isLoading) {
      return <Skeleton className="h-[350px] w-full rounded-lg" />;
    }
    if (error) {
      return (
        <div className="text-destructive-foreground bg-destructive p-4 rounded-md">
          Error loading Security Breach Indicators: {error.message}
        </div>
      );
    }
    if (!apiResponse?.data || apiResponse.data.length === 0 && (queryParams.month || queryParams.year) ) {
      return (
        <div className="text-center text-muted-foreground py-8">
          No Security Breach Indicator data available for the selected period.
        </div>
      );
    }
     if (!apiResponse?.data || apiResponse.data.length === 0 ) {
      return (
        <div className="text-center text-muted-foreground py-8">
          No Security Breach Indicator data available yet.
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
          <CardTitle className="text-base font-medium">Security Breach Indicators (Report)</CardTitle>
          <CardDescription>
            {queryParams.month && queryParams.year 
              ? `Average scores for ${queryParams.month}, ${queryParams.year}`
              : queryParams.year
              ? `Average scores for ${queryParams.year}`
              : queryParams.month
              ? `Average scores for ${queryParams.month}`
              : 'Overall average scores by indicator'
            }
          </CardDescription>
        </div>
        <Link href="/dashboard/reports/security-breach-indicators">
          <Button variant="outline" size="sm">Manage All</Button>
        </Link>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default ReportsSecurityBreachIndicatorsChart;
