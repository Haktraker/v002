'use client';

import { useMemo } from 'react';
import { useTheme } from 'next-themes';
import ApexChart from '@/components/ui/apex-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    useGetSupplyChainThreatExposures
} from '@/lib/api/endpoints/reports/supply-chain-threat-exposure';
import type {
    SupplyChainThreatExposureQueryParams,
    SeverityLevel
} from '@/lib/api/reports-types/types'; // Ensure type import
import { useGlobalFilter } from '@/lib/context/GlobalFilterContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Define colors for severity levels
const severityLevelColors: Record<SeverityLevel, string> = {
  low: '#22c55e',      // Green
  medium: '#f59e0b',   // Amber
  high: '#ef4444',     // Red
  critical: '#8b5cf6', // Violet (same as Digital Risk)
};

// Order for stacking and legend
const severityLevelOrder: SeverityLevel[] = ['low', 'medium', 'high', 'critical'];

// Helper to format labels (e.g., capitalize)
const formatLabel = (label: string): string => {
    return label.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const SupplyChainThreatExposureChart = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { selectedMonth, selectedYear } = useGlobalFilter();

  const queryParams: SupplyChainThreatExposureQueryParams = useMemo(() => ({
    month: selectedMonth === 'All' ? undefined : selectedMonth,
    year: selectedYear === 'All' ? undefined : selectedYear,
  }), [selectedMonth, selectedYear]);

  const { data: apiResponse, isLoading, error } = useGetSupplyChainThreatExposures(queryParams);

  const chartData = useMemo(() => {
    if (!apiResponse?.data) {
      return { categories: [], series: [], colors: [] };
    }

    // Extract unique chains for categories
    const uniqueChains = Array.from(new Set(apiResponse.data.map(item => item.chain).filter(Boolean)));
    uniqueChains.sort(); // Optional: sort chains alphabetically

    // Initialize counts for each chain and severity level
    const threatsByChain: Record<string, Record<SeverityLevel, number>> = 
        uniqueChains.reduce((acc, chainName) => {
            acc[chainName] = severityLevelOrder.reduce((lvlAcc, level) => {
                lvlAcc[level] = 0;
                return lvlAcc;
            }, {} as Record<SeverityLevel, number>);
            return acc;
        }, {} as Record<string, Record<SeverityLevel, number>>);

    // Group threats by chain and count severity levels
    apiResponse.data.forEach(item => {
        if (item.chain && item.chain in threatsByChain) { // Ensure chain exists
            if (item.severity in threatsByChain[item.chain]) { // Ensure severity level is valid
                 threatsByChain[item.chain][item.severity]++;
            }
        }
    });

    // Prepare series for stacked bar chart
    const series = severityLevelOrder.map(level => ({
      name: formatLabel(level), // Capitalize level name for legend
      data: uniqueChains.map(chainName => threatsByChain[chainName]?.[level] || 0) // Handle if chainName might not be in threatsByChain after filtering
    }));

    const colors = severityLevelOrder.map(level => severityLevelColors[level]);
    const categories = uniqueChains.map(formatLabel); // Use formatted labels for X-axis

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
        formatter: (val) => Number.isInteger(val) ? val.toFixed(0) : '' // Ensure only whole numbers are displayed
      },
    },
    fill: {
      opacity: 1
    },
    colors: chartData.colors, 
    tooltip: {
      shared: true,
      intersect: false,
      theme: isDark ? 'dark' : 'light',
      y: {
        formatter: function (val, { seriesIndex, dataPointIndex, w }) {
          const severityLevelName = w.globals.seriesNames[seriesIndex];
          return `${val} ${severityLevelName} threat(s)`;
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
    if (error) return <div className="text-destructive-foreground bg-destructive p-4 rounded-md">Error loading data: {error.message || 'Unknown error'}</div>;
    if (!chartData || chartData.categories.length === 0) return <div className="text-center text-muted-foreground py-8">No supply chain threat data available for the selected period.</div>;
    const totalThreats = chartData.series.reduce((sum, seriesItem) => sum + seriesItem.data.reduce((s, val) => s + (val || 0), 0), 0);
    if (totalThreats === 0) return <div className="text-center text-muted-foreground py-8">No supply chain threats found for the selected period.</div>;

    return <ApexChart type="bar" height={350} options={chartOptions} series={chartData.series} />;
  };

  return (
    <Card className={`flex-1 ${isDark ? "bg-[#171727] border-0" : "bg-white"}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col space-y-1.5">
          <CardTitle>Supply Chain Threat Exposure</CardTitle>
          <CardDescription>Threat count by chain and severity</CardDescription>
        </div>
        <Link href="/dashboard/reports/supply-chain-threat-exposure">
          <Button variant="outline" size="sm">Manage All</Button>
        </Link>
      </CardHeader>
      <CardContent className="pt-2">
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default SupplyChainThreatExposureChart;
