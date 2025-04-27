'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Info } from 'lucide-react';
import { NetworkSecurity, NetworkSecurityActivityName } from '@/lib/api/types';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Dynamically import ApexCharts - use the wrapper from ui if available
// const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });
const ApexChart = dynamic(() => import('@/components/ui/apex-chart'), { ssr: false });

// Define 19 distinct colors
const BU_COLORS = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', 
  '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
  '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5',
  '#c49c94', '#f7b6d2', '#c7c7c7', '#dbdb8d'
];

// Define props interface
interface NetworkSecurityChartProps {
  data: NetworkSecurity[] | undefined;
  isLoading: boolean;
  error: Error | null;
}

const NetworkSecurityChart: React.FC<NetworkSecurityChartProps> = ({ data: networkSecurityData, isLoading, error }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Calculate series and categories using useMemo
  const { series: chartSeries, categories: chartCategories } = useMemo(() => {
    let finalCategories: string[] = [];
    let finalSeries: ApexAxisChartSeries = [];
    let allActivityNames = new Set<NetworkSecurityActivityName>();

    if (networkSecurityData && networkSecurityData.length > 0) {
        if (networkSecurityData.length === 1) {
            // Single Data Entry
            const singleEntry = networkSecurityData[0];
            if (singleEntry.bu && singleEntry.bu.length > 0) {
                finalCategories = singleEntry.bu.map(bu => bu.buName);
                singleEntry.bu[0]?.activity?.forEach(act => allActivityNames.add(act.activityName));
                const activityNamesArray = Array.from(allActivityNames);
                if (activityNamesArray.length > 0) {
                    finalSeries = activityNamesArray.map(activityName => ({
                        name: activityName,
                        data: singleEntry.bu.map(bu => {
                            const activity = bu.activity?.find(a => a.activityName === activityName);
                            return activity ? activity.score : 0;
                        }),
                    }));
                }
            }
        } else {
            // Multiple Data Entries (Aggregate)
            const aggregatedScores: { [buName: string]: { [activityName in NetworkSecurityActivityName]?: number } } = {};
            const allBuNames = new Set<string>();
            networkSecurityData.forEach(entry => {
                entry.bu.forEach(bu => {
                    allBuNames.add(bu.buName);
                    if (!aggregatedScores[bu.buName]) {
                        aggregatedScores[bu.buName] = {};
                    }
                    bu.activity.forEach(act => {
                        allActivityNames.add(act.activityName);
                        aggregatedScores[bu.buName][act.activityName] = 
                            (aggregatedScores[bu.buName][act.activityName] || 0) + act.score;
                    });
                });
            });
            finalCategories = Array.from(allBuNames).sort(); 
            const activityNamesArray = Array.from(allActivityNames);
            if (activityNamesArray.length > 0 && finalCategories.length > 0) {
                finalSeries = activityNamesArray.map(activityName => ({
                    name: activityName,
                    data: finalCategories.map(buName => aggregatedScores[buName]?.[activityName] || 0)
                }));
            }
        }
    }
    return { series: finalSeries, categories: finalCategories };
  }, [networkSecurityData]);

  // Calculate chart options using useMemo
  const chartOptions = useMemo((): ApexOptions => {
    const textColor = `hsl(var(--muted-foreground))`; // Use theme variable
    const gridBorderColor = `hsl(var(--border))`; // Use theme variable
    const dataLabelColor = `hsl(var(--foreground))`; // Use theme variable
    const chartThemeMode = isDark ? 'dark' : 'light';

    return {
        chart: {
          type: 'bar',
          height: 350,
          stacked: false, 
          toolbar: { show: false },
          foreColor: textColor,
          background: 'transparent',
        },
        theme: {
            mode: chartThemeMode 
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '55%',
            borderRadius: 5,
            dataLabels: { position: 'top' },
          },
        },
        dataLabels: {
          enabled: true,
          offsetY: -20,
          style: { fontSize: '12px', colors: [dataLabelColor], fontFamily: 'inherit' }, 
          formatter: (val) => val + "",
        },
        stroke: {
          show: false, // Typically false for bar charts unless desired
          width: 2,
          colors: ['transparent'],
        },
        xaxis: {
          categories: chartCategories, // Use calculated categories
          title: { text: 'Business Units', style: { color: textColor, fontFamily: 'inherit' } },
          labels: { style: { colors: textColor, fontFamily: 'inherit' } },
          axisBorder: { color: gridBorderColor },
          axisTicks: { color: gridBorderColor },
        },
        yaxis: {
          title: { text: 'Score', style: { color: textColor, fontFamily: 'inherit' } },
          labels: { style: { colors: textColor, fontFamily: 'inherit' } },
          min: 10 
        },
        fill: { 
            opacity: 1,
            // Use the BU_COLORS array directly
            colors: BU_COLORS, 
        },
        tooltip: {
          theme: chartThemeMode, 
          y: { formatter: (val) => val + " score" },
          style: { fontFamily: 'inherit', fontSize: '12px' },
        },
        legend: {
          position: 'top',
          horizontalAlign: 'center',
          offsetY: 10,
          fontSize: '13px',
          fontFamily: 'inherit',
          labels: { colors: dataLabelColor }, // Use foreground color for legend labels
          itemMargin: { horizontal: 10, vertical: 5 },
        },
        grid: { 
            show: false,
            borderColor: gridBorderColor, 
        },
        // Colors are now handled by fill.colors
        // colors: BU_COLORS, 
      };
  }, [isDark, chartCategories]); // Depend on theme and categories

  // --- Render Logic --- 
  const renderContent = () => {
    if (isLoading) {
      return <Skeleton className="h-[350px] w-full" />;
    }
  
    if (error) { 
      return (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error Loading Chart</AlertTitle>
          <AlertDescription>
            Failed to load network security data: {error?.message || 'Unknown error'}
          </AlertDescription>
        </Alert>
      );
    }
  
    // Show No Data if, after loading, the final series is empty
    if (chartSeries.length === 0) { 
       return (
        <Alert className="border-none">
          <Info className="h-4 w-4" />
          <AlertTitle>No Data Available</AlertTitle>
          <AlertDescription>
            No network security data available to display for the selected filters.
          </AlertDescription>
        </Alert>
      );
    }

    // Render the chart using ApexChart wrapper
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
          <CardTitle className="text-base font-medium">Network Security Activity</CardTitle>
          <CardDescription>Scores by Business Unit</CardDescription>
        </div>
        <Link href="/dashboard/business-units-security/network-security">
          <Button variant="outline" size="sm"> 
            Manage All
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center pt-4">
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default NetworkSecurityChart;
