'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ComplianceRiskDistribution, SeverityName } from '@/lib/api/types';

// Dynamically import ApexCharts
const ApexChart = dynamic(() => import('@/components/ui/apex-chart'), { ssr: false });

// Define severity levels and corresponding colors for consistent ordering and display
const SEVERITY_LEVELS: SeverityName[] = ["Low", "Medium", "High", "Critical"];
const SEVERITY_COLORS: { [key in SeverityName]: string } = {
  Low: '#3b82f6',      // Blue
  Medium: '#facc15',   // Yellow
  High: '#f97316',     // Orange
  Critical: '#dc2626' // Red
};

interface ComplianceRiskDistributionChartProps {
  data?: ComplianceRiskDistribution[];
  isLoading?: boolean;
  error?: any;
}

const ComplianceRiskDistributionChart = ({ 
  data,
  isLoading,
  error
}: ComplianceRiskDistributionChartProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const chartData = useMemo(() => {
    // Aggregate scores for each severity level across all BUs
    const aggregatedScores: { [key in SeverityName]: number } = {
      Low: 0,
      Medium: 0,
      High: 0,
      Critical: 0
    };

    // Iterate over all data entries (e.g., different months/years if applicable)
    if (data && data.length > 0) {
      data.forEach(performanceData => {
        // Iterate over Business Units within each data entry
        if (performanceData.bu && performanceData.bu.length > 0) {
          performanceData.bu.forEach(bu => {
            if (bu.severity && bu.severity.severityName in aggregatedScores) {
              aggregatedScores[bu.severity.severityName] += bu.severity.score;
            }
          });
        }
      });
    }

    // Check if any data was aggregated
    const hasData = Object.values(aggregatedScores).some(score => score > 0);
    if (!hasData) {
      return { series: [], labels: [] };
    }

    // Prepare data in the format ApexCharts expects for Donut
    const series = SEVERITY_LEVELS.map(level => aggregatedScores[level]);
    const labels = SEVERITY_LEVELS;

    return { series, labels };
  }, [data]);

  const chartOptions = useMemo(() => ({
    chart: {
      type: 'donut',
      height: 350,
      background: 'transparent',
      foreColor: isDark ? '#f8fafc' : '#334155',
      toolbar: { show: false },
    },
    series: chartData.series,
    labels: chartData.labels,
    colors: SEVERITY_LEVELS.map(level => SEVERITY_COLORS[level]),
    plotOptions: {
      pie: {
        donut: {
          size: '65%', // Adjust donut thickness
          labels: {
            show: true,
            name: {
              show: true,
              offsetY: -10,
              color: isDark ? '#9ca3af' : '#6b7280'
            },
            value: {
              show: true,
              offsetY: 10,
              fontSize: '22px',
              fontWeight: 600,
              color: isDark ? '#f8fafc' : '#334155',
              formatter: (val: string) => val // Display the raw score
            },
            total: {
              show: true,
              showAlways: true,
              label: 'Total Score',
              fontSize: '14px',
              fontWeight: 400,
              color: isDark ? '#9ca3af' : '#6b7280',
              formatter: (w: any) => {
                // Calculate sum of all series values
                return w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
              }
            }
          }
        }
      }
    },
    // Enable gradient fill
    fill: {
      type: 'gradient',
      gradient: {
         shade: isDark ? 'dark' : 'light',
         type: "vertical",
         shadeIntensity: 0.5,
         inverseColors: true,
         opacityFrom: 1,
         opacityTo: 0.8,
         stops: [0, 100]
      }
    },
    stroke: {
        width: 0, // No border around segments
    },
    dataLabels: {
      enabled: false // Keep donut clean, show details in tooltip/legend
    },
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      fontSize: '13px',
      fontFamily: 'inherit',
      labels: { colors: isDark ? '#f8fafc' : '#334155' },
      itemMargin: { horizontal: 10, vertical: 5 },
       markers: {
          width: 12,
          height: 12,
          radius: 12,
       },
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      fillSeriesColor: false, // Use tooltip theme background
      y: {
        formatter: (val: number) => val.toFixed(0), // Show score in tooltip
        title: {
          formatter: (seriesName: string) => `${seriesName}:`
        }
      }
    },
  }), [isDark, chartData]);

  const renderContent = () => {
    if (isLoading) {
      return <Skeleton className="h-[350px] w-full rounded-full" />;
    }

    if (error) {
      return (
        <div className="text-destructive-foreground bg-destructive p-4 rounded-md text-sm">
          Error loading risk distribution data: {error.message || 'Unknown error'}
        </div>
      );
    }

    // Also check if all series values are 0, indicating no scores found
    if (!chartData || chartData.series.length === 0 || chartData.series.every(s => s === 0)) {
      return (
        <div className="text-center text-muted-foreground py-8 text-sm h-[350px] flex items-center justify-center">
          No compliance risk distribution data available to display.
        </div>
      );
    }

    return (
      <ApexChart
        options={chartOptions}
        series={chartData.series} // Pass series here, not in options for donut
        type="donut"
        height={350}
      />
    );
  };

  return (
    <Card className={`flex-1 flex flex-col ${isDark ? 'bg-[#171727] border-0' : 'bg-white'}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col space-y-1.5">
          <CardTitle className="text-base font-medium">Compliance Risk Distribution</CardTitle>
          <CardDescription>Aggregated scores by severity level.</CardDescription>
        </div>
        <Link href="/dashboard/cybersecurity-compliance-dashboard/compliance-risk-distribution">
          <Button variant="outline" >
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

export default ComplianceRiskDistributionChart;
