'use client';

import { useMemo } from 'react';
import { useTheme } from 'next-themes';
import ApexChart from '@/components/ui/apex-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetDigitalRisks } from '@/lib/api/endpoints/executive-dashboard/digital-risk-intelligence';
import { DigitalRiskIntelligence, DigitalRiskIntelligenceQueryParams, RiskLevel, RiskIndicator } from '@/lib/api/executive-dashboard-types/types';
import { useGlobalFilter } from '@/lib/context/GlobalFilterContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Define colors for risk levels
const riskLevelColors: Record<RiskLevel, string> = {
  "no risk": '#22c55e',  // Green
  medium: '#f59e0b',  // Amber
  high: '#ef4444',    // Red
  critical: '#8b5cf6' // Violet
};

// Order for stacking and legend
const riskLevelOrder: RiskLevel[] = ['no risk', 'medium', 'high', 'critical'];
const riskIndicatorOrder: RiskIndicator[] = ["executive protection", "situational awareness", "impersonations", "social media"];

// Helper to format indicator labels
const formatIndicatorLabel = (indicator: RiskIndicator): string => {
    return indicator.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const DigitalRiskIntelligenceChart = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { selectedMonth, selectedYear } = useGlobalFilter();

  const queryParams: DigitalRiskIntelligenceQueryParams = useMemo(() => ({
    month: selectedMonth === 'All' ? undefined : selectedMonth,
    year: selectedYear === 'All' ? undefined : selectedYear,
  }), [selectedMonth, selectedYear]);

  const { data: apiResponse, isLoading, error } = useGetDigitalRisks(queryParams);

  const chartData = useMemo(() => {
    if (!apiResponse?.data) {
      return { categories: [], series: [] };
    }

    // Initialize counts for each indicator and risk level
    const risksByIndicator: Record<RiskIndicator, Record<RiskLevel, number>> = 
        riskIndicatorOrder.reduce((acc, indicator) => {
            acc[indicator] = riskLevelOrder.reduce((lvlAcc, level) => {
                lvlAcc[level] = 0;
                return lvlAcc;
            }, {} as Record<RiskLevel, number>);
            return acc;
        }, {} as Record<RiskIndicator, Record<RiskLevel, number>>);

    // Group risks by indicator and count levels
    apiResponse.data.forEach(item => {
        // Ensure indicator exists in our predefined list (safety check)
        if (item.indicator in risksByIndicator) {
            // Ensure level exists in our predefined list (safety check)
            if (item.level in risksByIndicator[item.indicator]) {
                 risksByIndicator[item.indicator][item.level]++;
            }
        }
    });

    // Prepare series for stacked bar chart
    const series = riskLevelOrder.map(level => ({
      name: level.charAt(0).toUpperCase() + level.slice(1), // Capitalize level name for legend
      data: riskIndicatorOrder.map(indicator => risksByIndicator[indicator][level])
    }));

    const colors = riskLevelOrder.map(level => riskLevelColors[level]);
    const categories = riskIndicatorOrder.map(formatIndicatorLabel); // Use formatted labels for X-axis

    return {
      categories: categories,
      series: series,
      colors: colors
    };
  }, [apiResponse]);

  const chartOptions: ApexCharts.ApexOptions = useMemo(() => ({
    chart: {
      type: 'bar',
      height: 350,
      stacked: true, 
      toolbar: { show: false },
      background: 'transparent',
      foreColor: isDark ? '#f8fafc' : '#334155',
      zoom: { enabled: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '60%',
        borderRadius: 4,
      },
    },
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
        trim: true, 
        // Consider rotation if labels overlap significantly
        // rotate: -45, 
        // hideOverlappingLabels: true,
      },
      axisBorder: { color: isDark ? '#374151' : '#e5e7eb' },
      axisTicks: { color: isDark ? '#374151' : '#e5e7eb' },
    },
    yaxis: {
      title: {
        text: 'Risk Count',
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
      opacity: 1
    },
    colors: chartData.colors, // Assign colors based on risk level order
    tooltip: {
      shared: true,
      intersect: false,
      theme: isDark ? 'dark' : 'light',
      y: {
        formatter: function (val, { seriesIndex, dataPointIndex, w }) {
          const riskLevelName = w.globals.seriesNames[seriesIndex];
          return `${val} ${riskLevelName} risk(s)`;
        }
      },
      style: { fontFamily: 'inherit', fontSize: '12px' }
    },
    grid: {
      show: false
    },
    legend: {
        show: true, 
        position: 'top',
        horizontalAlign: 'left',
        fontFamily: 'inherit',
        fontSize: '12px',
        markers: {
            size: 6,
        },
        itemMargin: {
            horizontal: 10,
        }
    }
  }), [isDark, chartData]);

  const renderContent = () => {
    if (isLoading) return <Skeleton className="h-[350px] w-full" />;
    if (error) return <div className="text-destructive-foreground bg-destructive p-4 rounded-md">Error: {error.message}</div>;
    // Check if there are any categories (indicators) to display
    if (!chartData || chartData.categories.length === 0) return <div className="text-center text-muted-foreground py-8">No digital risk data available.</div>;
    // Check if all series data sums to zero (no risks)
    const totalRisks = chartData.series.reduce((sum, series) => sum + series.data.reduce((s, val) => s + val, 0), 0);
    if (totalRisks === 0) return <div className="text-center text-muted-foreground py-8">No digital risks found for the selected period.</div>;

    return <ApexChart type="bar" height={350} options={chartOptions} series={chartData.series} />;
  };

  return (
    <Card className={`flex-1 ${isDark ? "bg-[#171727] border-0" : "bg-white"}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col space-y-1.5">
          <CardTitle>Digital Risk Intelligence</CardTitle>
          <CardDescription>Risk count by indicator and level</CardDescription>
        </div>
        <Link href="/dashboard/executive-dashboard/digital-risk-intelligence">
          <Button variant="outline" size="sm">Manage All</Button>
        </Link>
      </CardHeader>
      <CardContent className="pt-2">
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default DigitalRiskIntelligenceChart;
