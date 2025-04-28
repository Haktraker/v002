'use client';

import React, { useMemo } from 'react';
import { SocTeamPerformanceTeam } from '@/lib/api/types'; // Corrected import path
import ApexChart from '@/components/ui/apex-chart';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Info } from 'lucide-react';
import { useTheme } from 'next-themes';

interface SocTeamPerformanceChartProps {
  data?: SocTeamPerformanceTeam[];
  isLoading?: boolean;
  error?: Error | string | null;
}

const SocTeamPerformanceChart: React.FC<SocTeamPerformanceChartProps> = ({
  data,
  isLoading = false,
  error = null
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // --- Data Transformation ---
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return { series: [], categories: [] };
    }

    const categoriesSet = new Set<string>();
    const resolutionRateData: { x: string; y: number }[] = [];
    const accuracyData: { x: string; y: number }[] = [];

    data.forEach(team => {
      if (team.bu && team.bu.length > 0) {
        team.bu.forEach(buDetail => {
          const category = `${team.teamName} - ${buDetail.buName}`;
          categoriesSet.add(category);
          resolutionRateData.push({
            x: category,
            y: Math.round((buDetail.resolutionRate || 0) * 100) // Convert to percentage
          });
          accuracyData.push({
            x: category,
            y: Math.round((buDetail.accuracy || 0) * 100) // Convert to percentage
          });
        });
      }
    });

    const categories = Array.from(categoriesSet);

    const series = [
      {
        name: 'Resolution Rate (%)',
        data: categories.map(cat => resolutionRateData.find(d => d.x === cat)?.y ?? 0)
      },
      {
        name: 'Accuracy (%)',
        data: categories.map(cat => accuracyData.find(d => d.x === cat)?.y ?? 0)
      }
    ];

    return { series, categories };

  }, [data]);

  // --- Chart Options ---
  const options = useMemo(() => {
    return {
      chart: {
        type: 'bar',
        height: 350,
        stacked: false, // Grouped bars
        toolbar: { show: true, tools: { download: true, selection: false, zoom: false, zoomin: false, zoomout: false, pan: false, reset: true } },
        foreColor: isDark ? '#f8fafc' : '#334155',
        background: 'transparent',
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%', // Adjust width as needed
          endingShape: 'rounded' // Optional: rounded bars
        },
      },
      dataLabels: {
        enabled: false // Disable data labels on bars for cleaner look
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      xaxis: {
        categories: chartData.categories,
        title: { text: 'Team - Business Unit', style: { color: isDark ? '#e5e7eb' : '#374151' } },
        labels: {
          style: { colors: isDark ? '#e5e7eb' : '#374151' },
          rotate: -45, // Rotate labels if they overlap
          trim: true,
          hideOverlappingLabels: true,
        },
         tickPlacement: 'on'
      },
      yaxis: {
        title: { text: 'Percentage (%)', style: { color: isDark ? '#e5e7eb' : '#374151' } },
        min: 0,
        max: 100, // Set max to 100 for percentage
        labels: {
          style: { colors: isDark ? '#e5e7eb' : '#374151' },
          formatter: function (val: number) {
             return val.toFixed(0); // Format as integer percentage
          }
        }
      },
      fill: {
        opacity: 1
      },
      tooltip: {
        theme: isDark ? 'dark' : 'light',
        y: {
          formatter: function (val: number) {
            return val + "%"; // Add percentage sign
          }
        }
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        labels: { colors: isDark ? '#e5e7eb' : '#374151' }
      },
      colors: ['#3B82F6', '#10B981'], // Example colors: Blue for Resolution, Green for Accuracy
      responsive: [{
        breakpoint: 992, // Adjust breakpoint if needed
        options: {
           xaxis: {
             labels: {
               rotate: -65,
             }
           },
           legend: { position: 'bottom' }
        }
      },{
         breakpoint: 768,
         options: {
             chart: { height: 300 },
             xaxis: {
               labels: {
                 rotate: -90,
                 style: { fontSize: '10px' }
               }
             }
         }
      }]
    };
  }, [chartData.categories, isDark]);

  // --- Render Logic ---
  const renderContent = () => {
    if (isLoading) {
      return <Skeleton className="h-[350px] w-full" />;
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Chart</AlertTitle>
          <AlertDescription>
            {typeof error === 'string' ? error : error.message || "An unknown error occurred."}
          </AlertDescription>
        </Alert>
      );
    }

    if (!chartData.series || chartData.series.length === 0 || chartData.categories.length === 0) {
      return (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>No Data Available</AlertTitle>
          <AlertDescription>
            There is no SOC team performance data to display.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <ApexChart
        type="bar"
        height={350}
        options={options}
        series={chartData.series}
      />
    );
  };

  // --- Component Structure ---
  return (
    <Card className={`flex-1 flex flex-col ${isDark ? "bg-[#171727] border-0" : "bg-white"}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">
          SOC Team Performance (Rate & Accuracy by BU)
        </CardTitle>
        {/* Placeholder for potential filters or actions */}
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default SocTeamPerformanceChart;
