'use client';

import { useMemo } from 'react';
import { useTheme } from 'next-themes';
import ApexChart from '@/components/ui/apex-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetThirdPartyThreats } from '@/lib/api/endpoints/reports/third-party-threat-intelligence';
import { ReportThirdPartyThreatIntelligence, ReportThirdPartyThreatIntelligenceQueryParams, SeverityLevel } from '@/lib/api/reports-types/types';
import { useGlobalFilter } from '@/lib/context/GlobalFilterContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Define colors for severity levels
const severityColors: Record<SeverityLevel, string> = {
  low: '#3b82f6',    // Blue
  medium: '#f59e0b',  // Amber
  high: '#ef4444',    // Red
  critical: '#8b5cf6' // Violet
};

const severityOrder: SeverityLevel[] = ['low', 'medium', 'high', 'critical'];

const ThirdPartyThreatIntelligenceChart = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { selectedMonth, selectedYear } = useGlobalFilter();

  const queryParams: ReportThirdPartyThreatIntelligenceQueryParams = useMemo(() => ({
    month: selectedMonth === 'All' ? undefined : selectedMonth,
    year: selectedYear === 'All' ? undefined : selectedYear,
  }), [selectedMonth, selectedYear]);

  const { data: apiResponse, isLoading, error } = useGetThirdPartyThreats(queryParams);

  const chartData = useMemo(() => {
    if (!apiResponse?.data) {
      return { categories: [], series: [] };
    }

    const threatsByThirdParty: Record<string, Record<SeverityLevel, number>> = {};
    const thirdParties: string[] = [];

    // Group threats by thirdParty and count severities
    apiResponse.data.forEach(item => {
      if (!threatsByThirdParty[item.thirdParty]) {
        threatsByThirdParty[item.thirdParty] = { low: 0, medium: 0, high: 0, critical: 0 };
        thirdParties.push(item.thirdParty);
      }
      if (item.severity in threatsByThirdParty[item.thirdParty]) {
        threatsByThirdParty[item.thirdParty][item.severity]++;
      }
    });

    // Prepare series for stacked bar chart
    const series = severityOrder.map(severity => ({
      name: severity.charAt(0).toUpperCase() + severity.slice(1), // Capitalize severity name for legend
      data: thirdParties.map(tp => threatsByThirdParty[tp][severity])
    }));

    const colors = severityOrder.map(severity => severityColors[severity]);

    return {
      categories: thirdParties,
      series: series,
      colors: colors
    };
  }, [apiResponse]);

  const chartOptions: ApexCharts.ApexOptions = useMemo(() => ({
    chart: {
      type: 'bar',
      height: 350,
      stacked: true, // Enable stacked bars
      toolbar: { show: false },
      background: 'transparent',
      foreColor: isDark ? '#f8fafc' : '#334155',
      zoom: { enabled: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '60%',
        // Removed distributed as we use series colors
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
        trim: true, // Trim long labels
        // rotate: -45, // Optional rotation if needed
        // hideOverlappingLabels: true,
      },
      axisBorder: { color: isDark ? '#374151' : '#e5e7eb' },
      axisTicks: { color: isDark ? '#374151' : '#e5e7eb' },
    },
    yaxis: {
      title: {
        text: 'Threat Count',
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
    colors: chartData.colors, // Assign colors based on severity order
    tooltip: {
      shared: true,
      intersect: false,
      theme: isDark ? 'dark' : 'light',
      y: {
        formatter: function (val, { seriesIndex, dataPointIndex, w }) {
          // Get the third party name (category) and severity name (series name)
          const severityName = w.globals.seriesNames[seriesIndex];
          return `${val} ${severityName} threats`;
        }
      },
      style: { fontFamily: 'inherit', fontSize: '12px' }
    },
    grid: {
      show: false
    },
    legend: {
        show: true, // Show legend for severity levels
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
    // Check if there are any categories (third parties) to display
    if (!chartData || chartData.categories.length === 0) return <div className="text-center text-muted-foreground py-8">No third party threat data available.</div>;
    // Check if all series data sums to zero (no threats)
    const totalThreats = chartData.series.reduce((sum, series) => sum + series.data.reduce((s, val) => s + val, 0), 0);
    if (totalThreats === 0) return <div className="text-center text-muted-foreground py-8">No third party threats found for the selected period.</div>;

    return <ApexChart type="bar" height={350} options={chartOptions} series={chartData.series} />;
  };

  return (
    <Card className={`flex-1 ${isDark ? "bg-[#171727] border-0" : "bg-white"}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col space-y-1.5">
          <CardTitle>Third Party Threat Intelligence</CardTitle>
          <CardDescription>Threat count by third party and severity</CardDescription>
        </div>
        <Link href="/dashboard/reports/third-party-threat-intelligence">
          <Button variant="outline" size="sm">Manage All</Button>
        </Link>
      </CardHeader>
      <CardContent className="pt-2">
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default ThirdPartyThreatIntelligenceChart;
