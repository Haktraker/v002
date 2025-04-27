'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, Terminal } from 'lucide-react';
import { RiskAssessmentByBu, SeverityLevelName } from '@/lib/api/types';

const ApexChart = dynamic(() => import('@/components/ui/apex-chart'), { ssr: false });

// Define severity levels and corresponding colors for consistent ordering and display
const SEVERITY_LEVELS: SeverityLevelName[] = ["Critical", "High", "Medium", "Low"];
const SEVERITY_COLORS: { [key in SeverityLevelName]: string } = {
  Critical: '#dc2626', // Red-600
  High: '#f97316',     // Orange-500
  Medium: '#facc15',   // Yellow-400
  Low: '#3b82f6'       // Blue-500
};

interface RiskAssessmentByBuChartProps {
  data?: RiskAssessmentByBu[];
  isLoading?: boolean;
  error?: Error | null;
}

const RiskAssessmentByBuChart: React.FC<RiskAssessmentByBuChartProps> = ({ 
  data: assessmentData,
  isLoading,
  error
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Process data for stacked bar chart
  const chartData = useMemo(() => {
    if (!assessmentData || assessmentData.length === 0) {
      return { series: [], categories: [] };
    }

    // Flatten data to get all unique BU names across all records
    const allBus = assessmentData.flatMap(record => record.bu);
    const categories = Array.from(new Set(allBus.map(bu => bu.name))).sort();
    
    // Create series for each severity level
    const series = SEVERITY_LEVELS.map(level => ({
      name: level, // Use level name directly
      data: categories.map(buName => {
        // Sum the counts for this severity level and BU across all records
        const totalCount = assessmentData.reduce((sum, record) => {
          const buData = record.bu.find(b => b.name === buName);
          const severityData = buData?.severities.find(s => s.severity === level);
          return sum + (severityData?.count || 0);
        }, 0);
        return totalCount;
      })
    }));

    return { series, categories };
  }, [assessmentData]);

  // Configure chart options
  const chartOptions = useMemo((): ApexCharts.ApexOptions => {
    const textColor = `hsl(var(--muted-foreground))`;
    const gridBorderColor = `hsl(var(--border))`;
    const dataLabelColor = isDark ? '#fff' : '#333';
    const chartThemeMode = isDark ? 'dark' : 'light';

    return {
      chart: {
        type: 'bar',
        height: 350,
        stacked: true,
        // stackType: "100%", // Uncomment for 100% stacked bar
        toolbar: { show: false },
        background: 'transparent',
        foreColor: textColor,
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '60%',
          // borderRadius: 5, 
        },
      },
      dataLabels: {
        enabled: true, 
        style: { 
            fontSize: '10px', 
            fontFamily: 'inherit', 
            colors: [dataLabelColor] 
        },
        formatter: function (val) { // Only show label if value > 0
          return Number(val) > 0 ? Number(val).toFixed(0) : "";
        },
        dropShadow: { 
            enabled: true, top: 1, left: 1, blur: 1, color: '#000', opacity: 0.45
        }
      },
      stroke: {
        show: false,
      },
      xaxis: {
        categories: chartData.categories,
        labels: { 
            style: { colors: textColor, fontFamily: 'inherit' },
            rotate: -45, 
            hideOverlappingLabels: true,
        },
        axisBorder: { color: gridBorderColor },
        axisTicks: { color: gridBorderColor },
      },
      yaxis: {
        title: { 
            text: 'Risk Count', 
            style: { color: textColor, fontFamily: 'inherit' }
        },
        labels: { 
            style: { colors: textColor, fontFamily: 'inherit' },
        },
      },
      colors: SEVERITY_LEVELS.map(level => SEVERITY_COLORS[level]),
      fill: {
        opacity: 1
      },
      legend: {
        position: 'top',
        horizontalAlign: 'center',
        fontFamily: 'inherit',
        labels: { colors: dataLabelColor }, // Use data label color for legend text too
      },
      tooltip: {
        theme: chartThemeMode,
        y: {
          formatter: (val: number) => val.toFixed(0) + " risks"
        },
        style: { fontFamily: 'inherit' },
      },
      grid: { 
        show: true,
        borderColor: gridBorderColor,
        strokeDashArray: 3,
         yaxis: {
            lines: { show: true }
        },
        xaxis: {
            lines: { show: false }
        }, 
        padding: {
           left: 5,
           right: 15
        }
      },
    };
  }, [isDark, chartData.categories]);

  const renderContent = () => {
    if (isLoading) {
      return <Skeleton className="h-[350px] w-full" />;
    }

    if (error) {
      return (
        <Alert variant="destructive" className="h-[350px] flex flex-col justify-center">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error Loading Chart</AlertTitle>
          <AlertDescription>
            Failed to load Risk Assessment data: {error?.message || 'Unknown error'}
          </AlertDescription>
        </Alert>
      );
    }

    // Check if there's any data to display *after* processing
    const hasData = chartData.series.some(s => s.data.some(d => d > 0));
    if (!hasData) { 
      return (
        <Alert className="border-none h-[350px] flex flex-col justify-center">
          <Info className="h-4 w-4" />
          <AlertTitle>No Data Available</AlertTitle>
          <AlertDescription>
            No Risk Assessment data available to display for the selected filters.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="h-[350px]"> 
        <ApexChart
          options={chartOptions}
          series={chartData.series}
          type="bar"
          height="100%"
        />
       </div>
    );
  };

  return (
    <Card className={`flex-1 flex flex-col ${isDark ? "bg-[#171727] border-0" : "bg-white"}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col space-y-1.5">
          <CardTitle className="text-base font-medium">Risk Assessment by BU</CardTitle>
          <CardDescription>Risk counts by severity per Business Unit</CardDescription>
        </div>
        <Link href="/dashboard/business-units-security/risk-assessment-by-bu">
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

export default RiskAssessmentByBuChart;
