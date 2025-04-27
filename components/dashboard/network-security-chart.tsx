'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { NetworkSecurity, NetworkSecurityActivityName, NetworkSecurityBu } from '@/lib/api/types';
import { useTheme } from 'next-themes';

// Dynamically import ApexCharts
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

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

  const [chartOptions, setChartOptions] = useState<ApexOptions>({});
  const [chartSeries, setChartSeries] = useState<ApexAxisChartSeries>([]);

  useEffect(() => {
    if (networkSecurityData && networkSecurityData.length > 0) {
      let finalCategories: string[] = [];
      let finalSeries: ApexAxisChartSeries = [];
      let allActivityNames = new Set<NetworkSecurityActivityName>();

      if (networkSecurityData.length === 1) {
        // --- Scenario 1: Single Data Entry --- 
        const singleEntry = networkSecurityData[0];
        if (singleEntry.bu && singleEntry.bu.length > 0) {
          finalCategories = singleEntry.bu.map(bu => bu.buName);
          // Collect activity names from the first BU (assuming consistent activities across BUs)
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
        // --- Scenario 2: Multiple Data Entries (Aggregate) --- 
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

        finalCategories = Array.from(allBuNames).sort(); // Sort BU names alphabetically for consistency
        const activityNamesArray = Array.from(allActivityNames);

        if (activityNamesArray.length > 0 && finalCategories.length > 0) {
            finalSeries = activityNamesArray.map(activityName => ({
                name: activityName,
                data: finalCategories.map(buName => aggregatedScores[buName]?.[activityName] || 0)
            }));
        }
      }

      // --- Update Chart Options (Common for both scenarios) --- 
      if (finalSeries.length > 0 && finalCategories.length > 0) {
          const textColor = isDark ? 'hsl(var(--muted-foreground))' : '#666'; 
          const gridBorderColor = isDark ? 'hsl(var(--border))' : '#f1f1f1';
          const dataLabelColor = isDark ? 'hsl(var(--foreground))' : '#304758';
          const chartThemeMode = isDark ? 'dark' : 'light';

          setChartSeries(finalSeries);
          setChartOptions({
            chart: {
              type: 'bar',
              height: 350,
              stacked: false, // Keep as false for grouped bar chart
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
              style: { fontSize: '12px', colors: [dataLabelColor] }, 
              formatter: (val) => val + "",
            },
            stroke: {
              show: true,
              width: 2,
              colors: ['transparent'],
            },
            xaxis: {
              categories: finalCategories,
              title: { text: 'Business Units', style: { color: textColor } },
              labels: { style: { colors: textColor } },
              axisBorder: { color: gridBorderColor },
              axisTicks: { color: gridBorderColor },
            },
            yaxis: {
              title: { text: 'Score', style: { color: textColor } },
              labels: { style: { colors: textColor } },
            },
            fill: { opacity: 1 },
            tooltip: {
              theme: chartThemeMode, 
              y: { formatter: (val) => val + " score" },
              // shared: false, // Keep tooltip per series/activity
              // intersect: true, // Require hover on bar for tooltip
            },
            legend: {
              position: 'top',
              horizontalAlign: 'center',
              offsetY: 10,
              labels: { colors: textColor }, 
            },
            grid: { 
                show:false,
            },
            colors: BU_COLORS, 
          });
      } else {
         // Handle case where no valid data could be processed
         setChartSeries([]);
         setChartOptions({});
      }
    } else {
        // Handle case where networkSecurityData is initially undefined or becomes empty
        setChartSeries([]);
        setChartOptions({});
    }
  // Update options when data or theme changes
  }, [networkSecurityData, isDark]); 

  if (isLoading) {
    return (
      <div className="p-4 border rounded-lg shadow-sm">
        <Skeleton className="h-8 w-1/4 mb-4" />
        <Skeleton className="h-[350px] w-full" />
      </div>
    );
  }

  if (error) { 
    return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load network security data: {error?.message || 'Unknown error'}
        </AlertDescription>
      </Alert>
    );
  }

  if (!isLoading && chartSeries.length === 0) {
     return (
      <Alert>
        <Terminal className="h-4 w-4" />
        <AlertTitle>No Data</AlertTitle>
        <AlertDescription>
          No network security data available to display for the selected filters.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-4 border rounded-lg shadow-sm      ">
       <h2 className="text-lg font-semibold mb-4">Network Security Activity</h2>
      {typeof window !== 'undefined' && chartOptions.chart && chartSeries.length > 0 ? (
        <Chart options={chartOptions} series={chartSeries} type="bar" height={350} />
      ) : (
         <Skeleton className="h-[350px] w-full" /> 
      )}
    </div>
  );
};

export default NetworkSecurityChart;
